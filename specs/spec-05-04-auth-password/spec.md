# spec-05-04: auth-password (argon2id)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-05-04` |
| **Phase** | `phase-05` |
| **Branch** | `spec-05-04-auth-password` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (pure crypto) |
| **작성일** | 2026-05-21 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- phase-05 진행 중. spec-05-01 (auth-contracts) + spec-05-02 (auth-session) + spec-05-03 (auth-jwt) 머지 완료.
- *password 영역 미구현* — auth-session 의 signin/refresh 가 *password 검증 hook* 없어 반쪽. spec-05-06 (password-reset-flow) 가 endpoint 박을 때 hash 함수 필요.
- ADR-0014 *Security baseline* 의 `argon2` 항목 박을 자리.
- 2026-05-21 *spec-05-04 분할 협의* 채택 — 원안 `auth-security` 4 영역 (argon2 / CSRF / rate-limit / lockout) 중 *argon2 만 pure crypto* 독립. 나머지는 spec-05-05 `auth-rate-limit`.

### 문제점

1. **Password 평문 저장 위험** — User 테이블에 password 저장 시 *반드시 hash*. 어떤 알고리즘? bcrypt / scrypt / argon2 중.
2. **bcrypt 한계** — 72 byte 입력 truncate / memory hard 아님 (GPU 공격 약함). 2026 표준에서 비채택.
3. **Cost parameter 진화** — 하드웨어 발전으로 *5년 전 cost* 가 약함. *rehash* 메커니즘 필요.

### 해결 방안 (요약)

`@repo/backend-auth-password` *framework-agnostic pure crypto* 패키지. `hashPassword` / `verifyPassword` / `needsRehash` + OWASP 2023 권장 cost parameter (memory 19 MiB / iterations 2 / parallelism 1). 라이브러리는 `argon2` (node-argon2, ^0.44).

## 🎯 요구사항

### Functional Requirements

1. **FR-1 hashPassword**: `hashPassword(plain: string, opts?: HashOptions) -> Promise<string>`. argon2id PHC string 반환 (`$argon2id$v=19$m=...$t=...$p=...$salt$hash`). 빈 문자열 거부 (throw).
2. **FR-2 verifyPassword**: `verifyPassword(plain: string, hash: string) -> Promise<boolean>`. wrong password = `false`. malformed hash = throw (프로그래밍 오류). timing-safe (argon2 라이브러리 보장).
3. **FR-3 needsRehash**: `needsRehash(hash: string, opts?: HashOptions) -> boolean`. 저장된 hash 의 cost parameter 가 현 정책보다 약하면 `true` → 호출자가 다음 signin 시 *백그라운드 rehash* 수행.
4. **FR-4 default cost (OWASP 2023)**: memoryCost 19456 (19 MiB), timeCost 2, parallelism 1, hashLength 32 (256-bit). `HashOptions` 로 override 가능.
5. **FR-5 결정성 (사용자 관점)**: 같은 plain + 같은 hash → verify true. 같은 plain 으로 hash 두 번 → 서로 다른 hash (salt 랜덤) 이지만 둘 다 verify true.

### Non-Functional Requirements

1. **NFR-1 Framework-agnostic**: NestJS / Express 등 의존 0.
2. **NFR-2 Single library dependency**: `argon2` (node-argon2) 단일. native binding — apps/api Node 환경 한정 (Edge runtime 미지원, phase-05 backend-only 정책 부합).
3. **NFR-3 검증 시간 ≤ 200ms** (laptop): OWASP cost 로 hash + verify 한 사이클 < 200ms. *너무 느리면 DoS 벡터, 너무 빠르면 brute-force*.
4. **NFR-4 단위 테스트 커버리지**: hash/verify round-trip / verify false / needsRehash 분기 / 빈 input 거부 / cost override / malformed throw.

## 🚫 Out of Scope

- **Rate limit / lockout** → spec-05-05 (`auth-rate-limit`)
- **CSRF** → spec-05-05
- **Password policy** (길이 / 복잡도 / dictionary check) → 별 spec 또는 endpoint 측에서 zod schema 로 처리
- **Breach check** (haveibeenpwned API 등) → 별 spec
- **NestJS adapter** → phase-06
- **Edge runtime** — `argon2` native 라 Node 한정. Edge 호환은 별 spec (`@noble/hashes` 대체 라이브러리).
- **bcrypt / scrypt legacy import** — legacy password migration 별 spec.

## 📑 ADR 후보

본 spec 의 라이브러리 선택은 *ADR-0014 의 argon2 결정* 의 *구현*. 새 ADR 불요.

- [ ] ADR 가치 있는 결정 있음
- [x] 없음 (ADR-0014 구현)

## 🔍 Critique 결과

미실행.

## ✅ Definition of Done

- [ ] `@repo/backend-auth-password` 패키지 생성 + workspace 등록 (`packages/backend/auth-password`)
- [ ] `hashPassword` / `verifyPassword` / `needsRehash` 구현
- [ ] OWASP 2023 cost parameter 기본값 적용
- [ ] 단위 테스트 PASS (round-trip / wrong password / needsRehash 분기 / 빈 input / cost override / malformed throw)
- [ ] lint / typecheck / depcruise 그린
- [ ] `walkthrough.md` + `pr_description.md` 작성 및 ship commit
- [ ] `spec-05-04-auth-password` 브랜치 push + PR 생성 (target: `phase-05-auth-core-security`)
