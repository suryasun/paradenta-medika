/**
 * docs/03-sad/02-system-architecture.md Section 23 (Internal Event Bus):
 * cross-module communication uses Internal Domain Events for loose
 * coupling. Section 34.5 documents RabbitMQ/Kafka/NATS as a *future*
 * migration path -- an in-process publish/subscribe bus is the correct
 * Phase 1 implementation, not a message broker.
 */
export interface DomainEvent<TPayload = unknown> {
  event: string;
  payload: TPayload;
}

export type EventHandler<TPayload = unknown> = (payload: TPayload) => void | Promise<void>;

export interface IEventBus {
  publish<TPayload>(eventName: string, payload: TPayload): Promise<void>;
  subscribe<TPayload>(eventName: string, handler: EventHandler<TPayload>): void;
}

export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe<TPayload>(eventName: string, handler: EventHandler<TPayload>): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventName, existing);
  }

  async publish<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    const subscribers = this.handlers.get(eventName) ?? [];
    for (const handler of subscribers) {
      await handler(payload);
    }
  }
}

/**
 * Process-wide singleton: every module publishes/subscribes through the
 * same bus instance, matching the SAD's "any module can subscribe without
 * creating a direct dependency" model.
 */
export const eventBus: IEventBus = new InMemoryEventBus();
