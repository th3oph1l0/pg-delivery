import { Order } from '../src/modules/order/domain/order.aggregate';

const address = {
  street: 'Rua A', number: '10', district: 'Centro', city: 'Volta Redonda', state: 'RJ',
  zipCode: '27200-000', latitude: -22.52, longitude: -44.1,
};

const place = (overrides: Partial<Parameters<typeof Order.place>[1]> = {}) =>
  Order.place('11111111-1111-1111-1111-111111111111', {
    customerId: 'c1',
    restaurantId: 'r1',
    items: [
      {
        productId: 'p1', productName: 'X-Gigante', unitPriceCents: 3290, quantity: 2,
        options: [{ groupName: 'Adicionais', name: 'Bacon', priceCents: 400 }],
      },
    ],
    deliveryFeeCents: 599,
    serviceFeeCents: 99,
    discountCents: 500,
    paymentMethod: 'PIX',
    deliveryAddress: address,
    idempotencyKey: 'k-1234567890abcdef',
    minOrderCents: 2000,
    ...overrides,
  });

describe('Order aggregate', () => {
  it('calcula totais no servidor e emite order.placed', () => {
    const order = place();
    expect(order.subtotalCents).toBe((3290 + 400) * 2); // 7380
    expect(order.totalCents).toBe(7380 + 599 + 99 - 500);
    expect(order.status).toBe('PENDING_PAYMENT');
    expect(order.code).toMatch(/^PG-[2-9A-HJ-NP-Z]{5}$/);
    const events = order.pullEvents();
    expect(events.map((e) => e.type)).toEqual(['order.placed']);
    expect(order.pullEvents()).toHaveLength(0);
  });

  it('respeita o pedido mínimo da loja', () => {
    expect(() => place({ minOrderCents: 100_000 })).toThrow('Pedido mínimo');
  });

  it('segue a máquina de estados e rejeita transições inválidas', () => {
    const order = place();
    expect(() => order.markReady()).toThrow(/PENDING_PAYMENT para READY_FOR_PICKUP/);
    order.markPaid();
    order.accept(15);
    order.startPreparing();
    order.markReady();
    order.pickUp();
    expect(() => order.cancel('cliente desistiu')).toThrow();
    const code = order.snapshot.deliveryCode;
    expect(() => order.deliver(code === '0000' ? '1111' : '0000')).toThrow('Código de entrega incorreto');
    order.deliver(code);
    expect(order.status).toBe('DELIVERED');
    expect(order.pullEvents().map((e) => e.type)).toEqual([
      'order.placed',
      'order.paid',
      'order.confirmed',
      'order.preparing',
      'order.ready_for_pickup',
      'order.picked_up',
      'order.delivered',
    ]);
  });
});
