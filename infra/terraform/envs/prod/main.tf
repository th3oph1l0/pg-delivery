# PG Delivery — produção (sa-east-1). Fase MVP/V1: ECS Fargate + RDS + ElastiCache + MSK Serverless.
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.80" }
  }
  backend "s3" {
    bucket         = "pg-delivery-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "pg-delivery-tflock"
    encrypt        = true
  }
}

provider "aws" {
  region = "sa-east-1"
  default_tags { tags = { Project = "pg-delivery", Env = "prod", ManagedBy = "terraform" } }
}

locals {
  name = "pg-prod"
  azs  = ["sa-east-1a", "sa-east-1b", "sa-east-1c"]
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.16"

  name             = local.name
  cidr             = "10.20.0.0/16"
  azs              = local.azs
  public_subnets   = ["10.20.0.0/22", "10.20.4.0/22", "10.20.8.0/22"]
  private_subnets  = ["10.20.32.0/20", "10.20.48.0/20", "10.20.64.0/20"]
  database_subnets = ["10.20.96.0/24", "10.20.97.0/24", "10.20.98.0/24"]

  enable_nat_gateway     = true
  one_nat_gateway_per_az = true
  enable_dns_hostnames   = true
}

# ── Banco ───────────────────────────────────────────────
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.10"

  identifier                  = "${local.name}-pg"
  engine                      = "postgres"
  engine_version              = "16.4"
  family                      = "postgres16"
  major_engine_version        = "16"
  instance_class              = "db.r7g.large"
  allocated_storage           = 100
  max_allocated_storage       = 1000
  storage_type                = "gp3"
  storage_encrypted           = true
  multi_az                    = true
  db_name                     = "pgdelivery"
  username                    = "pg_admin"
  manage_master_user_password = true # senha gerada e rotacionada no Secrets Manager
  db_subnet_group_name        = module.vpc.database_subnet_group_name
  vpc_security_group_ids      = [aws_security_group.db.id]
  backup_retention_period     = 14
  deletion_protection         = true
  performance_insights_enabled = true
  monitoring_interval         = 30
  create_monitoring_role      = true
  parameters = [
    { name = "shared_preload_libraries", value = "pg_stat_statements", apply_method = "pending-reboot" },
    { name = "log_min_duration_statement", value = "500" },
  ]
}

resource "aws_security_group" "db" {
  name   = "${local.name}-db"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

resource "aws_security_group" "app" {
  name   = "${local.name}-app"
  vpc_id = module.vpc.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ── Cache ───────────────────────────────────────────────
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name}-redis"
  description                = "PG Delivery cache, GEO, rate-limit, socket.io adapter"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.r7g.large"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.app.id]
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name}-redis"
  subnet_ids = module.vpc.private_subnets
}

# ── Mensageria ──────────────────────────────────────────
resource "aws_msk_serverless_cluster" "kafka" {
  cluster_name = "${local.name}-kafka"
  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.app.id]
  }
  client_authentication {
    sasl { iam { enabled = true } }
  }
}

# ── Compute (ECS Fargate) ───────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecr_repository" "api" {
  name                 = "pg-api"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "KMS" }
}

# Task definition, service, ALB, WAF, CloudFront e alarmes ficam em módulos dedicados
# (modules/ecs-service, modules/edge) para reuso entre staging e prod.

output "rds_endpoint" { value = module.rds.db_instance_endpoint }
output "redis_endpoint" { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
output "msk_arn" { value = aws_msk_serverless_cluster.kafka.arn }
