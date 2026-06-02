# feat(spec-05-05): @repo/backend-auth-rate-limit — rate-limit + lockout + CSRF

## 📋 Summary

### 배경 및 목적

phase-05 의 *abuse 방어 baseline*. signin endpoint (spec-05-06) 진입 전 brute-force / credential stuffing / CSRF 방어 박음. ADR-0014 Security baseline 의 3 영역 (rate-limit / lockout / CSRF) 응집.

원안 `auth-security` 4 영역 중 argon2 만 spec-05-04 (`auth-password`) 분리, 나머지 3 영역 본 spec.

### 주요 변경 사항

- [x] `@repo/backend-auth-rate-limit` 패키지 신규
- [x] Drizzle schema: `failed_logins` (id/ip/account_key/attempted_at + 2 index) + `lockouts` (account_key PK/locked_at/unlock_at/streak)
- [x] `RateLimitStore` interface (Repository 패턴) + fake (Map) + Drizzle adapter
- [x] **Rate limit**: `checkRateLimit` / `recordFailure` / `recordSuccess` — sliding window via DB COUNT (per-IP 30/5min + per-account 5/5min)
- [x] **Lockout**: `isLocked` / `evaluateLockout` + progressive backoff (5회 fail → 15min → ×2 cap 24h)
- [x] **CSRF**: `issueCsrfToken` / `verifyCsrfToken` — HMAC-SHA256 deterministic, session 동반
- [x] 단위 테스트 18/18 PASS (4 files)
- [x] 실 PG migration 검증 (Docker postgres:16, port 5433)

### Phase 컨텍스트

- **Phase**: `phase-05` (Auth Core + Security)
- **본 SPEC 의 역할**: signin endpoint 의 abuse 방어 3 영역. spec-05-04 (argon2) 와 함께 ADR-0014 Security baseline 완성. spec-05-06 (password-reset endpoint) 이 본 함수 직접 import.

## 🎯 Key Review Points

1. **3 영역 한 spec 묶음** (walkthrough §3-1): 사용자 협의 옵션 A — abuse 방어 baseline 응집. signin endpoint 가 셋 다 호출 → ceremony 통합 자연.
2. **Sliding window — DB COUNT** (walkthrough §3-2): 정확 + 단순. Redis cache 는 phase-10. 인덱스 (`failed_logins_ip_at_idx`, `failed_logins_account_at_idx`) 박아 P99 보장.
3. **Lockout — read 시점 자동 unlock** (walkthrough §3-3): cron 불요. `unlock_at > now` 만으로 판정. streak 보존 → progressive backoff base.
4. **CSRF — HMAC deterministic + session 동반** (walkthrough §3-5): double-submit cookie + HMAC-SHA256(sessionId). stateless + session revoke = CSRF 자연 invalidate.
5. **Enumeration-safe — 호출자 책임** (walkthrough §3-6): 본 spec 은 user 존재 무관 카운터 제공. endpoint 가 응답 형식 통일 책임. README §사용 예제 의 `enumerationSafeReject` 패턴 참조.
6. **TDD 단일 commit 정책** (walkthrough §3-8): Task 5/6/7 모두 *함수 + 테스트 묶음*. spec-05-04 options 답습. interface contract 강한 spec-05-03 와 다른 정책.
7. **실 PG 검증** (walkthrough §4-4): Docker postgres:16 → migration → schema 확인 → round-trip → cleanup. spec-05-02 패턴 답습.

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter @repo/backend-auth-rate-limit test
```

**결과**:
- ✅ `store.test.ts` (3 tests) — fake store contract
- ✅ `rate-limit.test.ts` (5 tests) — IP / account / 합산 / window slide / reset
- ✅ `lockout.test.ts` (5 tests) — locked / auto-unlock / progressive / reset / no-row
- ✅ `csrf.test.ts` (5 tests) — round-trip / deterministic / wrong session / tamper / empty

**총 18/18 PASS** (~130ms).

### 정적 분석

```bash
pnpm --filter @repo/backend-auth-rate-limit lint     # biome — 18 files clean
pnpm typecheck                                        # turbo — 30 packages PASS
npx depcruise --config packages/config/depcruise-config/base.cjs packages apps
# ✔ no dependency violations found (181 modules, 288 dependencies cruised)
```

### 통합 테스트 (Integration Test Required = yes)

Docker postgres:16 + migration + round-trip — `auth-session` 패턴 답습. walkthrough §4-4 에 상세 로그.

### 수동 검증 시나리오

1. **Rate limit account**: 동일 email 5회 fail → 6째 `allowed: false, reason: rate_limited, retryAfterMs > 0`.
2. **Rate limit IP**: 30회 fail (다른 account) → 31째 `allowed: false`.
3. **Lockout**: 5회 fail + `evaluateLockout` → `{lockedUntil, streak: 1}`. `isLocked` = `{locked: true}`.
4. **Auto-unlock**: 15분 후 `isLocked` = `{locked: false}` (row 보존, streak 1 유지).
5. **Progressive**: cooldown 만료 후 또 5회 fail → 두 번째 lockout 의 cooldown = 30분 (base × 2).
6. **Lockout reset**: `recordSuccess` → `failed_logins` (account 한정) + `lockouts` row 둘 다 삭제.
7. **CSRF round-trip**: `issueCsrfToken(secret, sessionId)` → `verifyCsrfToken(secret, sessionId, token)` = true.
8. **CSRF wrong session**: `verifyCsrfToken(secret, "other-session", token)` = false.
9. **CSRF tamper**: 1 byte 변조 → false.
10. **실 PG**: migration 적용 / `\d` 확인 / round-trip / cleanup 모두 통과.

## 📦 Files Changed

### 🆕 New Files

- `packages/backend/auth-rate-limit/package.json` / `tsconfig.json` / `vitest.config.ts` / `drizzle.config.ts`
- `packages/backend/auth-rate-limit/README.md`: 사용 예제 + 설계 결정 + Rate Limit 정공법 (미래)
- `packages/backend/auth-rate-limit/src/schema.ts`: Drizzle 테이블 (failed_logins / lockouts) + types
- `packages/backend/auth-rate-limit/src/store.ts`: `RateLimitStore` interface (7 method)
- `packages/backend/auth-rate-limit/src/fake-store.ts`: Map 기반 fake
- `packages/backend/auth-rate-limit/src/drizzle-store.ts`: Drizzle thin adapter
- `packages/backend/auth-rate-limit/src/rate-limit.ts`: checkRateLimit / recordFailure / recordSuccess + RATE_LIMIT_DEFAULTS
- `packages/backend/auth-rate-limit/src/lockout.ts`: isLocked / evaluateLockout + LOCKOUT_DEFAULTS
- `packages/backend/auth-rate-limit/src/csrf.ts`: issueCsrfToken / verifyCsrfToken (HMAC-SHA256)
- `packages/backend/auth-rate-limit/src/index.ts`: barrel re-export
- `packages/backend/auth-rate-limit/src/*.test.ts`: 4 test files, 18 cases
- `packages/backend/auth-rate-limit/drizzle/0000_same_harry_osborn.sql`: migration
- `specs/spec-05-05-auth-rate-limit/{spec,plan,task,walkthrough}.md`: SDD 산출물

### 🛠 Modified Files

- `pnpm-lock.yaml`: pg / drizzle-kit 등 dev deps
- `backlog/phase-05.md` (+1): sdd marker spec 표 갱신
- `backlog/queue.md` (+1, -1): active spec 갱신

**Total**: 26 files changed (+1,993 / -1)

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (18/18)
- [x] Integration Test (실 PG) PASS
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / typecheck / depcruise 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- **Phase**: `backlog/phase-05.md`
- **Walkthrough**: `specs/spec-05-05-auth-rate-limit/walkthrough.md`
- **관련 ADR**:
  - `docs/adr/0014-auth-security-baseline.md` (CSRF / Rate limit / argon2 / Step-up — 본 spec 은 *argon2 외 3 영역*)
- **선행 spec**: spec-05-02 (`auth-session`), spec-05-04 (`auth-password`)
- **후속 spec**: spec-05-06 (`password-reset-flow` — 본 함수 직접 import + CSRF cookie 발급)
- **PR target**: `phase-05-auth-core-security`
