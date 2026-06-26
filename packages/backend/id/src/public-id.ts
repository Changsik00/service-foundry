import { randomBytes } from "node:crypto";

/** Crockford base32 알파벳 — 모호문자 I,L,O,U 제외 (대문자 고정). */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** 바이트열을 Crockford base32 로 인코딩 (패딩 없음). 16바이트 → 26자. */
function encodeCrockford(bytes: Uint8Array): string {
  let value = 0;
  let bits = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(value >>> bits) & 31];
    }
    value &= (1 << bits) - 1; // 남은 하위 비트만 보존 — 32bit 정수 오버플로 방지
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
  return out;
}

/**
 * 불투명 외부 식별자 생성 (ADR-0028).
 * `<prefix>_<128bit 랜덤의 Crockford base32 26자>`. timestamp·순서 정보 없음(비정렬).
 */
export function publicId(prefix: string): string {
  return `${prefix}_${encodeCrockford(randomBytes(16))}`;
}
