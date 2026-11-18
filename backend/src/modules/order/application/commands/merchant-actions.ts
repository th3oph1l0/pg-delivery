import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/domain-error';
import { OrderRepository } from '../../domain/order.repository';

export type MerchantAction =
  | { kind: 'accept'; prepMinutes: number }
  | { kind: 'reject'; reason: string }
  | { kind: 'start' }
  | { kind: 'ready' };

export class MerchantOrderActionCommand {
  constructor(
    readonly restaurantId: string,
    readonly orderId: string,
    readonly actorId: string,
    readonly action: MerchantAction,
  ) {}
}

@CommandHandler(MerchantOrderActionCommand)
export class MerchantOrderActionHandler implements ICommandHandler<MerchantOrderActionCommand> {
  constructor(private readonly orders: OrderRepository) {}

  async execute({ restaurantId, orderId, actorId, action }: MerchantOrderActionCommand): Promise<{ status: string }> {
    const order = await this.orders.findById(orderId);
    if (!order || order.restaurantId !== restaurantId) throw new NotFoundError('Pedido', orderId);

    switch (action.kind) {
      case 'accept':
        order.accept(action.prepMinutes);
        break;
      case 'reject':
        order.cancel(`merchant_rejected:${action.reason}`);
        break;
      case 'start':
        order.startPreparing();
        break;
      case 'ready':
        order.markReady();
        break;
    }
    await this.orders.save(order, `merchant:${actorId}`);
    return { status: order.status };
  }
}
