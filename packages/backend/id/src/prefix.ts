/**
 * public_id prefix 중앙 레지스트리 (ADR-0028).
 * 외부 노출 aggregate root 의 식별자 접두 단일 출처 — 로그 자기설명·타입 혼동 방지.
 * 확정 root (spec-26-01 감사): users / organizations / sessions / api-keys.
 */
export const ID_PREFIX = {
  user: "usr",
  org: "org",
  session: "ses",
  apiKey: "key",
} as const;

export type IdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];
