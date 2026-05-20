# Walkthrough: spec-05-01 auth-contracts-extend

> phase-05 첫 spec. `@repo/auth-contracts` 확장 — 7 신규 zod schema + AuthResult discriminated union + MfaChallenge interface 자리 + `ts-pattern` 도입.

## 📌 결정

| 이슈 | 결정 |
|---|---|
| AuthResult variant | 3 (success / mfa_required + challenge / error reason 4종) |
| Password 검증 | `z.string().min(8).max(128)` — 최소만 (강도 검증은 spec-05-04) |
| Token 검증 | `z.string().min(20)` — URL-safe random 가정 |
| displayName | optional in SignUp |
| MfaChallenge | interface 자리만 (phase-07 실 구현) |
| ts-pattern 채택 | `match().exhaustive()` — discriminated union 안전 처리 (#19 Phase 5 후보 흡수) |

## 💬 사용자 협의

| 시점 | 결정 |
|---|---|
| phase-05 진입 | "다음 진행으로 phase 5 하면 되지?" |
| issue 검토 + 흡수 항목 | A: phase-05.md 본문 갱신 + 진입 |
| Close 정책 | A: Refs 박음 (실 구현 완료 시점 close) |
| phase chore 위치 | "phase 브랜치에서 처리" → feedback memory 박힘 |
| spec-05-01 진입 | "진행해" — 즉시 |
| Plan Accept | 즉시 |

## 🔁 진행

### T1 — 브랜치
- `git checkout -b spec-05-01-auth-contracts-extend`

### T2 — catalog ts-pattern (`b8e22c3`)
- catalog: `ts-pattern ^5.9.0`
- `@repo/auth-contracts/package.json` dep: `ts-pattern` catalog
- spec/plan/task 문서 + queue + phase 표 동봉

### T3 — TDD Red → Green (`9b7eee3` Red → `a944772` Green)
**Red**: 17 신규 test (schema parse + AuthResult ts-pattern match). stub schema (length 검증 부재) → 11 fail.
**Green**: Password/Token primitive + 7 schema (length 검증 박음) → 23/23 ✓.

### T4 — 통합 검증
- lint ✓ 20 / typecheck ✓ 20 FULL TURBO / test ✓ **196 PASS** / depcruise ✓ 0 violations (130 modules / 189 deps)

### T5 — Ship (본 commit)

## 🧪 검증 결과

| 패키지 | test | 비고 |
|---|---|---|
| `@repo/auth-contracts` | 6 → **23** | +17 신규 (schema 12 + MfaChallenge 1 + AuthResult 4) |
| 기타 19 | 173 | 변경 없음 |
| **합계** | **196** | all green |

## 🔍 발견 사항

1. **ts-pattern `.exhaustive()` 가치 강력**: AuthResult 의 4 error reason 추가 시 — 그 reason 처리 안 박으면 *typecheck error*. switch case 보다 안전.

2. **MfaChallenge interface 자리** — phase-07 진입 시 *실 구현 (TOTP / Passkey)* 가 *interface 가 이미 박힘*. 후속 작업 자연.

3. **Password schema 최소 검증**: zod schema 자체는 *서버 입력 검증* — 실 강도 검증 (zxcvbn 등 / 사전 단어) 은 *별 시점* (spec-05-04 auth-security argon2 hash 박을 때 자연 결정).

4. **AuthResult 의 *error reason* 직접 노출** — *enumeration 위험* (계정 존재 여부 노출 등). 실 endpoint 응답 (spec-05-05 password-reset) 에서 *동일한 200 응답* 패턴 박을 가치 — schema 는 *server-internal*, 응답 wire 는 *masking* 분리.

5. **Token / Password 의 *primitive 분리*** — 후속 spec (auth-session 의 Token 생성, auth-security 의 Password hash) 가 *같은 schema 재사용*. 재사용 박힘 시 일관 유지.

## 🚧 이월

- 실 password 강도 검증 (spec-05-04 또는 별 spec)
- AuthResult 응답 masking (spec-05-05 password-reset 응답 — 동일 200 패턴)
- Session model (Drizzle schema + rotation chain) — spec-05-02
- JWT EdDSA + JWKS — spec-05-03
