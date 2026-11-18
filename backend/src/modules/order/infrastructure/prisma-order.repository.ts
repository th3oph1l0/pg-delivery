import { Injectable } from '@nestjs/common';
import { Prisma, Order as OrderRow, OrderItem as OrderItemRow } from '@prisma/client';
import { ConcurrencyError } from '../../../shared/domain/domain-error';
import { saveToOutbox } from '../../../shared/infrastructure/outbox/outbox';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { DeliveryAddressSnapshot, Order, OrderItemProps } from '../domain/order.aggregate';
import { OrderRepository } from '../domain/order.repository';

type Row = OrderRow & { items: OrderItemRow[] };

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { idempotencyKey: key }, include: { items: true } });
    return row ? this.toDomain(row) : null;
  }

  async save(order: Order, actor: string): Promise<void> {
    const events = order.pullEvents();
    const s = order.snapshot;

    await this.prisma.$transaction(async (tx) => {
      const exists = await tx.order.findUnique({ where: { id: order.id }, select: { status: true } });

      if (!exists) {
        await tx.order.create({
          data: {
            id: order.id,
            code: s.code,
            customerId: s.customerId,
            restaurantId: s.restaurantId,
            status: s.status,
            subtotalCents: order.subtotalCents,
            deliveryFeeCents: s.deliveryFeeCents,
            serviceFeeCents: s.serviceFeeCents,
            discountCents: s.discountCents,
            totalCents: order.totalCents,
            couponCode: s.couponCode,
            paymentMethod: s.paymentMethod,
            notes: s.notes,
            deliveryAddress: s.deliveryAddress as unknown as Prisma.InputJsonValue,
            deliveryCode: s.deliveryCode,
            idempotencyKey: s.idempotencyKey,
            items: {
              create: s.items.map((i) => ({
                productId: i.productId,
                productName: i.productName,
                unitPriceCents: i.unitPriceCents,
                quantity: i.quantity,
                options: i.options as unknown as Prisma.InputJsonValue,
                notes: i.notes,
                totalCents: Order.itemTotal(i),
              })),
            },
            history: { create: { to: s.status, actor } },
          },
        });
      } else {
        // Lock otimista: só atualiza se ninguém mudou a versão desde a leitura
        const res = await tx.order.updateMany({
          where: { id: order.id, version: order.version },
          data: { status: s.status, version: { increment: 1 } },
        });
        if (res.count === 0) throw new ConcurrencyError('Pedido');
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, from: exists.status, to: s.status, actor },
        });
      }

      await saveToOutbox(tx, events);
    });
  }

  private toDomain(row: Row): Order {
    return Order.rehydrate(
      row.id,
      {
        code: row.code,
        customerId: row.customerId,
        restaurantId: row.restaurantId,
        status: row.status,
        items: row.items.map<OrderItemProps>((i) => ({
          productId: i.productId,
          productName: i.productName,
          unitPriceCents: i.unitPriceCents,
          quantity: i.quantity,
          options: i.options as unknown as OrderItemProps['options'],
          notes: i.notes ?? undefined,
        })),
        deliveryFeeCents: row.deliveryFeeCents,
        serviceFeeCents: row.serviceFeeCents,
        discountCents: row.discountCents,
        couponCode: row.couponCode ?? undefined,
        paymentMethod: row.paymentMethod,
        notes: row.notes ?? undefined,
        deliveryAddress: row.deliveryAddress as unknown as DeliveryAddressSnapshot,
        deliveryCode: row.deliveryCode,
        idempotencyKey: row.idempotencyKey,
        createdAt: row.createdAt,
      },
      row.version,
    );
  }
}
