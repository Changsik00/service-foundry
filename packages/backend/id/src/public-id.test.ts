import { describe, expect, it } from "vitest";
import { ID_PREFIX, publicId } from "./index.js";

// Crockford base32: 0-9 + A-Z 에서 I,L,O,U 제외 (대문자)
const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("publicId", () => {
  it("형식: `<prefix>_` + Crockford base32 26자", () => {
    const id = publicId(ID_PREFIX.user);
    expect(id.startsWith("usr_")).toBe(true);
    const body = id.slice("usr_".length);
    expect(body).toMatch(CROCKFORD);
  });

  it("전달된 prefix 를 그대로 접두", () => {
    expect(publicId("xyz").startsWith("xyz_")).toBe(true);
    expect(publicId(ID_PREFIX.apiKey).startsWith("key_")).toBe(true);
  });

  it("랜덤부 문자집합이 Crockford(모호문자 I/L/O/U 없음)만 사용", () => {
    const body = publicId(ID_PREFIX.org).slice("org_".length);
    expect(body).not.toMatch(/[ILOU]/);
  });

  it("고유성: 10000개 생성 시 충돌 0", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10000; i++) set.add(publicId(ID_PREFIX.session));
    expect(set.size).toBe(10000);
  });

  it("불투명성: 생성순서와 정렬순서가 무관 (timestamp/순서 정보 없음)", () => {
    const gen = Array.from({ length: 100 }, () => publicId(ID_PREFIX.user));
    const sorted = [...gen].sort();
    // 순차 생성 id 가 정렬 결과와 같으면 순서정보가 새는 것 — 랜덤이면 사실상 불가능
    expect(sorted).not.toEqual(gen);
  });
});
