import * as authJwt from "@repo/backend-auth-jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JwtService } from "./jwt.service.js";

describe("JwtService", () => {
  let service: JwtService;

  beforeEach(async () => {
    service = new JwtService();
    await service.onModuleInit();
  });

  it("getKeyStore() — init 후 keystore 반환", () => {
    expect(service.getKeyStore()).toBeDefined();
  });

  it("getJwks() — kid 를 가진 공개키 1개 이상의 JWKS 반환", async () => {
    const jwks = await service.getJwks();
    expect(Array.isArray(jwks.keys)).toBe(true);
    expect(jwks.keys.length).toBeGreaterThan(0);
    expect(jwks.keys[0]?.kid).toBeTruthy();
  });

  it("getJwks() — 반복 호출 시 toJwks 1회만 (메모이즈 실검증)", async () => {
    const toJwksSpy = vi.spyOn(authJwt, "toJwks");
    const a = await service.getJwks();
    const b = await service.getJwks();
    // 캐시 적중 — 두 번째 호출은 toJwks 재계산 없음.
    expect(toJwksSpy).toHaveBeenCalledTimes(1);
    expect(b.keys.map((k) => k.kid)).toEqual(a.keys.map((k) => k.kid));
    toJwksSpy.mockRestore();
  });
});
