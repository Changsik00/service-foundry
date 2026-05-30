/**
 * 스모크용 — producer.enqueue → consumer 핸들러 수신 round-trip (redis).
 * 수신하면 stdout "OK", 타임아웃이면 비-0 종료.
 */

import { createBullProducer, resolveQueueConfig, startBullConsumer } from "./src/index.js";

const { connection } = resolveQueueConfig(process.env);

let received: { n: number } | null = null;
const consumer = startBullConsumer(
  "smoke",
  {
    ping: async (data) => {
      received = data as { n: number };
    },
  },
  connection,
);
const producer = createBullProducer("smoke", connection);

await producer.enqueue("ping", { n: 42 });

const deadline = Date.now() + 15000;
while (received === null && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 200));
}

await producer.close();
await consumer.close();

if (received !== null && (received as { n: number }).n === 42) {
  process.stdout.write("OK");
} else {
  process.stderr.write("FAIL: job not received\n");
  process.exit(1);
}
