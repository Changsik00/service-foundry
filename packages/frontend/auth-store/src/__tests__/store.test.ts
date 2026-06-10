import { describe, expect, it } from "vitest";
import { createAuthStore } from "../store.js";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  role: "user" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("createAuthStore", () => {
  it("초기 상태는 unknown, token/user null", () => {
    const store = createAuthStore();
    const { status, token, user } = store.getState();
    expect(status).toBe("unknown");
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("setAuthenticated → authenticated + token + user 설정", () => {
    const store = createAuthStore();
    store.getState().setAuthenticated(validUser, "tok_123");
    const { status, token, user } = store.getState();
    expect(status).toBe("authenticated");
    expect(token).toBe("tok_123");
    expect(user).toEqual(validUser);
  });

  it("setUnauthenticated → unauthenticated, token/user null", () => {
    const store = createAuthStore();
    store.getState().setAuthenticated(validUser, "tok");
    store.getState().setUnauthenticated();
    const { status, token, user } = store.getState();
    expect(status).toBe("unauthenticated");
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("setToken → token만 갱신, status/user 유지", () => {
    const store = createAuthStore();
    store.getState().setAuthenticated(validUser, "old_tok");
    store.getState().setToken("new_tok");
    expect(store.getState().token).toBe("new_tok");
    expect(store.getState().status).toBe("authenticated");
    expect(store.getState().user).toEqual(validUser);
  });

  it("subscribe — 상태 변경 시 리스너 호출", () => {
    const store = createAuthStore();
    const calls: string[] = [];
    const unsub = store.subscribe((s) => calls.push(s.status));
    store.getState().setAuthenticated(validUser, "tok");
    store.getState().setUnauthenticated();
    unsub();
    expect(calls).toEqual(["authenticated", "unauthenticated"]);
  });
});
