# 04 — Contratos de APIs REST

**Base:** `https://api.pgdelivery.com.br/v1` · JSON · UTF-8 · datas em ISO-8601 UTC · dinheiro em centavos.
O Swagger/OpenAPI é gerado pelo NestJS em `/api/docs`. A especificação viva é `openapi.json`, publicado no CI.

## Convenções

| Item | Padrão |
|---|---|
| Autenticação | `Authorization: Bearer <access_jwt>` (15 min). Refresh por `POST /auth/refresh` (rotativo, 30 dias) |
| Idempotência | `Idempotency-Key: <uuid>` **obrigatório** em `POST /orders`, `/payments/*` e `/payouts` |
| Paginação | Cursor: `?limit=20&cursor=<opaque>` → `{ data, nextCursor }` |
| Erros | RFC 9457 `application/problem+json` |
| Versionamento | URI (`/v1`). Mudanças incompatíveis vão para `/v2`, com aviso de *sunset* de 6 meses |
| Rate limit | Headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |
| Rastreamento | `traceparent` (W3C) propagado e `x-request-id` devolvido |

```json
// Erro padrão
{
  "type": "https://docs.pgdelivery.com.br/errors/coupon-expired",
  "title": "Cupom expirado",
  "status": 422,
  "code": "COUPON_EXPIRED",
  "detail": "O cupom PG10 expirou em 2026-11-10.",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

## Auth

| Método | Rota | Corpo / Query | Resposta |
|---|---|---|---|
| POST | `/auth/register` | `{name, email, phone, password}` | `201 {user, accessToken, refreshToken}` |
| POST | `/auth/login` | `{email, password}` | `200 {accessToken, refreshToken}` ou `200 {mfaRequired:true, mfaToken}` |
| POST | `/auth/otp/send` | `{phone}` | `204` (máx. 3 a cada 10 min) |
| POST | `/auth/otp/verify` | `{phone, code}` | `200 tokens` |
| POST | `/auth/oauth/{google\|apple}` | `{idToken, nonce?}` | `200 tokens` |
| POST | `/auth/refresh` | `{refreshToken}` | `200 tokens` (o anterior é invalidado; reuso revoga a família) |
| POST | `/auth/password/forgot` | `{email}` | `204` |
| POST | `/auth/password/reset` | `{token, password}` | `204` |
| POST | `/auth/mfa/verify` | `{mfaToken, code}` | `200 tokens` |
| POST | `/auth/logout` | `{refreshToken}` | `204` |

## Cliente

| Método | Rota | Descrição |
|---|---|---|
| GET | `/me` | Perfil |
| PATCH | `/me` | Atualiza nome e avatar |
| DELETE | `/me` | Exclusão LGPD (anonimiza em até 15 dias) |
| GET | `/me/export` | Portabilidade LGPD (JSON por e-mail) |
| GET/POST/PATCH/DELETE | `/me/addresses[/:id]` | Endereços |
| GET/POST/DELETE | `/me/payment-methods[/:id]` | Cartões tokenizados |
| GET/PUT/DELETE | `/me/favorites/:restaurantId` | Favoritos |
| GET | `/me/loyalty` | `{points, cashbackCents, tier, history[]}` |

## Descoberta e catálogo

```
GET /home?lat=-22.52&lng=-44.10
→ 200 {
  "banners":[{"id","imageUrl","deeplink"}],
  "categories":[{"id","name","iconUrl"}],
  "sponsored":[RestaurantCard],
  "nearby":[RestaurantCard],
  "featuredProducts":[ProductCard],
  "promotions":[RestaurantCard]
}

RestaurantCard = {
  "id","slug","name","logoUrl","rating":4.7,"ratingCount":1240,
  "distanceMeters":1800,"etaMinutes":[30,40],"deliveryFeeCents":0,
  "isOpen":true,"tags":["Lanches"],"isSponsored":false
}
```

| Método | Rota | Query |
|---|---|---|
| GET | `/restaurants` | `lat,lng,q,category,maxDistance,minRating,maxEta,freeDelivery,sort=relevance\|distance\|rating\|eta\|price,cursor` |
| GET | `/restaurants/:id` | Detalhes, horários, status e taxa para o `lat,lng` |
| GET | `/restaurants/:id/menu` | `{categories:[{id,name,products:[Product]}]}` (ETag + `Cache-Control: max-age=60`) |
| GET | `/products/:id` | Produto com `optionGroups[{id,name,min,max,options[]}]` |
| GET | `/restaurants/:id/reviews` | Paginado |
| GET | `/search/suggest?q=` | Autocomplete (lojas, pratos, categorias) |

## Carrinho e checkout

```http
POST /cart/quote
{
  "restaurantId": "b1f…",
  "addressId": "a9c…",
  "items": [{"productId":"p1","quantity":2,"options":["o1","o7"],"notes":"sem cebola"}],
  "couponCode": "PEQUENO10"
}
→ 200 {
  "subtotalCents": 6780, "deliveryFeeCents": 599, "serviceFeeCents": 99,
  "discountCents": 678, "totalCents": 6800, "etaMinutes": [35,45],
  "coupon": {"code":"PEQUENO10","valid":true},
  "warnings": [], "recommendations": [ProductCard]
}
```

```http
POST /orders
Idempotency-Key: 6f1c2d1e-…
{
  "restaurantId": "b1f…", "addressId": "a9c…",
  "items": [ … igual ao quote … ],
  "couponCode": "PEQUENO10",
  "payment": {"method":"PIX"}            // ou {"method":"CREDIT","paymentMethodId":"pm_…","cvvToken":"…"}
                                         // ou {"method":"GOOGLE_PAY","token":"…"}
  , "notes": "Interfone 302", "tipCents": 300
}
→ 201 {
  "id":"…","code":"PG-7F3K2","status":"PENDING_PAYMENT","totalCents":7100,
  "payment": {"status":"PENDING","pix":{"qrCode":"000201…","qrImageUrl":"…","expiresAt":"…"}}
}
409 IDEMPOTENCY_CONFLICT · 422 PRICE_CHANGED | RESTAURANT_CLOSED | OUT_OF_ZONE | OUT_OF_STOCK
```

| Método | Rota | Descrição |
|---|---|---|
| GET | `/orders?status=active\|past&cursor=` | Histórico |
| GET | `/orders/:id` | Detalhe + timeline |
| POST | `/orders/:id/cancel` | `{reason}`; a política depende do status |
| POST | `/orders/:id/reorder` | Monta um novo carrinho e retorna o quote (avisa sobre itens indisponíveis) |
| POST | `/orders/:id/review` | `{restaurantStars, courierStars, comment}` |
| GET | `/orders/:id/tracking` | Snapshot `{status, courier{name,photo,vehicle,lat,lng}, etaAt, polyline}` |

**WebSocket** `wss://rt.pgdelivery.com.br` (Socket.IO, auth via token)

- `subscribe:order {orderId}` → eventos `order:status`, `courier:location {lat,lng,heading,ts}` e `order:eta {etaAt}`

## Entregador

| Método | Rota | Descrição |
|---|---|---|
| POST | `/couriers/onboarding` | `{vehicle, licensePlate, pixKey}` |
| POST | `/couriers/documents` | Retorna uma URL pré-assinada do S3 → `{type, s3Key}` |
| PATCH | `/couriers/me/availability` | `{online: true}` |
| POST | `/couriers/me/location` | `{lat,lng,heading,speed,ts}` em lote: `{points:[…]}` (fallback REST; o caminho primário é o WS) |
| GET | `/couriers/me/offers` | Ofertas pendentes |
| POST | `/deliveries/offers/:id/accept` · `/reject` | `{reason?}` |
| POST | `/deliveries/:id/arrived-pickup` | Validado por geofence de 100 m |
| POST | `/deliveries/:id/pickup` | `{orderCode}` |
| POST | `/deliveries/:id/complete` | `{deliveryCode}` + validação por geofence |
| GET | `/couriers/me/earnings?from&to` | `{totalCents, deliveries, tipsCents, daily[]}` |
| POST | `/couriers/me/payouts` | Saque via PIX (Idempotency-Key) |
| GET | `/couriers/me/performance` | `{rating, acceptanceRate, onTimeRate, rank}` |

## Restaurante (painel)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/merchant/:rid/dashboard?range=today\|7d\|30d` | `{gmvCents, orders, avgTicketCents, cancelRate, prepTimeAvg, series[]}` |
| GET | `/merchant/:rid/orders?status=` | Fila do kanban |
| POST | `/merchant/:rid/orders/:id/accept` | `{prepMinutes}` |
| POST | `/merchant/:rid/orders/:id/reject` | `{reason}` |
| POST | `/merchant/:rid/orders/:id/ready` | — |
| PATCH | `/merchant/:rid/status` | `{isOpen, pausedUntil?}` |
| CRUD | `/merchant/:rid/categories`, `/products`, `/option-groups` | Cardápio |
| PATCH | `/merchant/:rid/products/:id/stock` | `{stockQty \| isAvailable}` |
| CRUD | `/merchant/:rid/promotions` | Cupons, cashback, combos, campanhas |
| GET | `/merchant/:rid/reports/{sales\|performance\|customers}` | `?from&to&format=json\|csv` |
| GET | `/merchant/:rid/financial/statements` | Repasses |

## Admin Master (RBAC: `ADMIN`, `SUPPORT`, `FINANCE`)

| Método | Rota |
|---|---|
| GET/PATCH | `/admin/customers`, `/admin/restaurants`, `/admin/couriers`, `/admin/admins` (bloquear, aprovar, editar) |
| POST | `/admin/couriers/:id/approve` · `/reject` |
| GET | `/admin/finance/commissions`, `/payouts`, `/reconciliation?date=` |
| POST | `/admin/finance/refunds` `{orderId, amountCents, reason}` |
| GET/POST | `/admin/finance/chargebacks[/:id/dispute]` |
| GET | `/admin/operations/live` (snapshot do mapa; atualizações via WS `admin:ops`) |
| POST | `/admin/orders/:id/reassign-courier` · `/force-cancel` |
| CRUD | `/admin/settings/fees`, `/categories`, `/coupons`, `/campaigns`, `/banners` |

Toda ação administrativa gera uma entrada em `audit_log`.

## Webhooks recebidos (gateways)

`POST /webhooks/{asaas|mercadopago|stripe}`: a assinatura é validada por HMAC ou pelo segredo do provedor, com idempotência pelo ID do evento. A rota publica `payment.*` via outbox e responde `200` em menos de 2 s.
