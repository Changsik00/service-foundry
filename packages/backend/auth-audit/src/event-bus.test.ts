import { describe, expect, it, vi } from "vitest";
import { AuthEventBus } from "./event-bus.js";
import type { AuthEvent } from "./events.js";

describe("AuthEventBus", () => {
  it("emit한 이벤트가 on 핸들러에 전달됨", () => {
    const bus = new AuthEventBus();
    const handler = vi.fn();
    bus.on(handler);

    const event: AuthEvent = { type: "SIGNED_IN", userId: "u1", sessionId: "s1" };
    bus.emit(event);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("여러 핸들러 동시 등록 가능", () => {
    const bus = new AuthEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on(h1);
    bus.on(h2);

    bus.emit({ type: "SIGNED_OUT", sessionId: "s1" });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("off 후 핸들러 미호출", () => {
    const bus = new AuthEventBus();
    const handler = vi.fn();
    bus.on(handler);
    bus.off(handler);

    bus.emit({ type: "TOKEN_REFRESHED", sessionId: "s1" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("LOGIN_FAILED 이벤트 전달", () => {
    const bus = new AuthEventBus();
    const handler = vi.fn();
    bus.on(handler);

    const event: AuthEvent = {
      type: "LOGIN_FAILED",
      email: "a@b.com",
      reason: "invalid_credentials",
    };
    bus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });
});
