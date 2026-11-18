import { Order } from './order.aggregate';

/** Port (DIP): a aplicação depende desta abstração, não do Prisma. */
export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findByIdempotencyKey(key: string): Promise<Order | null>;
  /** Persiste o agregado + eventos pendentes (outbox) na mesma transação, com lock otimista. */
  abstract save(order: Order, actor: string): Promise<void>;
}
