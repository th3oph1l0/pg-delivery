import { DomainEvent } from '../../../../shared/domain/domain-event';

const TOPIC = 'pg.order.events';

export class OrderPlaced extends DomainEvent<{
  orderId: string;
  code: string;
  customerId: string;
  restaurantId: string;
  items: { productId: string; qty: number; unitPriceCents: number }[];
  totalCents: number;
  paymentMethod: string;
  couponCode?: string;
  dropoff: { lat: number; lng: number };
}> {
  readonly type = 'order.placed';
  readonly topic = TOPIC;
}

export class OrderStatusChanged extends DomainEvent<{
  orderId: string;
  restaurantId: string;
  customerId: string;
  from: string;
  to: string;
  reason?: string;
  prepMinutes?: number;
}> {
  readonly topic = TOPIC;
  /** PLACED vira `order.paid` para não colidir com o evento de criação `order.placed`. */
  get type(): string {
    return this.data.to === 'PLACED' ? 'order.paid' : `order.${this.data.to.toLowerCase()}`;
  }
}
