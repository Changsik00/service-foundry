import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ApiKeyGuard } from "./api-key.guard.js";
import type { ApiKeyPublic } from "./api-key.service.js";

function makeCtx(apiKeyHeader?: string) {
  const req: Record<string, unknown> = {
    headers: apiKeyHeader ? { "x-api-key": apiKeyHeader } : {},
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    req,
  } as never;
}

function makeService(result: ApiKeyPublic | null) {
  return { verifyKey: vi.fn().mockResolvedValue(result) };
}

const fakeKey: ApiKeyPublic = {
  id: "key-001",
  orgId: "org-001",
  name: "Test",
  keyPreview: "abcd1234",
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date(),
};

describe("ApiKeyGuard", () => {
  it("X-API-Key 헤더 없음 → UnauthorizedException", async () => {
    const guard = new ApiKeyGuard(makeService(null) as never);
    await expect(guard.canActivate(makeCtx())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("무효 키 → UnauthorizedException", async () => {
    const guard = new ApiKeyGuard(makeService(null) as never);
    await expect(guard.canActivate(makeCtx("sk_invalid"))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("유효 키 → true + req.user 세팅", async () => {
    const ctx = makeCtx(`sk_${"a".repeat(64)}`);
    const guard = new ApiKeyGuard(makeService(fakeKey) as never);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect((ctx as never as { req: { user: unknown } }).req.user).toMatchObject({
      sub: "key-001",
      orgId: "org-001",
      role: "user",
      orgRole: null,
    });
  });
});
