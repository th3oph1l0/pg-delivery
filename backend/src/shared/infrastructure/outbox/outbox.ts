import { Global, Injectable, Logger, Module, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '../../domain/domain-event';
import { KafkaService } from '../kafka/kafka.service';
import { PrismaService, Tx } from '../prisma/prisma.service';

/** Grava eventos na outbox DENTRO da transação do agregado. */
export async function saveToOutbox(tx: Tx, events: DomainEvent[]): Promise<void> {
  if (events.length === 0) return;
  await tx.outboxEvent.createMany({
    data: events.map((e) => ({
      id: e.id,
      aggregateType: e.aggregateType,
      aggregateId: e.aggregateId,
      topic: e.topic,
      type: e.type,
      payload: {
        specversion: '1.0',
        id: e.id,
        source: `pg.${e.aggregateType}-service`,
        type: e.type,
        subject: `${e.aggregateType}/${e.aggregateId}`,
        time: e.time,
        datacontenttype: 'application/json',
        data: e.data,
      } as unknown as Prisma.InputJsonValue,
    })),
  });
}

/**
 * Relay da outbox: publica eventos pendentes no Kafka.
 * Vários pods podem rodar em paralelo graças ao FOR UPDATE SKIP LOCKED.
 * Na V2 é substituído por Debezium (CDC), sem mudar os produtores.
 */
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelay.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.OUTBOX_RELAY_ENABLED === 'false') return;
    this.timer = setInterval(() => void this.tick(), 200);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(batchSize = 500): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<
          { id: string; topic: string; aggregate_id: string; payload: unknown }[]
        >`SELECT id, topic, aggregate_id, payload
            FROM platform.outbox_events
           WHERE published_at IS NULL
           ORDER BY created_at
           LIMIT ${batchSize}
           FOR UPDATE SKIP LOCKED`;
        if (rows.length === 0) return 0;

        const byTopic = new Map<string, typeof rows>();
        for (const r of rows) byTopic.set(r.topic, [...(byTopic.get(r.topic) ?? []), r]);

        for (const [topic, msgs] of byTopic) {
          await this.kafka.publish(
            topic,
            msgs.map((m) => ({
              key: m.aggregate_id, // garante ordem por agregado
              value: JSON.stringify(m.payload),
              headers: { 'ce-id': m.id },
            })),
          );
        }
        await tx.outboxEvent.updateMany({
          where: { id: { in: rows.map((r) => r.id) } },
          data: { publishedAt: new Date() },
        });
        return rows.length;
      });
    } catch (err) {
      this.logger.error('Falha ao publicar outbox', err as Error);
      return 0;
    } finally {
      this.running = false;
    }
  }
}

/** Idempotência de consumidores: true se o evento já foi processado por este consumer. */
export async function alreadyProcessed(tx: Tx, eventId: string, consumer: string): Promise<boolean> {
  const res = await tx.processedEvent.createMany({
    data: [{ eventId, consumer }],
    skipDuplicates: true,
  });
  return res.count === 0;
}

@Global()
@Module({ providers: [OutboxRelay], exports: [OutboxRelay] })
export class OutboxModule {}
