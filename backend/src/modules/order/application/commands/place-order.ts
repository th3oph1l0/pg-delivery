import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { DomainError, NotFoundError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Order, OrderItemProps } from '../../domain/order.aggregate';
import { OrderRepository } from '../../domain/order.repository';
import { PlaceOrderDto } from '../../presentation/dto/place-order.dto';

export class PlaceOrderCommand {
  constructor(
    readonly customerId: string,
    readonly idempotencyKey: string,
    readonly dto: PlaceOrderDto,
  ) {}
}

export interface PlaceOrderResult {
  id: string;
  code: string;
  status: string;
  totalCents: number;
}

const SERVICE_FEE_CENTS = 99;

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand, PlaceOrderResult> {
  constructor(
    private readonly orders: OrderRepository,
    private readonly prisma: PrismaService, // leitura de catálogo/endereço; vira port HTTP ao extrair o serviço
  ) {}

  async execute({ customerId, idempotencyKey, dto }: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Idempotência no nível do domínio (além do interceptor HTTP)
    const existing = await this.orders.findByIdempotencyKey(idempotencyKey);
    if (existing) return this.toResult(existing);

    const [restaurant, address] = await Promise.all([
      this.prisma.restaurant.findUnique({ where: { id: dto.restaurantId } }),
      this.prisma.address.findFirst({ where: { id: dto.addressId, userId: customerId } }),
    ]);
    if (!restaurant || !restaurant.isActive) throw new NotFoundError('Restaurante', dto.restaurantId);
    if (!restaurant.isOpen) throw new DomainError('RESTAURANT_CLOSED', 'A loja está fechada no momento');
    if (!address) throw new NotFoundError('Endereço', dto.addressId);
    // TODO: validar ST_Contains(delivery_zone, endereço) → OUT_OF_ZONE e calcular a taxa pela zona

    const items = await this.priceItems(dto);
    // TODO: CouponService.validate(dto.couponCode, customerId, subtotal) → discountCents
    const discountCents = 0;

    const order = Order.place(randomUUID(), {
      customerId,
      restaurantId: restaurant.id,
      items,
      deliveryFeeCents: restaurant.deliveryFeeCents,
      serviceFeeCents: SERVICE_FEE_CENTS,
      discountCents,
      couponCode: dto.couponCode,
      paymentMethod: dto.payment.method,
      notes: dto.notes,
      deliveryAddress: {
        street: address.street,
        number: address.number,
        complement: address.complement,
        district: address.district,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        latitude: address.latitude,
        longitude: address.longitude,
      },
      idempotencyKey,
      minOrderCents: restaurant.minOrderCents,
    });

    await this.orders.save(order, `customer:${customerId}`);
    // O Payment Service consome order.placed e cria a cobrança (PIX/cartão).
    return this.toResult(order);
  }

  /** Preço SEMPRE vem do servidor; nunca do cliente. */
  private async priceItems(dto: PlaceOrderDto): Promise<OrderItemProps[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) }, restaurantId: dto.restaurantId },
      include: { optionGroups: { include: { options: true } } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return dto.items.map((item) => {
      const p = byId.get(item.productId);
      if (!p || !p.isAvailable) throw new DomainError('OUT_OF_STOCK', `Produto indisponível: ${item.productId}`);
      if (p.stockQty !== null && p.stockQty < item.quantity) {
        throw new DomainError('OUT_OF_STOCK', `Estoque insuficiente de ${p.name}`);
      }

      const chosen = new Set(item.options);
      const options: OrderItemProps['options'] = [];
      for (const g of p.optionGroups) {
        const picked = g.options.filter((o) => chosen.has(o.id) && o.isAvailable);
        if (picked.length < g.minSelect || picked.length > g.maxSelect) {
          throw new DomainError('INVALID_OPTIONS', `"${g.name}": escolha entre ${g.minSelect} e ${g.maxSelect}`);
        }
        picked.forEach((o) => {
          options.push({ groupName: g.name, name: o.name, priceCents: o.priceCents });
          chosen.delete(o.id);
        });
      }
      if (chosen.size > 0) throw new DomainError('INVALID_OPTIONS', 'Complemento inválido para o produto');

      return {
        productId: p.id,
        productName: p.name,
        unitPriceCents: p.promoPriceCents ?? p.priceCents,
        quantity: item.quantity,
        options,
        notes: item.notes,
      };
    });
  }

  private toResult(o: Order): PlaceOrderResult {
    return { id: o.id, code: o.code, status: o.status, totalCents: o.totalCents };
  }
}
