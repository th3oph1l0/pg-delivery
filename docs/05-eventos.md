# 05 — Eventos (Kafka)

A justificativa técnica da escolha de Kafka está em [01-arquitetura.md](01-arquitetura.md#kafka--rabbitmq-qual-usar-num-marketplace-de-delivery).

## Envelope padrão (CloudEvents 1.0)

```json
{
  "specversion": "1.0",
  "id": "0193a7c4-5d6e-7f00-9a1b-2c3d4e5f6a7b",
  "source": "pg.order-service",
  "type": "order.placed",
  "subject": "order/3c9e…",
  "time": "2026-11-18T12:01:33.120Z",
  "datacontenttype": "application/json",
  "dataschema": "https://schemas.pgdelivery.com.br/order.placed/1.json",
  "traceparent": "00-4bf92f…-00f067…-01",
  "data": { }
}
```

- **Chave da mensagem** = ID do agregado (`orderId`, `courierId`), o que garante ordem por entidade.
- **Schemas** versionados no Glue Schema Registry (JSON Schema). Mudanças só podem ser aditivas; uma quebra exige `type` v2.
- **Entrega**: *at-least-once*. Os produtores usam `enable.idempotence=true` e `acks=all`. Os consumidores deduplicam com `processed_events(event_id, consumer)`.
- **Retry**: tópico `<topic>.retry.{1m,5m,30m}`, depois `<topic>.dlq`, com alarme no CloudWatch.

## Tópicos

| Tópico | Partições | Retenção | Produtor | Consumidores |
|---|---|---|---|---|
| `pg.order.events` | 24 | 7 dias (+ S3 sink permanente) | Order | Payment, Delivery, Notification, Loyalty, Coupon, Analytics, Realtime |
| `pg.payment.events` | 12 | 7 dias | Payment | Order, Notification, Analytics |
| `pg.delivery.events` | 24 | 7 dias | Delivery | Order, Notification, Realtime, Analytics |
| `pg.courier.location` | 48 | 24 h, `cleanup.policy=delete` | Gateway de GPS | Delivery (matching/ETA), Realtime, Analytics (amostrado) |
| `pg.catalog.events` | 6 | 7 dias, compactado | Catalog | Search indexer, Cache invalidator |
| `pg.restaurant.events` | 6 | compactado | Restaurant | Catalog, Search, Delivery |
| `pg.user.events` | 6 | 7 dias | Auth/User | Notification, Loyalty, Analytics |
| `pg.marketing.events` | 6 | 7 dias | Coupon/Loyalty | Notification, Analytics |

## Catálogo de eventos

| Tipo | Payload (`data`) |
|---|---|
| `order.placed` | `{orderId, code, customerId, restaurantId, items[{productId, qty, unitPriceCents}], totalCents, paymentMethod, couponCode?, dropoff{lat,lng}}` |
| `order.paid` | `{orderId, restaurantId, customerId}`: pagamento aprovado (PENDING_PAYMENT → PLACED); dispara o alerta para a loja |
| `order.confirmed` | `{orderId, restaurantId, prepMinutes, estimatedReadyAt}` |
| `order.preparing` | `{orderId}` |
| `order.ready_for_pickup` | `{orderId, restaurantId, pickup{lat,lng}}` |
| `order.picked_up` | `{orderId, courierId, at}` |
| `order.delivered` | `{orderId, customerId, restaurantId, courierId, totalCents, deliveredAt}` |
| `order.cancelled` | `{orderId, reason, cancelledBy, refundable:boolean, stage}` |
| `payment.authorized` | `{paymentId, orderId, method, amountCents, gateway}` |
| `payment.failed` | `{paymentId, orderId, reasonCode}` |
| `payment.captured` | `{paymentId, orderId, splits[{recipient, amountCents}]}` |
| `payment.refunded` | `{paymentId, orderId, refundId, amountCents}` |
| `payment.chargeback_opened` | `{paymentId, orderId, gatewayCaseId, amountCents, deadline}` |
| `delivery.searching` | `{deliveryId, orderId, attempt}` |
| `delivery.offer_sent` | `{deliveryId, courierId, offerId, expiresAt, feeCents}` |
| `delivery.courier_assigned` | `{deliveryId, orderId, courierId, etaPickupAt}` |
| `delivery.arrived_pickup` / `arrived_dropoff` | `{deliveryId, courierId, at}` |
| `delivery.completed` | `{deliveryId, orderId, courierId, distanceMeters, durationSec}` |
| `delivery.eta_updated` | `{orderId, etaAt, confidence}` |
| `courier.location.updated` | `{courierId, deliveryId?, lat, lng, heading, speedKmh, ts}` |
| `courier.went_online` / `went_offline` | `{courierId, city, at}` |
| `catalog.product.updated` | `{restaurantId, productId, changes[], menuVersion}` |
| `restaurant.opened` / `closed` | `{restaurantId, at, pausedUntil?}` |
| `user.registered` | `{userId, channel, referralCode?}` |
| `coupon.redeemed` | `{couponId, userId, orderId, discountCents}` |
| `loyalty.points.earned` | `{userId, orderId, points, tier}` |

## Coreografia + orquestração

- **Orquestração** (saga no Order Service) para o ciclo de vida do pedido, onde a consistência é crítica.
- **Coreografia** para os efeitos colaterais: notificações, pontos, analytics e indexação.

## Transactional Outbox

```
BEGIN;
  UPDATE ordering.orders SET status='CONFIRMED', version=version+1 WHERE id=$1 AND version=$2;
  INSERT INTO platform.outbox_events (id, topic, type, payload, …) VALUES (…);
COMMIT;
-- OutboxRelay (a cada 200 ms, ou via Debezium CDC na V2):
SELECT … FROM platform.outbox_events WHERE published_at IS NULL
ORDER BY created_at LIMIT 500 FOR UPDATE SKIP LOCKED;
→ producer.send() → UPDATE published_at = now()
```

A implementação está em `backend/src/shared/infrastructure/outbox/outbox.relay.ts`.
