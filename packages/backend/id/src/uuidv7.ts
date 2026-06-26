import { randomBytes } from "node:crypto";

/**
 * RFC 9562 UUID v7 생성 (앱-레이어, PG 버전 비의존 — ADR-0028).
 * 앞 48bit = ms timestamp(시간순), 이후 version(7)·variant(10xx)·랜덤.
 * **내부 PK default 전용** — 외부로 노출하지 않는다(timestamp 내포).
 *
 * ⚠️ **미배선 유틸 (phase-26 미시행, ADR-0028 §3)**: 현재 어떤 테이블 PK 도 v7 을 쓰지 않는다
 * (전부 `gen_random_uuid()` v4). 내부 PK v7 전환은 별도 appetite 시 후속 spec — 그때 이 유틸을
 * drizzle `$defaultFn` 또는 plpgsql `gen_uuidv7()` 로 배선한다. (회고 spec-26-08 에서 dead-code 명시.)
 */
export function uuidv7(): string {
  const bytes = randomBytes(16);
  const ts = Date.now();

  // 48-bit big-endian timestamp → bytes[0..5]
  bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70; // version 7
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // variant 10xx

  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
