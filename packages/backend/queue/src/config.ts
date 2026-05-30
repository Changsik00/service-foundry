/**
 * 큐(redis) 연결 설정 해석 (순수 함수).
 * REDIS_URL 우선, 그 외 REDIS_HOST/REDIS_PORT, 기본 localhost:6379.
 */

export interface QueueConnection {
  host: string;
  port: number;
}

export interface QueueConfig {
  connection: QueueConnection;
}

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 6379;

export function resolveQueueConfig(env: Record<string, string | undefined>): QueueConfig {
  const url = env.REDIS_URL?.trim();
  if (url) {
    const parsed = new URL(url);
    return {
      connection: {
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : DEFAULT_PORT,
      },
    };
  }
  const host = env.REDIS_HOST?.trim() || DEFAULT_HOST;
  const port = env.REDIS_PORT ? Number(env.REDIS_PORT) : DEFAULT_PORT;
  return { connection: { host, port } };
}
