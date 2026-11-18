# 02 — Estrutura de Pastas

## 4. Flutter (Clean Architecture + Feature First)

```
mobile/
├── pubspec.yaml
├── analysis_options.yaml
├── l10n.yaml
├── assets/{images,icons,lottie,fonts}/
└── lib/
    ├── main.dart                     # bootstrap: ProviderScope, Sentry, Firebase
    ├── app.dart                      # MaterialApp.router + temas
    ├── core/
    │   ├── config/                   # env (flavors dev/stg/prod), constantes
    │   ├── design_system/
    │   │   ├── tokens/               # pg_tokens.dart (cores, espaço, raio, movimento)
    │   │   ├── theme/                # pg_theme.dart (light/dark M3)
    │   │   └── components/           # PgButton, PgInput, PgCard, PgSkeleton, PgBottomSheet...
    │   ├── network/                  # Dio, interceptors (auth/refresh, idempotency, logging), ApiException
    │   ├── storage/                  # secure_storage (tokens), Drift db (cache offline), outbox local
    │   ├── realtime/                 # cliente socket.io
    │   ├── router/                   # app_router.dart (GoRouter + redirect de auth)
    │   ├── error/                    # Failure, Result<T>
    │   └── utils/                    # formatters (BRL), validators (CPF, telefone)
    ├── features/
    │   ├── auth/
    │   │   ├── data/                 # datasources (remote/local), models (DTO json), repositories_impl
    │   │   ├── domain/               # entities, repositories (abstract), usecases
    │   │   └── presentation/         # pages, widgets, controllers (Riverpod Notifier)
    │   ├── home/
    │   ├── search/
    │   ├── restaurant/
    │   ├── cart/
    │   ├── checkout/
    │   ├── orders/                   # histórico, repetir, tracking (google_maps_flutter)
    │   ├── profile/                  # endereços, cartões, favoritos, configurações
    │   └── loyalty/
    └── shared/                       # widgets/providers compartilhados entre features
test/ integration_test/
```

O app do entregador fica num segundo `app` do mesmo workspace (melos), reaproveitando `core/` como package `pg_core`:

```
packages/pg_core/   apps/customer/   apps/courier/
```

## 5. Next.js 15 (App Router)

```
web/
├── next.config.ts
├── postcss.config.mjs               # Tailwind CSS v4 (tokens via @theme em src/app/globals.css)
├── components.json                  # shadcn/ui
└── src/
    ├── app/
    │   ├── globals.css              # tokens do Design System (light/dark)
    │   ├── layout.tsx               # fontes, ThemeProvider, QueryProvider
    │   ├── (auth)/login/page.tsx
    │   ├── (restaurant)/            # Painel do Estabelecimento
    │   │   ├── layout.tsx           # sidebar + topbar
    │   │   ├── dashboard/page.tsx
    │   │   ├── orders/page.tsx      # kanban em tempo real
    │   │   ├── menu/{products,categories,addons,stock}/
    │   │   ├── promotions/
    │   │   └── reports/
    │   ├── (admin)/admin/           # Painel Master (RBAC)
    │   │   ├── customers/ restaurants/ couriers/ admins/
    │   │   ├── finance/{commissions,payouts,refunds,chargebacks}/
    │   │   ├── operations/live/     # mapa em tempo real
    │   │   └── settings/{fees,categories,coupons,campaigns,banners}/
    │   └── api/                     # route handlers (BFF fino: cookies httpOnly)
    ├── components/
    │   ├── ui/                      # shadcn (button, card, dialog, sheet, table, badge...)
    │   ├── layout/                  # sidebar, topbar, theme-toggle
    │   └── charts/
    ├── features/
    │   ├── orders/                  # api.ts, hooks.ts (TanStack Query), components/, types.ts
    │   ├── menu/
    │   └── dashboard/
    ├── lib/                         # api-client.ts, socket.ts, utils.ts (cn, formatBRL)
    ├── stores/                      # Zustand: ui-store, session-store
    └── middleware.ts                # proteção de rotas por papel
```

## 6. NestJS (monorepo modular → microsserviços)

```
backend/
├── prisma/schema.prisma
├── src/
│   ├── main.ts                      # bootstrap: Helmet, CORS, versionamento, Swagger, OTel
│   ├── app.module.ts
│   ├── shared/                      # kernel compartilhado
│   │   ├── domain/                  # AggregateRoot, DomainEvent, Money, Result
│   │   ├── infrastructure/
│   │   │   ├── prisma/              # PrismaService
│   │   │   ├── kafka/               # KafkaProducer, consumer decorator
│   │   │   ├── outbox/              # OutboxRelay (polling + FOR UPDATE SKIP LOCKED)
│   │   │   └── redis/
│   │   └── presentation/            # guards (JWT, Roles), filters, interceptors (idempotência)
│   └── modules/
│       ├── auth/
│       ├── catalog/
│       ├── order/
│       │   ├── domain/              # order.aggregate.ts, order-status.ts, events/
│       │   ├── application/
│       │   │   ├── commands/        # place-order.command.ts + handler
│       │   │   └── queries/         # get-order.query.ts + handler
│       │   ├── infrastructure/      # prisma-order.repository.ts
│       │   └── presentation/        # orders.controller.ts, dto/
│       ├── delivery/                # + tracking.gateway.ts (WebSocket)
│       ├── payment/ coupon/ loyalty/ notification/ restaurant/ user/ analytics/ admin/
└── test/
```

**Regra para extrair um módulo como microsserviço:** o módulo só pode importar `shared/` e falar com outros módulos por eventos ou por *ports* (interfaces). Para extrair, você cria `apps/<servico>/main.ts`, aponta o *port* para HTTP/gRPC e move o schema Prisma. Nenhum código de domínio muda.
