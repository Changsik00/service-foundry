/**
 * @repo/backend-queue — job queue 포트 + BullMQ(redis) 어댑터 (core).
 *
 * 포트(Producer/Consumer)로 추상화 — 어댑터 교체 가능. 첫 어댑터 = BullMQ.
 */

export { createBullProducer, startBullConsumer } from "./bull.js";
export { type QueueConfig, type QueueConnection, resolveQueueConfig } from "./config.js";
export type { Consumer, JobHandler, Producer } from "./port.js";
