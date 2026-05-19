import { describe, expect, it, vi } from "vitest";

import { applySecurity } from "./index.js";

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
