import { describe, expect, it } from "vitest";

import { decodeJwtExp } from "./jwt";

// base64url(JSON) — 테스트용 토큰 payload 생성기.
function makeToken(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${b64}.sig`;
}

describe("decodeJwtExp", () => {
  it("exp(sec) 를 epoch ms 로 반환", () => {
    const token = makeToken({ exp: 1_700_000_000, sub: "u1" });
    expect(decodeJwtExp(token)).toBe(1_700_000_000_000);
  });

  it("exp 없으면 null", () => {
    expect(decodeJwtExp(makeToken({ sub: "u1" }))).toBeNull();
  });

  it("exp 가 숫자가 아니면 null", () => {
    expect(decodeJwtExp(makeToken({ exp: "soon" }))).toBeNull();
  });

  it("형식이 깨진 토큰은 null", () => {
    expect(decodeJwtExp("not-a-jwt")).toBeNull();
    expect(decodeJwtExp("")).toBeNull();
    expect(decodeJwtExp("a.b")).toBeNull();
  });

  it("payload 가 유효 base64url JSON 이 아니면 null", () => {
    expect(decodeJwtExp("header.@@@.sig")).toBeNull();
  });
});
