# PG Delivery — Pequeno Gigante Delivery

Ecossistema de delivery (cliente, entregador, restaurante, admin) com backend orientado a eventos, painel web e app mobile.

```
pg-delivery/
├── docs/        # Documentação oficial (arquitetura, BD, APIs, eventos, design system, roadmaps, custos...)
├── backend/     # NestJS + Prisma + Kafka (monorepo modular, pronto para extrair microsserviços)
├── web/         # Next.js 15 — Painel do Restaurante e Admin Master
├── mobile/      # Flutter 3 — App do Cliente (base compartilhada com o App do Entregador)
└── infra/       # Docker Compose, Kubernetes, Terraform (AWS)
.github/workflows/ci.yml  # CI/CD: lint, testes, Sonar, Trivy, Gitleaks, build, deploy
```

## Começando (ambiente local)

```bash
# 1. Infra local: Postgres, Redis, Kafka (Redpanda), Jaeger, Grafana
cd infra/docker && docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
psql postgresql://pg:pg@localhost:5432/pgdelivery -f prisma/sql/001_postgis_indexes_partitions.sql
npm run db:seed
npm run start:dev          # http://localhost:3000/api/docs (Swagger)

# 3. Web
cd web && npm install && npm run dev   # http://localhost:3001

# 4. Mobile (gera as pastas android/ios na primeira vez)
cd mobile && flutter create --platforms=android,ios --org br.com.pgdelivery . \
  && flutter pub get && flutter test && flutter run --dart-define=API_URL=http://10.0.2.2:3000/v1
```

## Documentação

Comece por [`docs/00-indice.md`](docs/00-indice.md). Ela mapeia os 26 entregáveis da especificação para os arquivos deste repositório.

## Decisões principais (resumo)

| Tema | Decisão | Por quê |
|---|---|---|
| Mensageria | **Kafka** (MSK) como barramento de eventos de domínio + **SQS** para filas de tarefas | Replay, ordenação por chave (`orderId`), alto volume de GPS, múltiplos consumidores (BI, IA, antifraude) |
| Topologia no MVP | **Monólito modular** com fronteiras dos 12 serviços; extração progressiva | Equipe pequena entrega mais rápido; as fronteiras DDD já ficam prontas para separar |
| Orquestração | **ECS Fargate** no MVP/V1 → **EKS** a partir da V2 | Menos custo operacional no início; EKS quando houver dezenas de serviços |
| Tracking | WebSocket (Socket.IO + Redis adapter) + Redis GEO | Latência < 1s e consulta espacial barata |
| Pagamentos | Gateway principal **Asaas/Mercado Pago (PIX + split)**, Stripe como secundário | Split nativo e PIX com custo menor no Brasil |
