import { describe, expect, it, vi } from "vitest";
import { createMemoryOutboxStore, createOutboxRelay, type OutboxEvent } from "./index.js";

describe("createMemoryOutboxStore", () => {
  it("add 한 이벤트는 fetchUnpublished 에 포함된다", async () => {
    const store = createMemoryOutboxStore();
    const ev = await store.add({ type: "user.created", payload: { id: 1 } });
    expect(ev.id).toBeTruthy();
    expect(ev.publishedAt).toBeUndefined();
    const pending = await store.fetchUnpublished(10);
    expect(pending.map((e) => e.id)).toEqual([ev.id]);
  });

  it("markPublished 후에는 fetchUnpublished 에서 제외된다", async () => {
    const store = createMemoryOutboxStore();
    const a = await store.add({ type: "t", payload: 1 });
    await store.add({ type: "t", payload: 2 });
    await store.markPublished([a.id]);
    const pending = await store.fetchUnpublished(10);
    expect(pending.map((e) => e.payload)).toEqual([2]);
  });

  it("fetchUnpublished 는 limit 을 적용한다", async () => {
    const store = createMemoryOutboxStore();
    await store.add({ type: "t", payload: 1 });
    await store.add({ type: "t", payload: 2 });
    await store.add({ type: "t", payload: 3 });
    expect(await store.fetchUnpublished(2)).toHaveLength(2);
  });
});

describe("createOutboxRelay", () => {
  it("미발행 이벤트를 모두 발행하고 마킹한다 (재호출 시 0)", async () => {
    const store = createMemoryOutboxStore();
    await store.add({ type: "t", payload: 1 });
    await store.add({ type: "t", payload: 2 });
    const published: OutboxEvent[] = [];
    const relay = createOutboxRelay({ store, publish: async (e) => void published.push(e) });

    expect(await relay.runOnce()).toBe(2);
    expect(published.map((e) => e.payload)).toEqual([1, 2]);
    expect(await relay.runOnce()).toBe(0);
    expect(await store.fetchUnpublished(10)).toHaveLength(0);
  });

  it("publish 실패 시 해당 이벤트는 미마킹되어 다음 runOnce 에서 재시도된다", async () => {
    const store = createMemoryOutboxStore();
    await store.add({ type: "t", payload: 1 });
    const publish = vi
      .fn<(e: OutboxEvent) => Promise<void>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue();

    const relay = createOutboxRelay({ store, publish });
    expect(await relay.runOnce()).toBe(0); // 첫 시도 실패
    expect(await store.fetchUnpublished(10)).toHaveLength(1); // 미마킹 유지
    expect(await relay.runOnce()).toBe(1); // 재시도 성공
    expect(await store.fetchUnpublished(10)).toHaveLength(0);
  });

  it("batchSize 만큼만 처리한다", async () => {
    const store = createMemoryOutboxStore();
    await store.add({ type: "t", payload: 1 });
    await store.add({ type: "t", payload: 2 });
    await store.add({ type: "t", payload: 3 });
    const relay = createOutboxRelay({ store, publish: async () => {}, batchSize: 2 });
    expect(await relay.runOnce()).toBe(2);
    expect(await store.fetchUnpublished(10)).toHaveLength(1);
  });
});
