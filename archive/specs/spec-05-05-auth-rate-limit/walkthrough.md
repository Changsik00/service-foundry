# Walkthrough: spec-05-05 auth-rate-limit

## 1. 본 spec 의 목표

`@repo/backend-auth-rate-limit` — *framework-agnostic core* abuse 방어 (ADR-0014 Security baseline 의 절반).

- **Rate limit**: per-IP / per-account sliding window via DB COUNT.
- **Lockout state machine**: N회 fail → locked → cooldown → 자동 unlock (progressive backoff).
- **CSRF token**: HMAC-SHA256 double-submit, session 동반.
- Drizzle schema: `failed_logins` + `lockouts` 테이블 + migration.
- Repository 패턴 (`auth-session` 답습) — fake (test) + Drizzle (prod).

원안 `auth-security` 4 영역 중 *argon2 외 3 영역* — argon2 는 spec-05-04 (`auth-password`).

## 2. 코드 투어

### 2-1. signin endpoint (rate-limit + lockout 합성)

```ts
import {
  checkRateLimit, recordFailure, recordSuccess,
  isLocked, evaluateLockout,
  drizzleRateLimitStore,
} from "@repo/backend-auth-rate-limit";

const store = drizzleRateLimitStore(db);

// POST /auth/signin
const lockout = await isLocked(store, email);
if (lockout.locked) {
  return enumerationSafeReject({ retryAfter: lockout.until.getTime() - Date.now() });
}

const decision = await checkRateLimit(store, { ip: req.ip, accountKey: email });
if (!decision.allowed) {
  return enumerationSafeReject({ retryAfter: decision.retryAfterMs });
}

const user = await userRepo.findByEmail(email);
const passwordOk = user && await verifyPassword(password, user.passwordHash);
if (!passwordOk) {
  await recordFailure(store, { ip: req.ip, accountKey: email });
  await evaluateLockout(store, { accountKey: email });
  return enumerationSafeReject();
}

await recordSuccess(store, email);
// session 발급 (auth-session) + access token (auth-jwt) + CSRF token
```

### 2-2. CSRF (double-submit cookie)

```ts
import { issueCsrfToken, verifyCsrfToken } from "@repo/backend-auth-rate-limit";

// signin 성공 시
const csrfToken = issueCsrfToken(env.AUTH_CSRF_SECRET, session.id);
res.cookie("csrf", csrfToken, { sameSite: "lax" });
res.json({ access, refresh, csrf: csrfToken });

// 상태 변경 endpoint
if (!verifyCsrfToken(env.AUTH_CSRF_SECRET, session.id, req.header("X-Csrf-Token") ?? "")) {
  return { status: 403 };
}
```

## 3. 핵심 설계 결정

### 3-1. 3 영역 묶음 — *abuse 방어 baseline* 응집

원안 `auth-security` 4 영역 (argon2 / CSRF / rate-limit / lockout) 중 argon2 만 *완전 pure crypto* 라 spec-05-04 분리. 남은 3 영역은 *모두 abuse 방어* + *호출 흐름 응집* (signin endpoint 가 셋 다 호출).

대안: 3 분할 (rate-limit / lockout / CSRF) — rate-limit + lockout 은 *DB 공유* (failed_logins / lockouts) 라 분할 시 ceremony 과다. CSRF 는 독립적이지만 *signin 응답 박는 시점* 에 동반 자연 → 한 spec 자연.

### 3-2. Sliding window — DB COUNT (Redis 보류)

Sliding window 의 정확한 구현은 *각 attempt 의 timestamp 기록 후 since 이후 count*. DB COUNT 가 정확 + 단순. high-traffic 영향은 Redis cache (phase-10).

trade-off:
- 정확성: ✓ — Redis approximate-counter 대비 정확.
- 성능: 매 request DB query. 인덱스 (`failed_logins_ip_at_idx`, `failed_logins_account_at_idx`) 박아 P99 < 5ms 보장 가정.
- 확장성: 단일 인스턴스 한정 효과적. 다중 인스턴스는 DB 가 carrier 역할.

### 3-3. Lockout — DB row + `unlock_at > now` 평가

cron 불요 — read 시점에 *자동 unlock* 판단. lockout row 는 *보존* (streak 유지) — 다음 lockout 시 progressive backoff base.

state diagram:
```
[no row]  --N회 fail-->  [row { unlock_at = +15min, streak=1 }]
   ^                              |
   |                              +-- now >= unlock_at --> [unlocked (row 보존)]
   |                                                              |
   +-- recordSuccess (row 삭제) <--+                              +-- N회 또 fail
                                                                  v
                                                          [row { unlock_at = +30min, streak=2 }]
```

### 3-4. Progressive backoff — `cooldown = base × 2^(streak-1)` cap by max

OWASP 권장. brute-force *점진 차단*:
- 1번째 lockout: 15분
- 2번째: 30분
- 3번째: 1h
- ... 24h 상한

streak 은 *recordSuccess 시 row 삭제* — 합법 로그인 1회로 전체 reset.

### 3-5. CSRF — HMAC-SHA256 deterministic + session 동반

double-submit cookie 패턴: cookie 의 token + header 의 token *둘 다 일치* + HMAC 검증 통과 시 허용.

- **Deterministic**: 같은 sessionId + secret → 같은 token. cookie 갱신 / 다중 tab 자연.
- **Session 동반**: session revoke = CSRF invalidate (별 storage 불요).
- **Stateless**: server 측 token store 없음 — HMAC 만으로 검증.

대안 비교:
| 패턴 | 채택 | 사유 |
|---|---|---|
| Synchronizer token (server-side store) | ❌ | storage 추가, session 동반 효과 약함 |
| Encrypted token | ❌ | overkill — HMAC 만으로 충분 (token 내용은 sessionId 만) |
| Custom Origin / Referer 검증 | ❌ | middleware 책임 (apps/api), 본 spec 범위 밖 |
| **Double-submit + HMAC** | ✅ | stateless + session 동반 + 검증 단순 |

### 3-6. enumeration-safe — *호출자 책임*, 본 spec 은 카운터 자체 user 존재 무관

본 spec 의 `checkRateLimit` / `recordFailure` 는 *user 존재 여부 모름* — IP + account key (= email string) 카운터만. 즉 *존재하지 않는 email* 로 시도해도 동일 카운터 증가.

호출자 (endpoint) 책임:
- 응답 형식 통일 (401 / 429 / locked 모두 동일 body 구조).
- 메시지 통일 ("Invalid credentials or too many attempts" 류).

이게 *진정한 enumeration-safe* — 본 spec 은 *수단* 제공.

### 3-7. Repository 패턴 — `auth-session` 답습

`RateLimitStore` interface 7 method (countByIp / countByAccount / insertFailure / resetAccount / findLockout / upsertLockout / deleteLockout). fake (Map) + Drizzle 둘 다 박음. 도메인 함수는 *interface 만 의존*.

phase-10 의 `RedisRateLimitStore` 도 *같은 interface 구현* 으로 swap.

### 3-8. 도메인 함수 TDD — 단일 commit 으로 묶음

Task 5 (rate-limit) / 6 (lockout) / 7 (CSRF) 모두 *함수 구현 + 테스트* 묶음 commit. spec-05-03 의 *Red commit (stub) → Green commit* 패턴은 *interface contract* 가 강한 경우만 가치 있음.

본 spec 의 함수들은 *store interface* 의 thin wrapper — stub commit 의 의미 약함. test 자체가 *구현 동작 검증* 이라 단일 commit 으로 박는 게 자연.

spec-05-04 의 options.ts 와 같은 정책.

### 3-9. Store 의 `verifyPassword` 반환 정책 일관

| 함수 | 반환 | 사유 |
|---|---|---|
| `checkRateLimit` | `{allowed, retryAfterMs, reason}` struct | 실패 분기 1 종이지만 *retryAfter* 정보 동반 → struct 자연 |
| `isLocked` | `{locked, until?, streak?}` struct | 잠금 여부 + meta |
| `evaluateLockout` | `{lockedUntil, streak} \| null` | 본 시도가 lockout 발급 여부 — null = 발급 안 함 |
| `verifyCsrfToken` | boolean | reject 만 — meta 필요 없음 |
| `recordFailure` / `recordSuccess` | void | side-effect only |

auth-jwt / auth-password 의 *함수별 자연 정책* 답습.

## 4. 검증 결과

### 4-1. 단위 테스트

```bash
pnpm --filter @repo/backend-auth-rate-limit test
```

- ✅ `store.test.ts` (3 tests) — fake store contract
- ✅ `rate-limit.test.ts` (5 tests) — IP / account / 합산 / window slide / reset
- ✅ `lockout.test.ts` (5 tests) — locked / auto-unlock / progressive / reset / no-row
- ✅ `csrf.test.ts` (5 tests) — round-trip / deterministic / wrong session / tamper / empty

**총 18/18 PASS** (~130ms).

### 4-2. 정적 분석

```bash
pnpm --filter @repo/backend-auth-rate-limit lint     # biome — 18 files clean
pnpm typecheck                                        # turbo — 30 packages PASS
```

### 4-3. depcruise

```bash
npx depcruise --config packages/config/depcruise-config/base.cjs packages apps
# ✔ no dependency violations found (181 modules, 288 dependencies cruised)
```

### 4-4. 실 PG 검증 (Integration Test)

`auth-session` 패턴 답습 — Docker postgres:16 (port 5433, auth-session 의 5432 와 분리):

```bash
docker run -d --name auth-rl-pg \
  -e POSTGRES_PASSWORD=local -e POSTGRES_DB=service_foundry_dev \
  -p 5433:5432 postgres:16

DATABASE_URL=postgres://postgres:local@localhost:5433/service_foundry_dev \
  pnpm --filter @repo/backend-auth-rate-limit db:migrate
```

**결과**:
- ✅ migration 적용 성공 (`[✓] migrations applied successfully!`)
- ✅ `\d failed_logins` — 4 column (id uuid PK, ip text, account_key text, attempted_at timestamptz) + 3 index (PK + ip+at + account+at) 의도와 100% 일치
- ✅ `\d lockouts` — 4 column (account_key PK, locked_at, unlock_at, streak default 1) + PK index
- ✅ round-trip:
  ```
  INSERT failed_logins (2 rows) → count = 2
  INSERT lockouts (1 row) → unlock_at > now = true, streak = 1
  ```
- ✅ cleanup — Docker stop + rm 완료

## 5. 본 spec 의 *scope 밖*

- **NestJS middleware adapter** (Guard / Interceptor / @Throttle decorator) → phase-06
- **CSRF cookie 발급 자체** (Set-Cookie) → endpoint spec-05-06 (본 spec 은 token primitives 만)
- **Redis storage** → phase-10
- **Distributed counter / token bucket / captcha / GeoIP** → README §"Rate Limit 정공법" 참조
- **Lockout 이메일 알림** → spec-05-07 email-verify 후 자연
- **Concurrent rotation guard** (DB advisory lock) → race 발생 빈도 보고 후 별 spec

## 6. 결정 기록 (Decision Log)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 3 영역 분할 | 한 spec / 3 분할 | **한 spec** | 사용자 협의 — abuse 방어 baseline 응집. signin endpoint 가 셋 다 호출 → ceremony 통합 자연. |
| Rate limit window 구현 | DB COUNT / Redis cache | **DB COUNT** | 정확 + 단순. Redis 는 phase-10. 인덱스로 P99 보장 가정. |
| Lockout 자동 unlock | cron / read 시점 평가 | **read 시점 평가** | cron 불요 — `unlock_at > now` 만으로 판정. 운영 단순. |
| Progressive backoff | 고정 / ×2 / Fibonacci | **×2 (max 24h)** | OWASP 권장. 점진 차단 + 합법 user 영향 최소화 (성공 시 reset). |
| CSRF 패턴 | synchronizer / encrypted / double-submit + HMAC | **double-submit + HMAC** | session 동반 = revoke 자연 invalidate. stateless. token store 불요. |
| `verifyCsrfToken` 반환 | Result / boolean | **boolean** | 실패 분기 단일 (reject 만). meta 필요 없음. |
| 본 spec 의 enumeration-safe | 함수 측 강제 / 호출자 책임 | **호출자 책임** | 본 spec 은 *수단* 제공 — endpoint 가 응답 형식 통일. user 존재 무관 카운터는 이미 박힘. |
| Store 패턴 | new 직접 구성 / Repository | **Repository** | auth-session 답습. test 친화 + swap 자연. |
| Task 5/6/7 TDD 분리 | Red/Green / 단일 | **단일** | 함수 구현 + test 묶음 — interface contract 강한 spec-05-03 와 달리 *thin wrapper* 라 stub commit 가치 약함. spec-05-04 options 패턴 답습. |

## 7. 사용자 협의

- **주제**: spec-05-05 분할 — 한 spec vs 2/3 분할
  - **사용자 의견**: "옵션 A로 진행" — 한 spec (rate-limit + lockout + CSRF 묶음).
  - **합의**: 본 spec 한 PR.

- **주제**: rate-limit / lockout 정책 기본값 / CSRF 패턴
  - **사용자 의견**: Plan Accept (모든 검토 항목 OK)
  - **합의**: per-IP 30/5min, per-account 5/5min, lockout 5회/15min/×2 backoff, CSRF HMAC-SHA256 double-submit.

## 8. 발견 사항

- **DB COUNT vs Redis trade-off** — phase-10 진행 시 *어느 시점에 Redis 도입* 판단 기준 필요. throughput 측정 도구 (k6 / wrk) 결과 + P99 latency 결합. RCA 작성 후보 if 도입 의사결정 필요.
- **Drizzle index syntax** — `auth-session` 의 schema 에는 명시 인덱스 없었지만 본 spec 은 *고빈도 COUNT* 영역이라 index 필수. `drizzle-orm/pg-core` 의 `index().on()` 패턴 사용.
- **drizzle-kit auto-name migration** (`0000_same_harry_osborn.sql`) — Marvel character random naming. PR review 시 file name 이 *문맥 없음* — 향후 `--name` 명시 후보 (별 spec / 단발).
- **CSRF deterministic vs nonce 박힌 token** — deterministic 은 *같은 sessionId 로 항상 같은 token* — XSS 시점에 token 노출되면 *그 세션 동안 유효*. session rotate 강제로 mitigated 가능. 강화는 phase-10.

## 9. 이월 항목

- 없음 — README §"Rate Limit 정공법 (미래 검토)" 표가 후속 spec/phase 의 *기억 위치*.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-21 |
| **총 commit** | 10 (planning 1 + scaffold 1 + schema 1 + store 1 + drizzle adapter 1 + 도메인 3 + README 1 + ship 1) |
| **테스트** | 18/18 PASS (4 files) / 실 PG migration ✓ |
| **품질 게이트** | lint ✓ / typecheck ✓ / depcruise ✓ |
| **PR target** | `phase-05-auth-core-security` |
