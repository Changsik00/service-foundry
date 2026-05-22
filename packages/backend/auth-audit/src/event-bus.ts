import type { AuthEvent } from "./events.js";

type AuthEventHandler = (event: AuthEvent) => void;

export class AuthEventBus {
  private readonly handlers = new Set<AuthEventHandler>();

  on(handler: AuthEventHandler): void {
    this.handlers.add(handler);
  }

  off(handler: AuthEventHandler): void {
    this.handlers.delete(handler);
  }

  emit(event: AuthEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
