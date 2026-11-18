import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TProps> {
  private _events: DomainEvent[] = [];

  protected constructor(
    readonly id: string,
    protected props: TProps,
    private _version = 1,
  ) {}

  get version(): number {
    return this._version;
  }

  protected record(event: DomainEvent): void {
    this._events.push(event);
  }

  /** Retorna e limpa os eventos pendentes; o repositório grava-os na outbox na mesma transação. */
  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }
}
