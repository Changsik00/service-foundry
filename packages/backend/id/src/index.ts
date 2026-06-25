// TDD Red 스텁 — 타입 시그니처만 제공해 turbo typecheck 를 통과시키고(미존재 import 차단 회피),
// 로직은 미구현(throw)으로 두어 logic 테스트가 RED 가 되게 한다 ([[feedback_tdd_red_typecheck_gate]]).
// spec-26-01 Green 에서 prefix.ts / public-id.ts / uuidv7.ts 로 분리·구현하며 본 배럴은 re-export 로 대체된다.

export const ID_PREFIX = {
  user: "usr",
  org: "org",
  session: "ses",
  apiKey: "key",
} as const;

export type IdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];

export function publicId(_prefix: string): string {
  throw new Error("not implemented");
}

export function uuidv7(): string {
  throw new Error("not implemented");
}
