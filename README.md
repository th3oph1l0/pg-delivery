<div align="center">

<img src="docs/assets/logo.svg" width="88" alt="Logo PG Delivery" />

# PG Delivery

### Pequeno Gigante Delivery · o delivery que nasce pequeno e pensa grande 🍔🛵

Ecossistema completo de delivery: **app do cliente**, **app do entregador**, **painel do restaurante** e **admin**,<br/>
sobre um backend orientado a eventos e pronto para virar microsserviços.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Flutter](https://img.shields.io/badge/Flutter_3-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
<br/>
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16_+_PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white)

![Status](https://img.shields.io/badge/status-MVP_em_constru%C3%A7%C3%A3o-FFC72C?style=flat-square)
![Versão](https://img.shields.io/badge/vers%C3%A3o-0.1.0-D91A27?style=flat-square)
![Idioma](https://img.shields.io/badge/feito_no-Brasil_🇧🇷-0E7A55?style=flat-square)

**[✨ Ver telas](#-telas)** ·
**[🚀 Rodar em 1 minuto](#-rodar-em-1-minuto)** ·
**[🏗️ Arquitetura](#️-arquitetura)** ·
**[🗺️ Roadmap](#️-roadmap)** ·
**[📚 Documentação](#-documentação)**

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/dashboard-dark.png" />
  <img src="docs/assets/dashboard.png" alt="Painel do restaurante: faturamento, pedidos, ticket médio, gráfico de pedidos por hora e insight de IA" width="900" />
</picture>

<sub>💡 A imagem acima segue o tema do seu GitHub: troque para o modo escuro e veja a versão noturna.</sub>

</div>

---

## 🍽️ O que é

O **PG Delivery** é uma plataforma de delivery pensada para começar numa cidade e crescer até virar operação nacional. São quatro produtos conversando com o mesmo backend:

| | Produto | Para quem | Tecnologia | Neste repositório |
|:---:|---|---|---|---|
| 📱 | **App do Cliente** | Quem está com fome | Flutter 3 | ✅ Home, sacola, checkout PIX e tracking |
| 🛵 | **App do Entregador** | Quem entrega | Flutter 3 (reaproveita o `core/` do cliente) | 🗓️ Planejado no MVP |
| 🏪 | **Painel do Restaurante** | Quem cozinha | Next.js 15 | ✅ Dashboard, kanban de pedidos e promoções · 🚧 cardápio |
| 🛡️ | **Admin Master** | Quem opera a plataforma | Next.js 15 | 🗓️ Planejado no MVP |

### Destaques

- ⚡ **Tempo real de verdade:** WebSocket (Socket.IO + Redis) e Redis GEO para acompanhar o entregador com latência abaixo de 1 s.
- 🧾 **Pedidos que não somem:** saga do pedido orientada a eventos, *outbox pattern* e `Idempotency-Key` em toda operação sensível.
- 💸 **Pagamento brasileiro:** PIX e cartão com *split* automático (Asaas / Mercado Pago), com Stripe como plano B.
- 🤖 **IA desde o início:** insights para o restaurante, ETA por modelo de regressão e recomendações no roadmap.
- ♿ **Acessível:** todas as cores passam no contraste WCAG 2.2 AA, com alvos de toque de 44 px e anúncios para leitor de tela no tracking.
- 🌗 **Tema claro e escuro** no painel e no app.

---

## ✨ Telas

<table>
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/orders.png" alt="Kanban de pedidos com colunas Novos, Em preparo, Prontos e Saiu para entrega" /><br/>
      <b>Kanban de pedidos</b><br/>
      <sub>Aceitar, marcar como pronto e acompanhar a entrega. Pedidos atrasados ganham destaque vermelho.</sub>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/login.png" alt="Tela de login do Portal do Parceiro com faixa vermelha no topo" /><br/>
      <b>Portal do Parceiro</b><br/>
      <sub>Login com sessão em cookie HttpOnly via BFF do Next.js.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/dashboard.png" alt="Dashboard no tema claro" /><br/>
      <b>Dashboard · tema claro</b>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/dashboard-dark.png" alt="Dashboard no tema escuro" /><br/>
      <b>Dashboard · tema escuro</b>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/assets/promotions-dark.png" />
        <img src="docs/assets/promotions.png" alt="Aba de promoções com indicadores, filtros por situação e cards de cupons" />
      </picture><br/>
      <b>Promoções</b><br/>
      <sub>Cupons de desconto e frete grátis com filtros por situação, pausar/reativar e criação.</sub>
    </td>
    <td width="50%" align="center">
    </td>
  </tr>
</table>

---

## 🚀 Rodar em 1 minuto

O painel web tem um **modo demonstração** com dados de exemplo. Você não precisa de banco, Docker nem backend, só do **Node.js 22+**:

```bash
git clone https://github.com/th3oph1l0/pg-delivery.git
cd pg-delivery/web
cp .env.example .env.local     # já vem com NEXT_PUBLIC_DEMO=true
npm install
npm run dev
```

Abra **http://localhost:3001/dashboard** e pronto. 🎉

| Página | Endereço |
|---|---|
| 📊 Painel | http://localhost:3001/dashboard |
| 🧾 Pedidos (kanban) | http://localhost:3001/orders |
| 🎟️ Promoções | http://localhost:3001/promotions |
| 🍔 Cardápio (em construção) | http://localhost:3001/menu |

> [!TIP]
> No modo demonstração não há login: todas as páginas do painel ficam liberadas. Para usar a API de verdade, troque `NEXT_PUBLIC_DEMO` para `false` e suba o ambiente completo abaixo.

<details>
<summary><b>🧰 Ambiente completo (infra + backend + web + mobile)</b></summary>

<br/>

**Pré-requisitos:** Node.js 22+, Docker Desktop, Flutter 3 (só para o mobile) e `psql`.

**1. Infra local** (Postgres + PostGIS, Redis, Redpanda/Kafka, Jaeger e Grafana)

```bash
cd infra/docker && docker compose up -d
```

**2. Backend**

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
psql postgresql://pg:pg@localhost:5432/pgdelivery -f prisma/sql/001_postgis_indexes_partitions.sql
npm run db:seed
npm run start:dev
```

**3. Web**

```bash
cd web && cp .env.example .env.local   # ajuste NEXT_PUBLIC_DEMO=false
npm install && npm run dev
```

**4. Mobile** (gera as pastas `android/` e `ios/` na primeira vez)

```bash
cd mobile
flutter create --platforms=android,ios --org br.com.pgdelivery .
flutter pub get && flutter test
flutter run --dart-define=API_URL=http://10.0.2.2:3000/v1 --dart-define=RT_URL=http://10.0.2.2:3000/rt
```

> [!NOTE]
> Antes de rodar o app, configure a chave do Google Maps em `android/app/src/main/AndroidManifest.xml` e `ios/Runner/AppDelegate.swift`.

</details>

<details>
<summary><b>🔌 Portas e endereços locais</b></summary>

<br/>

| Serviço | Endereço |
|---|---|
| 🏪 Painel web | http://localhost:3001 |
| ⚙️ API REST | http://localhost:3000/v1 |
| 📖 Swagger (docs da API) | http://localhost:3000/api/docs |
| 📡 Tempo real (Socket.IO) | http://localhost:3000/rt |
| 🐘 PostgreSQL | `localhost:5432` (usuário `pg`, senha `pg`) |
| 🔴 Redis | `localhost:6379` |
| 📨 Kafka (Redpanda) | `localhost:19092` |
| 🖥️ Redpanda Console | http://localhost:8080 |
| 🔎 Jaeger (tracing) | http://localhost:16686 |
| 📊 Grafana | http://localhost:3002 |

</details>

---

## 🏗️ Arquitetura

**Monólito modular** no MVP, já com as fronteiras DDD dos 12 serviços desenhadas. Cada módulo pode virar um microsserviço quando a escala pedir.

```mermaid
flowchart LR
  subgraph Apps["📱 Apps"]
    C[Cliente<br/>Flutter]
    E[Entregador<br/>Flutter]
    R[Restaurante<br/>Next.js]
    A[Admin<br/>Next.js]
  end

  subgraph API["⚙️ Backend NestJS"]
    BFF[API / BFF<br/>auth · rate-limit]
    WS[Realtime<br/>Socket.IO]
    MOD[Módulos<br/>Auth · Catalog · Order<br/>Delivery · Payment · ...]
  end

  subgraph Dados["🗄️ Dados e eventos"]
    PG[(PostgreSQL<br/>+ PostGIS)]
    RD[(Redis<br/>cache · GEO)]
    K[(Kafka<br/>eventos)]
  end

  C & E & R & A --> BFF
  C & E & R -.-> WS
  BFF --> MOD
  MOD --> PG
  MOD --> RD
  MOD -- outbox --> K
  K --> WS
  K --> N[🔔 Notificações<br/>FCM · SMS · e-mail]
  MOD --> PAY[💳 Asaas · Mercado Pago<br/>Stripe]
```

<details>
<summary><b>🔄 Saga do pedido: do "fazer pedido" ao "entregue"</b></summary>

<br/>

```mermaid
sequenceDiagram
  autonumber
  participant C as 🙋 Cliente
  participant O as 🧾 Order
  participant P as 💳 Payment
  participant R as 🏪 Restaurante
  participant D as 🛵 Delivery
  C->>O: POST /orders (Idempotency-Key)
  O->>O: valida carrinho, preço e cupom → PENDING_PAYMENT
  O-->>P: order.placed
  P->>P: cria cobrança (PIX QR / cartão)
  P-->>O: payment.authorized
  O-->>R: order.paid (WebSocket + push)
  R->>O: aceita o pedido
  O-->>D: order.confirmed
  R->>O: pedido pronto
  D->>D: matching → oferta ao entregador
  D-->>O: coletado → entregue
  O-->>P: order.delivered → captura + split
  Note over O,P: Se algo falhar: payment.failed → CANCELLED<br/>restaurante recusa → reembolso automático
```

</details>

<details>
<summary><b>🚦 Máquina de estados do pedido</b></summary>

<br/>

```mermaid
stateDiagram-v2
  [*] --> PENDING_PAYMENT
  PENDING_PAYMENT --> PLACED: pagamento autorizado
  PENDING_PAYMENT --> CANCELLED: pagamento falhou / PIX expirou (15 min)
  PLACED --> CONFIRMED: restaurante aceita
  PLACED --> CANCELLED: recusa / sem resposta em 8 min
  CONFIRMED --> PREPARING
  PREPARING --> READY_FOR_PICKUP
  READY_FOR_PICKUP --> PICKED_UP: entregador coleta (geofence + código)
  PICKED_UP --> DELIVERED: código de entrega
  DELIVERED --> [*]
  CONFIRMED --> CANCELLED: cancelamento com política
```

</details>

<details>
<summary><b>🧠 Decisões de arquitetura (e por quê)</b></summary>

<br/>

| Tema | Decisão | Por quê |
|---|---|---|
| Mensageria | **Kafka** (MSK) para eventos de domínio + **SQS** para filas de tarefas | Replay, ordenação por `orderId`, alto volume de GPS e vários consumidores (BI, IA, antifraude) |
| Topologia | **Monólito modular** no MVP, com extração progressiva | Equipe pequena entrega mais rápido, e as fronteiras DDD já ficam prontas |
| Orquestração | **ECS Fargate** no MVP/V1 → **EKS** a partir da V2 | Menos custo operacional no começo |
| Tracking | **Socket.IO + Redis adapter** e **Redis GEO** | Latência < 1 s e consulta espacial barata |
| Pagamentos | **Asaas / Mercado Pago** (PIX + split), **Stripe** como secundário | Split nativo e PIX mais barato no Brasil |

</details>

---

## 🧱 Stack

<table>
  <tr>
    <th>⚙️ Backend</th>
    <th>🏪 Web</th>
    <th>📱 Mobile</th>
    <th>☁️ Infra e DevOps</th>
  </tr>
  <tr valign="top">
    <td>
      NestJS 11<br/>
      Prisma 6<br/>
      CQRS + DDD<br/>
      Kafka (kafkajs)<br/>
      Socket.IO<br/>
      Argon2 + JWT<br/>
      Swagger
    </td>
    <td>
      Next.js 15 + React 19<br/>
      Tailwind CSS 4<br/>
      TanStack Query<br/>
      Zustand<br/>
      next-themes<br/>
      Lucide icons
    </td>
    <td>
      Flutter 3 + Material 3<br/>
      Riverpod 3<br/>
      GoRouter<br/>
      Dio<br/>
      Google Maps<br/>
      Socket.IO client
    </td>
    <td>
      Docker Compose<br/>
      Kubernetes<br/>
      Terraform (AWS)<br/>
      GitHub Actions<br/>
      Sonar · Trivy · Gitleaks<br/>
      Jaeger · Grafana
    </td>
  </tr>
</table>

<details>
<summary><b>📂 Estrutura de pastas</b></summary>

<br/>

```text
pg-delivery/
├── backend/         ⚙️  NestJS + Prisma + Kafka (Clean Architecture, módulos DDD)
│   ├── prisma/          schema, seed e SQL de índices PostGIS/partições
│   └── src/modules/     auth · catalog · order · delivery · health
├── web/             🏪  Next.js 15: painel do restaurante e admin
│   └── src/             app/ (rotas) · components/ · features/ · stores/
├── mobile/          📱  Flutter 3: app do cliente (base do app do entregador)
│   └── lib/             core/ (design system, rede, rotas) · features/
├── infra/           ☁️  docker/ · k8s/ · terraform/
├── docs/            📚  14 documentos: arquitetura, BD, APIs, custos...
└── .github/         🤖  CI/CD: lint, testes, segurança, build e deploy
```

</details>

---

## 🎨 Design System "Gigante"

Uma paleta pensada para **abrir o apetite**: vermelho ketchup, amarelo queijo e fundos creme.

| | Token | Cor | Uso |
|:---:|---|---|---|
| <img src="docs/assets/cores/D91A27.svg" width="20" /> | `primary` | `#D91A27` Vermelho Ketchup | Botões, links e a faixa do topo |
| <img src="docs/assets/cores/B5121D.svg" width="20" /> | `primary-pressed` | `#B5121D` | Botão pressionado |
| <img src="docs/assets/cores/FFC72C.svg" width="20" /> | `accent` | `#FFC72C` Amarelo Queijo | Destaques, promoções e fidelidade |
| <img src="docs/assets/cores/0E7A55.svg" width="20" /> | `secondary` | `#0E7A55` Verde Folha | Frete grátis, sucesso e "loja aberta" |
| <img src="docs/assets/cores/FFF8F1.svg" width="20" /> | `surface` | `#FFF8F1` Creme | Fundo das páginas |
| <img src="docs/assets/cores/2A1712.svg" width="20" /> | `foreground` | `#2A1712` Marrom Café | Textos |
| <img src="docs/assets/cores/8E0F18.svg" width="20" /> | `header` (escuro) | `#8E0F18` Vinho | Faixa do topo no tema escuro |

Os mesmos tokens existem no web ([`globals.css`](web/src/app/globals.css)) e no mobile ([`pg_tokens.dart`](mobile/lib/core/design_system/tokens/pg_tokens.dart)). A documentação completa, com tipografia, espaçamentos e componentes, está em [`docs/06-design-system.md`](docs/06-design-system.md).

---

## 🗺️ Roadmap

```mermaid
timeline
  title Do bairro ao Brasil
  MVP · ~4 meses : Uma cidade, ponta a ponta : PIX + cartão : Tracking em tempo real : Kanban do restaurante
  V1 · +4 meses : Cupons e programa de pontos : Apple Pay e Google Pay : ETA com IA : 3 cidades
  V2 · +6 meses : Recomendações personalizadas : Chatbot de atendimento : Assinatura PG Gigante+ : 10 a 15 cidades
  V3 · +6 a 9 meses : Mercado, farmácia e pet : Antifraude com ML : API pública para PDVs : Operação nacional
```

<details>
<summary><b>✅ Progresso do MVP neste repositório</b></summary>

<br/>

- [x] Documentação de arquitetura, banco, APIs, eventos, segurança e custos
- [x] Backend: agregado de pedido com máquina de estados e testes, outbox e Kafka
- [x] Backend: auth, catálogo, tracking em tempo real e health check
- [x] Painel: dashboard com indicadores e insight de IA
- [x] Painel: kanban de pedidos
- [x] Painel: promoções (cupons de desconto e frete grátis, filtros por situação, pausar/reativar e criação)
- [x] App do cliente: home, sacola, checkout PIX idempotente e tracking
- [x] Design system claro/escuro, acessível (WCAG 2.2 AA)
- [x] Infra local (Docker Compose), Kubernetes, Terraform e pipeline de CI/CD
- [ ] Painel: CRUD do cardápio, relatórios e financeiro
- [ ] Backend: módulo de cupons (`/merchant/:rid/promotions`) para a aba de promoções
- [ ] App do entregador
- [ ] Admin Master
- [ ] Integração real com gateway de pagamento

</details>

---

## 📚 Documentação

Tudo está em [`docs/`](docs/). Comece pelo [índice](docs/00-indice.md).

| | Documento | | Documento |
|:---:|---|:---:|---|
| 🏗️ | [Arquitetura](docs/01-arquitetura.md) | 🔐 | [Segurança](docs/10-seguranca.md) |
| 📂 | [Estrutura de pastas](docs/02-estrutura-de-pastas.md) | 🔭 | [Observabilidade](docs/11-observabilidade.md) |
| 🗄️ | [Banco de dados](docs/03-banco-de-dados.md) | 💰 | [Custos na AWS](docs/12-custos-aws.md) |
| 🔌 | [Contratos da API](docs/04-contratos-api.md) | 📈 | [Negócio e monetização](docs/13-negocio.md) |
| 📨 | [Eventos](docs/05-eventos.md) | 🤖 | [IA e geolocalização](docs/14-ia-e-geo.md) |
| 🎨 | [Design system](docs/06-design-system.md) | 🗺️ | [Roadmap](docs/08-roadmap.md) |
| 🖼️ | [Wireframes](docs/07-wireframes.md) | 🚀 | [DevOps](docs/09-devops.md) |

---

## 🤝 Contribuindo

1. Faça um fork e crie uma branch: `git checkout -b feature/minha-ideia`
2. Rode os testes do que você mexeu: `npm test` no backend, `npm run typecheck` no web e `flutter test` no mobile
3. Abra um Pull Request contando o que mudou e por quê

Achou um bug ou tem uma ideia? [Abra uma issue](https://github.com/th3oph1l0/pg-delivery/issues). 💬

<div align="center">

<br/>

Feito com ❤️ e muita fome por **[@th3oph1l0](https://github.com/th3oph1l0)**

<sub>⭐ Se o projeto te ajudou, deixe uma estrela!</sub>

</div>
