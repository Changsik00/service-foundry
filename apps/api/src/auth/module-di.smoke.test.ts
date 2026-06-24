import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

// AppModule 구성·settings 로딩에 필요한 최소 env (e2e 와 동일 기본값).
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://app_runtime:test@localhost:5434/test";
process.env.DATABASE_MIGRATE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");

/**
 * DI-compile smoke (Wd 안전망, spec-25-01).
 *
 * route-inventory(리플렉션)는 DI 그래프 resolve 를 검증하지 못해 "서비스 이동→DI 깨짐"이
 * CI e2e(전체 부팅)에서만 잡혔다. `.compile()` 은 전 컨트롤러/프로바이더를 인스턴스화하므로
 * (pg Pool 은 lazy — 무-DB) 빠른 DI 회귀 가드가 된다. phase-25 E3/E4 이관의 안전망.
 */
describe("module DI-compile smoke (refactor safety net, spec-25-01)", () => {
  it("AppModule DI 그래프가 resolve 된다 (컨트롤러/프로바이더 인스턴스화)", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
