import { randomUUID } from 'node:crypto';

/**
 * Evento de domínio no formato CloudEvents 1.0 (docs/05-eventos.md).
 * Domínio puro: sem dependência de NestJS, Prisma ou Kafka.
 */
export abstract class DomainEvent<TData extends object = object> {
  readonly id: string = randomUUID();
  readonly time: string = new Date().toISOString();
  abstract readonly type: string;
  abstract readonly topic: string;

  constructor(
    readonly aggregateType: string,
    readonly aggregateId: string,
    readonly data: TData,
  ) {}
}
