# feat(spec-05-04): @repo/backend-auth-password — argon2id

## 📋 Summary

### 배경 및 목적

phase-05 의 *backend-only* auth 모듈 중 *password 영역* 박음. ADR-0014 의 argon2 항목 구현. 원안 `auth-security` 4 영역 (argon2 / CSRF / rate-limit / lockout) 중 argon2 만 본 spec — 나머지는 spec-05-05 `auth-rate-limit`.

### 주요 변경 사항

- [x] `@repo/backend-auth-password` 패키지 신규 (`packages/backend/auth-password`)
- [x] `hashPassword(plain, opts?)` — argon2id PHC string 발급
- [x] `verifyPassword(plain, hash)` — boolean 반환 + malformed throw 분리
- [x] `needsRehash(hash, opts?)` — 정책 변경 시 옛 hash 식별
- [x] `HashOptions` + `DEFAULT_OPTIONS` — OWASP 2023 minimum (m=19456 / t=2 / p=1 / hashLen=32)
- [x] `argon2 ^0.44.0` 카탈로그 등록 + `allowBuilds.argon2: true`
- [x] AppError 카탈로그: `PASSWORD_EMPTY` (400) / `PASSWORD_HASH_MALFORMED` (500)
- [x] 단위 테스트 13/13 PASS (4 files)

### Phase 컨텍스트

- **Phase**: `phase-05` (Auth Core + Security)
- **본 SPEC 의 역할**: signup/signin 의 *password 보관/검증* 기초 박음. spec-05-05 (`auth-rate-limit`) 와 함께 ADR-0014 의 *Security baseline* 의 절반. spec-05-06 (password-reset endpoint) 가 본 함수 직접 import.

## 🎯 Key Review Points

1. **`verifyPassword` 반환 boolean** (walkthrough §3-3): spec-05-03 의 `verifyAccessToken` 은 Result 반환하지만 본 spec 의 verify 는 boolean. 실패 분기 1 종 (wrong password) — Result ceremony 가치 약함. *책임 분리*: wrong password = false, malformed hash = throw.
2. **OWASP 2023 default cost** (walkthrough §3-2): m=19MiB / t=2 / p=1 — *minimum*. 환경별 강화는 `hashPassword(plain, opts)` override. `needsRehash` 가 옛 hash 자동 식별.
3. **argon2 라이브러리 native build** (walkthrough §3-5, §4-4): `pnpm-workspace.yaml` 의 `allowBuilds.argon2: true` + 본 로컬 prebuild 성공. Docker / CI verify 는 phase-10 ops.
4. **argon2 v0.44 API 차이** (walkthrough §8): `hash` / `needsRehash` 옵션 타입 비대칭 — `type` 옵션 분리. plan 작성 시 모름, Green 단계 typecheck 로 감지.
5. **Task 2 단일 commit** (walkthrough §3-7): options 는 pure data — TDD ceremony 가치 약함. Red/Green 분리 안 함.

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter @repo/backend-auth-password test
```

**결과 요약**:
- ✅ `options.test.ts` (2 tests)
- ✅ `hash.test.ts` (4 tests)
- ✅ `verify.test.ts` (4 tests)
- ✅ `rehash.test.ts` (3 tests)

**총 13/13 PASS** (~250ms).

### 정적 분석

```bash
pnpm --filter @repo/backend-auth-password lint     # biome — 12 files clean
pnpm typecheck                                      # turbo — 29 packages PASS
npx depcruise --config packages/config/depcruise-config/base.cjs packages apps
# ✔ no dependency violations found (167 modules, 260 dependencies cruised)
```

### 통합 테스트

Integration Test Required = **no** (pure crypto).

### 수동 검증 시나리오

1. **PHC string shape**: `hashPassword("secret")` → `$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>` 패턴 매치.
2. **Round-trip**: `verifyPassword(plain, hash)` = true.
3. **Wrong password**: `verifyPassword("wrong", hash)` = false (no throw).
4. **Cost override**: `hashPassword("x", {memoryCost: 8192})` 의 PHC 안 `m=8192` 확인.
5. **needsRehash**: 옛 cost (m=4096) hash → true; 현 cost (m=19456) hash → false.
6. **Malformed hash**: `verifyPassword("x", "not-a-phc-string")` → throw `AppError(PASSWORD_HASH_MALFORMED)`.

## 📦 Files Changed

### 🆕 New Files

- `packages/backend/auth-password/package.json`: 신규 패키지 메타
- `packages/backend/auth-password/tsconfig.json` / `vitest.config.ts`: 표준 extends
- `packages/backend/auth-password/README.md`: 사용 예제 + 설계 결정 + Cost Parameter 정공법 (미래)
- `packages/backend/auth-password/src/index.ts`: barrel re-export
- `packages/backend/auth-password/src/options.ts`: HashOptions + DEFAULT_OPTIONS + resolveOptions
- `packages/backend/auth-password/src/hash.ts`: hashPassword (argon2id + cost merge + 빈 input throw)
- `packages/backend/auth-password/src/verify.ts`: verifyPassword (boolean + malformed throw)
- `packages/backend/auth-password/src/rehash.ts`: needsRehash (argon2 native API wrapper)
- `packages/backend/auth-password/src/*.test.ts`: 4 test files, 13 cases
- `specs/spec-05-04-auth-password/{spec,plan,task,walkthrough}.md`: SDD 산출물

### 🛠 Modified Files

- `pnpm-workspace.yaml` (+2): `argon2: ^0.44.0` catalog + `allowBuilds.argon2: true`
- `pnpm-lock.yaml` (+78): argon2 + 6 sub-deps
- `backlog/phase-05.md` (+1): sdd marker spec 표 갱신
- `backlog/queue.md` (+1, -1): active spec 갱신

**Total**: 20 files changed (+890 / -1)

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (13/13)
- [x] Integration Test Required = no — 해당 없음
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / typecheck / depcruise 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- **Phase**: `backlog/phase-05.md`
- **Walkthrough**: `specs/spec-05-04-auth-password/walkthrough.md`
- **관련 ADR**:
  - `docs/adr/0014-auth-security-baseline.md` (argon2 항목 구현)
  - `docs/adr/0012-auth-error-normalize.md` (AppError 카탈로그 패턴)
- **선행 spec**: spec-05-03 (`@repo/backend-auth-jwt`) — 본 spec 과 *signin/signup flow* 의 두 축
- **후속 spec**: spec-05-05 (`auth-rate-limit`) / spec-05-06 (`password-reset-flow` — 본 함수 직접 import)
- **PR target**: `phase-05-auth-core-security`
