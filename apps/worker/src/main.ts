/**
 * @apps/worker — 백그라운드 작업 consumer.
 *
 * "default" 큐를 구독해 등록된 핸들러로 작업을 처리한다.
 * (graceful shutdown 정식 처리는 phase-12 spec-12-04. 여기선 기본 SIGTERM close.)
 */

import { createLogger } from "@repo/backend-logger";
import { type JobHandler, resolveQueueConfig, startBullConsumer } from "@repo/backend-queue";

const logger = createLogger({ level: "info" });

const { connection } = resolveQueueConfig(process.env);

const handlers: Record<string, JobHandler> = {
  // 데모 핸들러 — 실제 작업(예: 이메일 발송)으로 교체.
  demo: async (data) => {
    logger.info({ data }, "[worker] demo job");
  },
};

const consumer = startBullConsumer("default", handlers, connection);
logger.info(
  { queue: "default", redis: `${connection.host}:${connection.port}` },
  "[worker] consumer started",
);

const shutdown = async (): Promise<void> => {
  await consumer.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
