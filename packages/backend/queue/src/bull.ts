/** BullMQ(redis) 어댑터 — 포트(Producer/Consumer) 구현. */

import { Queue, Worker } from "bullmq";

import type { QueueConnection } from "./config.js";
import type { Consumer, JobHandler, Producer } from "./port.js";

/** producer — 지정 큐에 작업 enqueue. */
export function createBullProducer(queueName: string, connection: QueueConnection): Producer {
  const queue = new Queue(queueName, { connection });
  return {
    async enqueue<T>(jobName: string, data: T): Promise<void> {
      await queue.add(jobName, data);
    },
    async close(): Promise<void> {
      await queue.close();
    },
  };
}

/** consumer — jobName→handler 매핑으로 작업 처리. */
export function startBullConsumer(
  queueName: string,
  handlers: Record<string, JobHandler>,
  connection: QueueConnection,
): Consumer {
  const worker = new Worker(
    queueName,
    async (job) => {
      const handler = handlers[job.name];
      if (handler) await handler(job.data);
    },
    { connection },
  );
  return {
    async close(): Promise<void> {
      await worker.close();
    },
  };
}
