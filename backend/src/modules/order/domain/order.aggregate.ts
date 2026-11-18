import { randomInt } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DomainError } from '../../../shared/domain/domain-error';
import { OrderPlaced, OrderStatusChanged } from './events/order.events';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

/** Transições válidas (docs/01-arquitetura.md §2.2). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PLACED', 'CANCELLED'],
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface OrderItemProps {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  options: { groupName: string; name: string; priceCents: number }[];
  notes?: string;
}

export interface DeliveryAddressSnapshot {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface OrderProps {
  code: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  items: OrderItemProps[];
  deliveryFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  couponCode?: string;
  paymentMethod: string;
  notes?: string;
  deliveryAddress: DeliveryAddressSnapshot;
  deliveryCode: string;
  idempotencyKey: string;
  createdAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  static readonly MAX_ITEMS = 50;

  static place(
    id: string,
    input: Omit<OrderProps, 'status' | 'code' | 'deliveryCode' | 'createdAt'> & { minOrderCents: number },
  ): Order {
    if (input.items.length === 0) throw new DomainError('EMPTY_CART', 'O carrinho está vazio');
    if (input.items.length > Order.MAX_ITEMS) throw new DomainError('TOO_MANY_ITEMS', 'Itens demais no pedido');
    if (input.items.some((i) => i.quantity < 1 || i.quantity > 99 || !Number.isInteger(i.quantity))) {
      throw new DomainError('INVALID_QUANTITY', 'Quantidade inválida');
    }

    const { minOrderCents, ...props } = input;
    const order = new Order(id, {
      ...props,
      status: 'PENDING_PAYMENT',
      code: Order.generateCode(),
      deliveryCode: String(randomInt(0, 10_000)).padStart(4, '0'),
      createdAt: new Date(),
    });

    if (order.subtotalCents < minOrderCents) {
      throw new DomainError('BELOW_MIN_ORDER', `Pedido mínimo da loja: R$ ${(minOrderCents / 100).toFixed(2)}`);
    }
    if (order.discountCents > order.subtotalCents + order.props.deliveryFeeCents) {
      throw new DomainError('INVALID_DISCOUNT', 'Desconto maior que o valor do pedido');
    }

    order.record(
      new OrderPlaced('order', id, {
        orderId: id,
        code: order.props.code,
        customerId: props.customerId,
        restaurantId: props.restaurantId,
        items: props.items.map((i) => ({ productId: i.productId, qty: i.quantity, unitPriceCents: i.unitPriceCents })),
        totalCents: order.totalCents,
        paymentMethod: props.paymentMethod,
        couponCode: props.couponCode,
        dropoff: { lat: props.deliveryAddress.latitude, lng: props.deliveryAddress.longitude },
      }),
    );
    return order;
  }

  static rehydrate(id: string, props: OrderProps, version: number): Order {
    return new Order(id, props, version);
  }

  // ── Comportamentos ────────────────────────────────────────────

  markPaid(): void {
    this.transition('PLACED');
  }

  accept(prepMinutes: number): void {
    if (prepMinutes < 1 || prepMinutes > 180) throw new DomainError('INVALID_PREP_TIME', 'Tempo de preparo inválido');
    this.transition('CONFIRMED', { prepMinutes });
  }

  startPreparing(): void {
    this.transition('PREPARING');
  }

  markReady(): void {
    this.transition('READY_FOR_PICKUP');
  }

  pickUp(): void {
    this.transition('PICKED_UP');
  }

  deliver(code: string): void {
    if (code !== this.props.deliveryCode) throw new DomainError('INVALID_DELIVERY_CODE', 'Código de entrega incorreto');
    this.transition('DELIVERED');
  }

  cancel(reason: string): void {
    this.transition('CANCELLED', { reason });
  }

  // ── Derivados ─────────────────────────────────────────────────

  get status(): OrderStatus {
    return this.props.status;
  }
  get code(): string {
    return this.props.code;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get subtotalCents(): number {
    return this.props.items.reduce((sum, i) => sum + Order.itemTotal(i), 0);
  }
  get discountCents(): number {
    return this.props.discountCents;
  }
  get totalCents(): number {
    return this.subtotalCents + this.props.deliveryFeeCents + this.props.serviceFeeCents - this.props.discountCents;
  }
  get snapshot(): Readonly<OrderProps> {
    return this.props;
  }

  static itemTotal(i: OrderItemProps): number {
    const optionsCents = i.options.reduce((s, o) => s + o.priceCents, 0);
    return (i.unitPriceCents + optionsCents) * i.quantity;
  }

  private transition(to: OrderStatus, extra: { reason?: string; prepMinutes?: number } = {}): void {
    const from = this.props.status;
    if (!TRANSITIONS[from].includes(to)) {
      throw new DomainError('INVALID_STATUS_TRANSITION', `Não é possível mudar o pedido de ${from} para ${to}`, 409);
    }
    this.props.status = to;
    this.record(
      new OrderStatusChanged('order', this.id, {
        orderId: this.id,
        restaurantId: this.props.restaurantId,
        customerId: this.props.customerId,
        from,
        to,
        ...extra,
      }),
    );
  }

  /** Código curto legível, sem caracteres ambíguos (0/O, 1/I). */
  private static generateCode(): string {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let s = 'PG-';
    for (let i = 0; i < 5; i++) s += alphabet[randomInt(alphabet.length)];
    return s;
  }
}
