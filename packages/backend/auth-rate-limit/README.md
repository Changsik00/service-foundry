# @repo/backend-auth-rate-limit

rate-limit + lockout + CSRF token (ADR-0014 Security baseline) — *framework-agnostic core*.

`auth-session` 의 Repository 패턴 답습 (`SessionStore` → `RateLimitStore`). middleware mount (NestJS Throttler 어댑터 등) 는 phase-06.

## 부트 가이드 (수동 검증)

```bash
# 1. 로컬 PostgreSQL (Docker, 5433 포트 — auth-session 의 5432 와 분리)
docker run -d --name auth-rl-pg \
  -e POSTGRES_PASSWORD=local \
  -e POSTGRES_DB=service_foundry_dev \
  -p 5433:5432 \
  postgres:16

# 2. migration
DATABASE_URL=postgres://postgres:local@localhost:5433/service_foundry_dev \
  pnpm --filter @repo/backend-auth-rate-limit db:migrate

# 3. schema 확인
docker exec auth-rl-pg psql -U postgres -d service_foundry_dev -c "\d failed_logins"
docker exec auth-rl-pg psql -U postgres -d service_foundry_dev -c "\d lockouts"

# 4. cleanup
docker stop auth-rl-pg && docker rm auth-rl-pg
```

## API

### Signin flow (rate-limit + lockout 합성)

```ts
import {
  createFakeRateLimitStore,
  drizzleRateLimitStore,
  checkRateLimit,
  recordFailure,
  recordSuccess,
  isLocked,
  evaluateLockout,
} from "@repo/backend-auth-rate-limit";

const store = drizzleRateLimitStore(db);

// apps/api 의 POST /auth/signin
const lockout = await isLocked(store, email);
if (lockout.locked) {
  // 응답은 enumeration-safe (rate-limited 와 동일 형식, user 존재 노출 안 함)
  return { status: 429, retryAfter: lockout.until.getTime() - Date.now() };
}

const decision = await checkRateLimit(store, { ip: req.ip, accountKey: email });
if (!decision.allowed) {
  return { status: 429, retryAfter: decision.retryAfterMs };
}

const user = await userRepo.findByEmail(email);
if (!user || !(await verifyPassword(password, user.passwordHash))) {
  await recordFailure(store, { ip: req.ip, accountKey: email });
  const lockNow = await evaluateLockout(store, { accountKey: email });
  // lockNow !== null 이면 본 시도가 lockout 발급 트리거
  return { status: 401 }; // user 존재 노출 안 함
}

// 성공
await recordSuccess(store, email);
// session 발급 (auth-session) + access token (auth-jwt)
```

### CSRF token (double-submit cookie)

```ts
import { issueCsrfToken, verifyCsrfToken } from "@repo/backend-auth-rate-limit";

// signin 성공 시
const csrfToken = issueCsrfToken(process.env.AUTH_CSRF_SECRET!, session.id);
res.cookie("csrf", csrfToken, { httpOnly: false, sameSite: "lax" });
res.json({ access, refresh, csrf: csrfToken });

// 상태 변경 endpoint 에서
const presented = req.header("X-Csrf-Token");
if (!verifyCsrfToken(process.env.AUTH_CSRF_SECRET!, session.id, presented ?? "")) {
  return { status: 403, error: "CSRF token invalid" };
}
```

## 핵심 설계 결정

| 항목 | 채택 | 이유 |
|---|---|---|
| **Sliding window** | DB COUNT (`failed_logins` 테이블) | 정확 + 단순. Redis cache 는 phase-10. |
| **Rate limit 기본** | per-IP 30 req / 5분, per-account 5 req / 5분 — *둘 중 하나라도* 초과 → block | OWASP 권장. IP + account 합산이 credential stuffing 효과적. |
| **Lockout** | DB row (PK accountKey) — `unlock_at > now` 면 잠금 | 만료 자동 unlock (read 시점 평가). cron 불요. |
| **Progressive backoff** | streak ++ → cooldown ×2 (max 24h) | OWASP brute-force 점진 차단. |
| **CSRF token** | HMAC-SHA256 (sessionId + secret) → base64url 32 byte | stateless deterministic. session 동반 = revoke 자연 invalidate. |
| **CSRF 반환** | `verifyCsrfToken` → boolean | 실패 분기 *모두 reject 자연* — jwt verify 의 Result 정책과 다름 (jwt 는 분기 다양). |
| **Result vs struct** | rate-limit / lockout 은 *struct* (`{allowed, retryAfterMs, reason}`), CSRF 는 boolean | *분기 다양성* 따라. auth-jwt / auth-password 와 일관 (verify 정책 *함수별 자연 선택*). |
| **enumeration-safe** | 응답 형식 강제 X — 호출자 책임 | 본 spec 의 `allowed: false` 는 user 존재 무관 (IP+account key 카운터만). endpoint 가 *동일 형식* 응답 박는 책임. |
| **Store** | Repository 패턴 — `RateLimitStore` interface + Drizzle / fake | `auth-session` 답습. domain 은 DB 모름. |

## Rate Limit 정공법 (미래 검토 — *지금은 minimal*)

본 spec 의 default 는 *signin endpoint* 기준 OWASP 권장 minimum. *full 정공법* 은 다음 영역.

### 본 spec 에 *박힘* (minimal)

| 항목 | 동작 |
|---|---|
| per-IP / per-account sliding window | DB COUNT, 5분 window |
| account lockout state machine | 5회 fail → 15분 → progressive ×2 |
| CSRF double-submit + HMAC | session 동반 deterministic token |
| Repository 패턴 | fake (test) + Drizzle (prod) swap 자연 |
| 실 PG 검증 | migration + round-trip 통과 |

### 본 spec 에 *없음* (미래 검토)

| 항목 | 의미 | 박는 시점 후보 |
|---|---|---|
| **Distributed counter** | multi-instance 시 합산 카운트 (instance 별 DB 부담 분산) | phase-10 — Redis cluster |
| **Token bucket** | sliding window 대신 burst-friendly | 별 spec — endpoint 특성 따라 |
| **Captcha 통합** | N회 fail 후 challenge 추가 | 별 spec |
| **Device fingerprint risk score** | UA / accept-language / screen 등 결합 — 의심 IP 만 강한 limit | 별 spec |
| **GeoIP impossible travel** | session 의 last-seen IP geo 와 비교 → 강제 step-up | 별 spec (auth-session 의 `geo` 컬럼 활용) |
| **Audit log** | 모든 rate-limit / lockout / CSRF reject 이벤트 영구 기록 | phase-10 observability |
| **CSRF SameSite=Strict cookie** | double-submit 외 cookie 자체 보안 강화 | endpoint level (apps/api 미들웨어) |
| **CSRF origin / referer 검증** | header 추가 검증 — *cross-origin reject* | endpoint level |
| **Lockout 이메일 알림** | "your account was locked" 자동 알림 | spec-05-07 email-verify-flow 후 자연 |
| **자동 cleanup** | 오래된 failed_logins / 만료 lockouts 삭제 cron | phase-10 ops cron |
| **Concurrent rotation guard** | DB advisory lock | 별 spec — race 발생 빈도 보고 결정 |

**현재 정책 요약**: minimal — DB COUNT sliding window + DB row lockout + HMAC CSRF. 멀티 인스턴스 / 캐싱 / advanced threat 은 후속.

## 본 패키지 scope 밖 (별 spec / phase)

- **NestJS middleware adapter** (Guard / Interceptor / @Throttle decorator) → phase-06 (`@repo/nestjs-auth-rate-limit`)
- **Redis storage** → phase-10
- **CSRF cookie 발급 자체** (Set-Cookie header) → endpoint spec-05-06 (본 spec 은 token primitives 만)
- **Captcha / device fingerprint / GeoIP** → README §"정공법" 참조

## 의존성

- `@repo/backend-database` — Drizzle DB 타입.
- `@repo/errors` — AppError (현 spec 은 *직접 throw 없음* — 호출자가 decision 받아 자체 응답).
- `drizzle-orm` — Drizzle ORM.
- Node `crypto` (HMAC-SHA256 + timingSafeEqual).
