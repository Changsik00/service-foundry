/**
 * argon2id cost parameters.
 *
 * 기본값은 OWASP Password Storage Cheat Sheet (2023) 의 *minimum* — 환경별 강화 가능.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
 */
export interface HashOptions {
  /** memory in KiB. OWASP 2023 minimum = 19456 (19 MiB). */
  readonly memoryCost?: number;
  /** iterations. OWASP 2023 minimum = 2. */
  readonly timeCost?: number;
  /** parallelism (lane 수). OWASP 2023 = 1. */
  readonly parallelism?: number;
  /** output hash length in bytes. 32 = 256-bit. */
  readonly hashLength?: number;
}

/**
 * 본 패키지 기본 cost — OWASP Password Storage Cheat Sheet (2023) minimum.
 *
 * 하드웨어 발전에 따라 *매년 재검토* 필요. 현 정책 변경 시 `needsRehash` 가
 * 옛 hash 를 *재발급 대상* 으로 식별.
 */
export const DEFAULT_OPTIONS: Required<HashOptions> = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};

/**
 * 호출자 옵션을 default 와 merge — 누락된 키는 default 채움.
 *
 * argon2 라이브러리에 그대로 전달 가능한 *완전한* `Required<HashOptions>` 반환.
 */
export const resolveOptions = (opts?: HashOptions): Required<HashOptions> => ({
  memoryCost: opts?.memoryCost ?? DEFAULT_OPTIONS.memoryCost,
  timeCost: opts?.timeCost ?? DEFAULT_OPTIONS.timeCost,
  parallelism: opts?.parallelism ?? DEFAULT_OPTIONS.parallelism,
  hashLength: opts?.hashLength ?? DEFAULT_OPTIONS.hashLength,
});
