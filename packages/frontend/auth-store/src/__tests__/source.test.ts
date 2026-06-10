import { describe, expect, it, vi } from "vitest";
import { createAuthSource } from "../source.js";
import { createAuthStore } from "../store.js";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  role: "user" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("createAuthSource", () => {
  it("status — store 상태를 실시간 반영한다", () => {
    const store = createAuthStore();
    const source = createAuthSource(store);
    expect(source.status).toBe("unknown");
    store.getState().setAuthenticated(validUser, "tok");
    expect(source.status).toBe("authenticated");
    store.getState().setUnauthenticated();
    expect(source.status).toBe("unauthenticated");
  });

  it("getToken — authenticated 상태에서 토큰 반환", async () => {
    const store = createAuthStore();
    store.getState().setAuthenticated(validUser, "tok_abc");
    const source = createAuthSource(store);
    await expect(source.getToken()).resolves.toBe("tok_abc");
  });

  it("getToken — unauthenticated 상태에서 null 반환", async () => {
    const store = createAuthStore();
    store.getState().setUnauthenticated();
    const source = createAuthSource(store);
    await expect(source.getToken()).resolves.toBeNull();
  });

  it("getToken — unknown 상태에서 null 반환", async () => {
    const store = createAuthStore();
    const source = createAuthSource(store);
    await expect(source.getToken()).resolves.toBeNull();
  });

  it("refresh — opts.refresh 호출", async () => {
    const store = createAuthStore();
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const source = createAuthSource(store, { refresh: mockRefresh });
    await source.refresh();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("refresh — opts 없으면 Error throw", async () => {
    const store = createAuthStore();
    const source = createAuthSource(store);
    await expect(source.refresh()).rejects.toThrow();
  });

  it("waitUntilSettled — 이미 authenticated이면 즉시 resolve", async () => {
    const store = createAuthStore();
    store.getState().setAuthenticated(validUser, "tok");
    const source = createAuthSource(store);
    await expect(source.waitUntilSettled(5000)).resolves.toBeUndefined();
  });

  it("waitUntilSettled — 이미 unauthenticated이면 즉시 resolve", async () => {
    const store = createAuthStore();
    store.getState().setUnauthenticated();
    const source = createAuthSource(store);
    await expect(source.waitUntilSettled(5000)).resolves.toBeUndefined();
  });

  it("waitUntilSettled — unknown → authenticated 전환 시 resolve", async () => {
    const store = createAuthStore();
    const source = createAuthSource(store);
    setTimeout(() => store.getState().setAuthenticated(validUser, "tok"), 30);
    await expect(source.waitUntilSettled(500)).resolves.toBeUndefined();
    expect(store.getState().status).toBe("authenticated");
  });

  it("waitUntilSettled — timeout 만료 시 reject 아닌 resolve", async () => {
    const store = createAuthStore();
    const source = createAuthSource(store);
    await expect(source.waitUntilSettled(50)).resolves.toBeUndefined();
    expect(store.getState().status).toBe("unknown");
  });
});
