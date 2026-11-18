# 12 — Estimativa de Custos AWS

> **Premissas.** Região **sa-east-1 (São Paulo)**, que custa cerca de 30–60% mais que us-east-1, em preços on-demand de referência. Valores em **USD/mês**, arredondados. **São ordens de grandeza para planejamento**: antes de aprovar o orçamento, valide no [AWS Pricing Calculator](https://calculator.aws/) com a cotação do dia e negocie Savings Plans (−20 a −40% em compute e RDS) e créditos do AWS Activate para startups (até US$ 100 mil).

## Cenários

| | **MVP** | **V1** | **V2** |
|---|---|---|---|
| Cidades | 1 | 3 | 10–15 |
| Pedidos/mês | ~6 mil | ~60 mil | ~600 mil |
| Usuários simultâneos (pico) | ~500 | ~5 mil | ~50 mil |
| Entregadores online (pico) | ~80 | ~600 | ~5 mil |

## Detalhamento

| Serviço | MVP | V1 | V2 | Configuração de referência |
|---|---:|---:|---:|---|
| **ECS Fargate** (API, realtime, workers, web) | 180 | 650 | — | MVP: ~6 tasks de 0,5 vCPU/1 GB; V1: ~20 tasks com autoscaling |
| **EKS** (control plane + nós EC2 via Karpenter, ~50% spot) | — | — | 3.200 | 1 cluster (~US$ 73) + ~25–40 nós m7g/c7g |
| **RDS PostgreSQL** | 260 | 900 | — | MVP: db.t4g.large Multi-AZ, 100 GB gp3; V1: db.r7g.large Multi-AZ + 1 réplica |
| **Aurora PostgreSQL** | — | — | 3.500 | r7g.2xlarge writer + 2 readers, I/O-Optimized |
| **ElastiCache Redis** | 90 | 380 | 1.400 | MVP: cache.t4g.medium ×2; V2: cluster mode com 3 shards r7g.large + réplicas |
| **Amazon MSK** | 150 | 650 | 2.400 | MVP: MSK Serverless; V1: 3× kafka.m7g.large; V2: 6× m7g.xlarge |
| **OpenSearch** | — | 300 | 1.200 | V1: 2× r7g.large.search |
| **ALB/NLB** | 40 | 120 | 450 | Inclui LCUs |
| **CloudFront + S3** | 40 | 250 | 1.800 | Imagens de cardápio (WebP), web estático; V2 ≈ 15 TB/mês de saída |
| **Data transfer / NAT Gateway** | 80 | 350 | 1.600 | Use VPC endpoints para S3/ECR para reduzir NAT |
| **Route 53, ACM, WAF, Shield Std** | 40 | 120 | 450 | WAF + Bot Control cobrado por requisição |
| **SNS / SES** | 10 | 60 | 300 | O push sai via FCM (gratuito); o SNS fica para fan-out e SMS de fallback |
| **Secrets Manager / KMS** | 20 | 50 | 150 | |
| **CloudWatch** | 60 | 250 | 900 | Logs principais vão para o Loki, o que segura esse valor |
| **Observabilidade** (AMP/AMG ou Grafana Cloud) | 50 | 300 | 1.200 | |
| **Data lake** (S3, Glue, Athena / Redshift Serverless) | — | 150 | 1.500 | |
| **IA** (SageMaker endpoints, Bedrock para chatbot) | — | 150 | 1.800 | |
| **Backups / snapshots / DR** | 30 | 150 | 800 | V3: multi-região pode adicionar ~40% |
| **Total AWS (on-demand)** | **≈ 1.050** | **≈ 4.830** | **≈ 22.650** | |
| **Com Savings Plans/RIs** | ≈ 920 | ≈ 3.800 | ≈ 16.300 | |

## Custos fora da AWS (relevantes)

| Item | Referência |
|---|---|
| Google Maps Platform (Places, Geocoding, Routes, Maps SDK) | Costuma ser o 2º maior custo variável. Mitigue com cache de geocoding, autocomplete com *session tokens* e Mapbox/OSRM próprio para rotas internas. Estimativa: US$ 0,01–0,03 por pedido |
| SMS OTP (Twilio/Zenvia) | ~R$ 0,08–0,15 por SMS. Use o WhatsApp OTP e o login social para reduzir |
| Gateways de pagamento | % por transação (ver monetização). É o maior custo variável depois do entregador |
| Sentry, SonarQube Cloud, GitHub, Codemagic, PagerDuty | ~US$ 300–1.200/mês conforme o time |
| Apple Developer + Google Play | US$ 99/ano + US$ 25 (único) |

## Indicador-chave

**Custo de infraestrutura por pedido:** ~US$ 0,18 (MVP, ociosidade alta) → ~US$ 0,08 (V1) → ~US$ 0,04 (V2). Meta: ficar abaixo de 1% do ticket médio.

## Alavancas de economia

Graviton (ARM) em tudo (−20%) · Spot para workers e consumidores Kafka · desligar `staging` à noite (−60% no ambiente) · imagens WebP/AVIF com redimensionamento sob demanda · *rightsizing* mensal pelo Compute Optimizer · alertas do AWS Budgets por conta.
