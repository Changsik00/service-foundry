import { beforeEach, describe, expect, it } from "vitest";
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

  it("getJwks() — 반복 호출 시 동일 kid (메모이즈 회귀 가드)", async () => {
    const a = await service.getJwks();
    const b = await service.getJwks();
    expect(b.keys.map((k) => k.kid)).toEqual(a.keys.map((k) => k.kid));
  });
});
