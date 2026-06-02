# Walkthrough: spec-05-04 auth-password

## 1. 본 spec 의 목표

`@repo/backend-auth-password` — *framework-agnostic pure crypto* argon2id 패키지.

- `hashPassword` — argon2id PHC string, OWASP 2023 default cost
- `verifyPassword` — boolean 반환 + malformed throw 분리
- `needsRehash` — 정책 변경 시 옛 hash 식별
- `HashOptions` / `DEFAULT_OPTIONS` — OWASP 2023 (m=19MiB / t=2 / p=1 / hashLen=32)

ADR-0014 의 *암호 영역* 구현. 원안 `auth-security` 4 영역 중 *argon2 만* 본 spec — 나머지 (CSRF / rate-limit / lockout) 는 spec-05-05 `auth-rate-limit`.

## 2. 코드 투어

### 2-1. signup flow

```ts
import { hashPassword } from "@repo/backend-auth-password";

// apps/api 의 POST /auth/signup
const stored = await hashPassword(plainPassword);
// → "$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>"
await userRepo.insert({ email, passwordHash: stored });
```

### 2-2. signin flow + 자동 rehash

```ts
import { hashPassword, verifyPassword, needsRehash } from "@repo/backend-auth-password";

// apps/api 의 POST /auth/signin
const user = await userRepo.findByEmail(email);
if (!user) return enumerationSafeReject();   // spec-05-05 rate-limit 책임

if (await verifyPassword(plainPassword, user.passwordHash)) {
  // 정책 갱신 시 백그라운드 rehash (UX 영향 0)
  if (needsRehash(user.passwordHash)) {
    const fresh = await hashPassword(plainPassword);
    await userRepo.updatePasswordHash(user.id, fresh);  // fire-and-forget OK
  }
  // session 발급 (auth-session) + access token (auth-jwt) 발급
}
```

### 2-3. 정책 환경별 강화

```ts
// staging/prod 강화
const stored = await hashPassword(plain, {
  memoryCost: 65536,   // 64 MiB
  timeCost: 3,
  parallelism: 2,
});

// 옛 cost 의 hash 는 다음 signin 시 자동 rehash
if (needsRehash(legacyHash, { memoryCost: 65536, timeCost: 3, parallelism: 2 })) {
  // ...
}
```

## 3. 핵심 설계 결정

### 3-1. argon2id (id variant 강제)

ADR-0014. argon2d 는 GPU side-channel 강함, argon2i 는 timing 강함, argon2id 는 *둘의 균형*. 2026 OWASP / IETF RFC 9106 표준 권장. 본 spec 은 `type: argon2.argon2id` 박아서 *다른 variant 발급 불가*.

### 3-2. OWASP 2023 default cost — 환경별 강화 자연

`DEFAULT_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, hashLength: 32 }`.

OWASP Password Storage Cheat Sheet *minimum* 값. 보수적이라 *어느 환경에서도 동작 보장*. staging/prod 는 `hashPassword(plain, {memoryCost: 65536, ...})` 으로 강화. `needsRehash` 가 옛 hash 식별 — *언제든 cost up*.

### 3-3. `verifyPassword` 반환 `Promise<boolean>` — jwt verify 와 다른 정책

| 함수 | 반환 | 사유 |
|---|---|---|
| `verifyAccessToken` (spec-05-03) | `Promise<Result<Claims, AppError>>` | 실패 분기 다양 (expired/invalid/key-not-found/claim-mismatch) — match 패턴 자연 |
| `verifyPassword` (본 spec) | `Promise<boolean>` | 실패 분기 *1 종* (wrong password) — boolean 충분. malformed hash 만 throw |

*책임 분리*:
- wrong password → false (예상 사용자 흐름)
- malformed hash → throw `AppError({code: "PASSWORD_HASH_MALFORMED", statusCode: 500})` (프로그래밍/저장 오류)

### 3-4. AppError code 카탈로그 — open registry (ADR-0012)

본 spec 도 `@repo/errors` open registry 활용 — 별 enum 추가 없음.

| code | 상황 | statusCode |
|---|---|---|
| `PASSWORD_EMPTY` | `hashPassword("")` | 400 (사용자 input 오류, signup 시점) |
| `PASSWORD_HASH_MALFORMED` | `verifyPassword(x, "not-a-phc-string")` | 500 (저장된 hash 가 깨짐 — 시스템 오류) |

### 3-5. argon2 라이브러리 (`node-argon2 ^0.44.0`) — native binding

OWASP cheatsheet 표준 예제 라이브러리. native build (C++ binding) — `pnpm-workspace.yaml` 의 `allowBuilds.argon2: true` 박음. prebuild 다수 (Apple Silicon / x86_64 / linux/arm 등). Docker / CI 환경에서 prebuild 실패 시 build-time toolchain 필요 — 본 spec scope 는 아님 (phase-10 ops verify).

### 3-6. `needsRehash` — argon2 라이브러리 native API 활용

`argon2.needsRehash(hash, opts)` 가 PHC string 파싱 + cost 비교 *모두 자체*. 본 spec 의 `needsRehash(hash, opts?)` 는 *얇은 wrapper* — `resolveOptions` 박은 후 라이브러리 호출. `type` 옵션은 라이브러리가 받지 않으므로 제외 (argon2id 만 사용한다는 invariant 는 *hashPassword 측* 에서 강제).

### 3-7. Task 2 단일 commit — pure data 의 TDD ceremony 가치 약함

`HashOptions` + `DEFAULT_OPTIONS` 는 *데이터 정의* — stub 박을 의미 약함. spec-05-03 의 KeyStore interface 와 비교: KeyStore 는 *함수 contract* 라 stub throw → Green 분리 의미 있음. 본 spec 의 options 는 *값 정의* 라 분리 의미 없음. 단일 commit 처리.

## 4. 검증 결과

### 4-1. 단위 테스트

```bash
pnpm --filter @repo/backend-auth-password test
```

- ✅ `options.test.ts` (2 tests) — DEFAULT_OPTIONS / resolveOptions merge
- ✅ `hash.test.ts` (4 tests) — PHC shape / salt 랜덤 / cost override / 빈 input
- ✅ `verify.test.ts` (4 tests) — round-trip / wrong password / 빈 input / malformed throw
- ✅ `rehash.test.ts` (3 tests) — 옛 cost true / 현 cost false / 명시 opts 비교

**총 13/13 PASS** (~250ms).

### 4-2. 정적 분석

```bash
pnpm --filter @repo/backend-auth-password lint     # biome — 12 files clean
pnpm typecheck                                      # turbo — 29 packages PASS
```

### 4-3. depcruise

```bash
npx depcruise --config packages/config/depcruise-config/base.cjs packages apps
# ✔ no dependency violations found (167 modules, 260 dependencies cruised)
```

`packages-no-app-imports` / `no-circular` / framework adapter 규칙 (ADR-0015) 모두 그린.

### 4-4. argon2 native build 검증

`pnpm install` 시점에 `.../argon2@0.44.0/node_modules/argon2 install$ cross-env ZERO_AR_DATE=1 node-gyp-build` 실행 — 본 로컬 (macOS Darwin 25.4.0) 에서 prebuild 사용 성공. test 실행 시 hash/verify round-trip 정상 동작 → native binding 검증 완료.

## 5. 본 spec 의 *scope 밖*

- **Rate limit / account lockout / CSRF** → spec-05-05 `@repo/backend-auth-rate-limit`
- **NestJS adapter** (DI provider, request-scoped) → phase-06
- **Edge runtime** — `argon2` native 라 Node 한정. Edge 호환은 별 spec (`@noble/hashes/argon2id` 대체)
- **Pepper (server-side secret)** — README 의 *Cost Parameter 정공법 (미래 검토)* 표 박힘
- **Password policy** (길이 / 복잡도 / dictionary check) → spec-05-06 endpoint zod schema
- **Breach check** (haveibeenpwned API) → 별 spec
- **Legacy bcrypt/scrypt migration** → 별 spec — `verifyLegacy` 추가 시점

## 6. 결정 기록 (Decision Log)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 라이브러리 | `argon2` (node) / `@node-rs/argon2` / `@noble/hashes` | **argon2 (node)** | OWASP cheatsheet 표준 예제. native binding (prebuilt 다수). |
| Default cost | OWASP 2023 minimum / 강화 (m=64MiB+) | **OWASP minimum** | 보수적 — 어느 환경에서도 동작 보장. 강화는 `hashPassword(plain, opts)` override. |
| `verifyPassword` 반환 | Result / boolean | **boolean** | 실패 분기 1 종 (wrong password) — Result ceremony 가치 약함. malformed 는 throw 로 분리. |
| `hashPassword("")` | false 반환 / throw | **throw** (PASSWORD_EMPTY) | signup 시점 빈 input 은 *프로그래밍 오류* — endpoint zod schema 가 이미 막아야 함. defensive throw. |
| `verifyPassword("", h)` | throw / false | **false** | 사용자 login form 의 *빈 password* 입력은 *예상 사용자 흐름*. hash 와 매칭되지 않으므로 false. |
| `needsRehash` 시그니처 | async / sync | **sync** | argon2 의 `needsRehash` 는 sync (string parse 만). 호출자 패턴 단순. |
| Task 2 commit 분리 | Red/Green 분리 / 단일 | **단일** | options 는 pure data — TDD stub 의 의미 약함. spec-05-03 KeyStore (함수 contract) 와 본 spec 의 options (값 정의) 의 차이. |

## 7. 사용자 협의

- **주제**: spec-05-04 분할 — 원안 `auth-security` 4 영역 vs 2 분할
  - **사용자 의견**: "옵션 2로 진행" — argon2 / rate-limit+lockout+CSRF 2 분할.
  - **합의**: 본 spec 은 argon2 만, spec-05-05 가 rate-limit+lockout+CSRF. 기존 -05/-06 (password-reset / email-verify) 는 -06/-07 로 시프트. phase-05.md 본문 정정 + chore commit (`4f40c38`).

- **주제**: argon2 라이브러리 / cost / verify 반환 타입
  - **사용자 의견**: Plan Accept (모든 검토 항목 OK)
  - **합의**: argon2 ^0.44.0 / OWASP 2023 minimum / boolean 반환.

## 8. 발견 사항

- **pnpm allowBuilds 자동 안내** — argon2 같은 native binding 라이브러리는 첫 install 시 pnpm 가 `allowBuilds.<name>: set this to true or false` 라인 자동 추가. 보안 옵트인 메커니즘. 본 spec 에서 `true` 박음.
- **argon2 라이브러리의 옵션 정합성** — `argon2.hash` 는 `type` 받음 / `argon2.needsRehash` 는 `type` 안 받음. 라이브러리 API 비대칭이라 `type` 강제 invariant 는 *hashPassword 측* 에서만. needsRehash 는 *cost 비교* 만 — type 차이 무관.
- **argon2 v0.44 의 옵션 type 변경** — v0.41 까지는 `type` 가 hash/needsRehash 둘 다 받았지만 v0.44 는 분리. plan 작성 시 모름 → Green 단계에서 typecheck error 로 감지 → 정정. (다음 라이브러리 도입 시 *API 차이* 사전 검토 강화 항목.)

## 9. 이월 항목

- 없음 — README §"Cost Parameter 정공법 (미래 검토)" 표가 후속 spec/phase 의 *기억 위치*.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-21 |
| **총 commit** | 11 (planning 1 + scaffold 1 + options 1 + TDD red/green 3×2 + README 1 + ship 1) |
| **테스트** | 13/13 PASS / lint clean / depcruise 0 violations |
| **PR target** | `phase-05-auth-core-security` |
