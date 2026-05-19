import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import { describe, expect, it, vi } from "vitest";

import { applySecurity, BackendThrottlerModule } from "./index.js";

interface MockApp {
  use: ReturnType<typeof vi.fn>;
  enableCors: ReturnType<typeof vi.fn>;
}

function createMockApp(): MockApp {
  return {
    use: vi.fn(),
    enableCors: vi.fn(),
  };
}

describe("applySecurity", () => {
  it("default opts → app.use(helmet(...)) + app.enableCors() 모두 호출", () => {
    const app = createMockApp();
    // biome-ignore lint/suspicious/noExplicitAny: NestJS INestApplication mock — test 검증용
    applySecurity(app as any);
    expect(app.use).toHaveBeenCalledTimes(1);
    expect(app.enableCors).toHaveBeenCalledTimes(1);
  });

  it("opts.helmet === false → helmet skip (use 호출 안 됨)", () => {
    const app = createMockApp();
    // biome-ignore lint/suspicious/noExplicitAny: NestJS INestApplication mock — test 검증용
    applySecurity(app as any, { helmet: false });
    expect(app.use).not.toHaveBeenCalled();
    expect(app.enableCors).toHaveBeenCalledTimes(1);
  });

  it("opts.cors === false → enableCors skip", () => {
    const app = createMockApp();
    // biome-ignore lint/suspicious/noExplicitAny: NestJS INestApplication mock — test 검증용
    applySecurity(app as any, { cors: false });
    expect(app.use).toHaveBeenCalledTimes(1);
    expect(app.enableCors).not.toHaveBeenCalled();
  });

  it("opts.cors 객체 → enableCors 에 forward", () => {
    const app = createMockApp();
    const corsOpts = { origin: "https://example.com", credentials: true };
    // biome-ignore lint/suspicious/noExplicitAny: NestJS INestApplication mock — test 검증용
    applySecurity(app as any, { cors: corsOpts });
    expect(app.enableCors).toHaveBeenCalledWith(corsOpts);
  });
});

describe("BackendThrottlerModule", () => {
  it("forRoot() → DynamicModule 구조 (default preset)", () => {
    const mod = BackendThrottlerModule.forRoot();
    expect(mod.module).toBe(BackendThrottlerModule);
    expect(mod.global).toBe(true);
    expect(Array.isArray(mod.imports)).toBe(true);
    expect(Array.isArray(mod.providers)).toBe(true);
    expect(Array.isArray(mod.exports)).toBe(true);
  });

  it("forRoot() → APP_GUARD provider 자동 등록 (ThrottlerGuard)", () => {
    const mod = BackendThrottlerModule.forRoot();
    const providers = mod.providers ?? [];
    const guardProvider = providers.find(
      (p): p is { provide: typeof APP_GUARD; useClass: typeof ThrottlerGuard } =>
        typeof p === "object" && p !== null && "provide" in p && p.provide === APP_GUARD,
    );
    expect(guardProvider).toBeDefined();
    expect(guardProvider?.useClass).toBe(ThrottlerGuard);
  });

  it("forRoot({ ttl, limit }) → 사용자 지정 값 사용 (간접 검증 — imports 존재)", () => {
    const mod = BackendThrottlerModule.forRoot({ ttl: 30_000, limit: 50 });
    // ThrottlerModule.forRoot 가 imports 에 박혀있음 — config 자체는 ThrottlerModule 내부에 박혀 외부 검증 어려움
    // 여기선 forRoot 가 *예외 없이* DynamicModule 반환하는지만 검증
    expect(mod.imports?.length).toBeGreaterThan(0);
  });
});
