import { Global, Injectable, Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, Producer, logLevel } from 'kafkajs';

export interface PublishMessage {
  key: string;
  value: string;
  headers?: Record<string, string>;
}

export type EventHandler = (event: CloudEvent) => Promise<void>;

export interface CloudEvent<T = Record<string, unknown>> {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  subject: string;
  time: string;
  data: T;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'pg-api',
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:19092').split(','),
    logLevel: logLevel.WARN,
  });
  private readonly producer: Producer = this.kafka.producer({
    idempotent: true,
    maxInFlightRequests: 5,
    allowAutoTopicCreation: process.env.NODE_ENV !== 'production',
  });
  private readonly consumers: Consumer[] = [];

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async publish(topic: string, messages: PublishMessage[]): Promise<void> {
    await this.producer.send({ topic, acks: -1, messages });
  }

  /**
   * Registra um consumer group. O handler deve ser idempotente
   * (ver ProcessedEvent) porque a entrega é at-least-once.
   */
  async subscribe(groupId: string, topics: string[], handler: EventHandler): Promise<void> {
    const consumer = this.kafka.consumer({ groupId, sessionTimeout: 30_000 });
    await consumer.connect();
    await consumer.subscribe({ topics, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        const event = JSON.parse(message.value.toString()) as CloudEvent;
        try {
          await handler(event);
        } catch (err) {
          this.logger.error(`Falha em ${groupId} ${topic}[${partition}] ${event.type} ${event.id}`, err as Error);
          throw err; // kafkajs faz retry; após N falhas o consumer manda para <topic>.dlq (TODO: retry topics)
        }
      },
    });
    this.consumers.push(consumer);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.producer.disconnect(), ...this.consumers.map((c) => c.disconnect())]);
  }
}

@Global()
@Module({ providers: [KafkaService], exports: [KafkaService] })
export class KafkaModule {}
