import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@prisma/client';
import { NotFoundError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

/** Lado de leitura (CQRS): consulta direto o modelo de leitura, sem passar pelo agregado. */
export class GetOrderQuery {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
  ) {}
}

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ orderId, customerId }: GetOrderQuery) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: true,
        history: { orderBy: { createdAt: 'asc' }, select: { to: true, createdAt: true } },
        restaurant: { select: { id: true, name: true, logoUrl: true } },
        delivery: { select: { status: true, courierId: true } },
      },
    });
    if (!order) throw new NotFoundError('Pedido', orderId);
    const { idempotencyKey: _ik, version: _v, ...publicFields } = order;
    return publicFields;
  }
}

export const ACTIVE_STATUSES: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP'];

export class ListMerchantOrdersQuery {
  constructor(
    readonly restaurantId: string,
    readonly statuses: OrderStatus[] = ACTIVE_STATUSES,
  ) {}
}

@QueryHandler(ListMerchantOrdersQuery)
export class ListMerchantOrdersHandler implements IQueryHandler<ListMerchantOrdersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  execute({ restaurantId, statuses }: ListMerchantOrdersQuery) {
    // Em produção: cliente Prisma apontando para a read replica
    return this.prisma.order.findMany({
      where: { restaurantId, status: { in: statuses } },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        id: true,
        code: true,
        status: true,
        totalCents: true,
        notes: true,
        createdAt: true,
        items: { select: { productName: true, quantity: true, options: true, notes: true } },
        customer: { select: { name: true } },
      },
    });
  }
}
