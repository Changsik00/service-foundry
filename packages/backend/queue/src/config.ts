export interface QueueConnection {
  host: string;
  port: number;
}

export interface QueueConfig {
  connection: QueueConnection;
}

// TDD 스텁 — 구현은 Green 단계.
export function resolveQueueConfig(_env: Record<string, string | undefined>): QueueConfig {
  throw new Error("not implemented");
}
