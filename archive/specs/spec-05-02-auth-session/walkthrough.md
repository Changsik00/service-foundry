# Walkthrough: spec-05-02 auth-session

## 1. 본 spec 의 목표

`@repo/backend-auth-session` — *framework-agnostic* refresh token 기반 session 관리.

- Drizzle Session schema + migration (`drizzle/0000_funny_jane_foster.sql`)
- Token primitives (256-bit base64url + SHA-256 hex hash, ADR-0014)
- 3 함수 (`createSession` / `rotateSession` / `revokeSession`)
- Refresh token rotation chain (`refreshTokenFamily`) + reuse detection (ADR-0013)
- Repository 패턴 (`SessionStore` interface) — domain 은 ORM 모름

## 2. 코드 투어 (호출자 관점)

### 2-1. signin (session 최초 생성)

```ts
import { createDatabase } from "@repo/backend-database";
import { createSession, drizzleSessionStore, schema } from "@repo/backend-auth-session";

const { db } = createDatabase({ connectionUrl, schema });
const store = drizzleSessionStore(db);

const { session, refreshToken } = await createSession(store, { userId });
// → client 에 refreshToken 발급 (cookie 등). DB 에는 hash 만 저장.
```

### 2-2. refresh (token rotation)

```ts
import { rotateSession } from "@repo/backend-auth-session";
import { match } from "ts-pattern";

const result = await rotateSession(store, presentedToken);

match(result)
  .with({ type: "rotated" }, ({ refreshToken: newToken }) => {
    // 정상 — 새 token client 에 발급
  })
  .with({ type: "reuse_detected" }, ({ revokedCount }) => {
    // 보안 사고 — family 전체 revoke됨, 사용자 강제 재인증
    logger.warn({ revokedCount }, "refresh token reuse detected");
  })
  .with({ type: "not_found" }, () => {
    // unknown token — 401
  })
  .exhaustive();
```

### 2-3. signout (명시 revoke)

```ts
import { revokeSession } from "@repo/backend-auth-session";

await revokeSession(store, sessionId);
```

## 3. 핵심 설계 결정

### 3-1. Repository 패턴 (`SessionStore` interface)

도메인 함수 (`createSession` 등) 는 *interface 만 의존* — drizzle/redis/in-memory 어느 것이든 같은 interface 구현 만 박으면 동작.

- *unit test*: `createFakeStore()` (Map 기반) — drizzle 없이 코드 path 검증.
- *production*: `drizzleSessionStore(db)` — 4 method 모두 drizzle 호출 (thin adapter).
- 미래 *Redis* / *jti deny list* 등 추가 시 같은 interface 구현 박음.

phase-03 spec-03-05 의 `@repo/backend-database` docstring 가이드 답습 — *application/domain layer 가 ORM 모름*.

### 3-2. Refresh token *hash 저장* (ADR-0014)

- `crypto.randomBytes(32).toString("base64url")` — 256-bit entropy, URL-safe.
- DB 에는 `SHA-256 hex` 저장 — 같은 token 은 항상 같은 hash (deterministic) → 검증 가능.
- DB 유출 시 raw token *plaintext 미노출*.
- 검증 시 `hashToken(presented)` 박은 후 비교.

### 3-3. Rotation 4 분기 (ADR-0013)

- `refreshTokenFamily` UUID — *같은 chain 의 모든 session* 이 공유.
- `createSession` → family 신규 발행 (root).
- `rotateSession` 의 4 분기:
  - **not_found** — unknown token
  - **reuse_detected** — revoked token 재제시 → **family 전체 revoke**
  - **expired** — `expiresAt < now` → 거부만 (revoke 박지 않음)
  - **rotated** — active 정상 → 기존 revoke + 새 token (같은 family)
- 보안 의도: attacker 가 훔친 token 으로 rotate 박은 후 *원본 사용자* 가 본 token 다시 시도하면 둘 다 revoke → 둘 다 강제 재인증.

### 3-4. minimal 구현 — 정공법은 별도 (README 참조)

본 spec 은 *rotation 의 최소 표준* — 정공법 (absolute timeout / inactivity timeout / device fingerprint / rate limit / concurrent guard / user-wide revoke / audit log / sliding-vs-fixed TTL) 은 README.md 의 *Rotation 정공법 (미래 검토)* 절에 박힘. 후속 spec / phase 에서 처리. 멀티 디바이스는 *family UUID 자연 격리* 로 본 minimal 에서도 *디바이스별 보안 격리* 처리됨.

### 3-4. fake store 패턴 (drizzle mock 대신)

drizzle 의 fluent API (`db.select().from().where()`) 를 *vi.mock* 박는 건 *체인 복잡* + *brittle*. 대신 `SessionStore` interface 만 의존 → `createFakeStore()` (Map 기반) 박으면 *코드 path* 100% 검증 가능.

실 drizzle 동작은 *수동 PG 검증* (Docker postgres:16 + db:migrate + round-trip) 으로 별 검증 — phase-03 이연 해소.

## 4. 실 PG 검증 결과

서브에이전트 자동 검증 (전 단계 PASS):
- PG ready, db:migrate 적용
- `\d sessions` — 7 column 의도와 100% 일치 (id uuid PK / user_id uuid / refresh_token_hash text unique / refresh_token_family uuid / created_at timestamptz / expires_at timestamptz / revoked_at timestamptz null)
- round-trip — insert / unique violation / delete 모두 정상
- cleanup — `auth-pg` stop+rm 완료

## 5. 본 spec 의 *scope 밖*

- NestJS adapter → phase-06 (`@repo/nestjs-auth-session`)
- User 테이블 → 별 spec (apps/api 가 자체 정의)
- multi-device tracking (userAgent / ipAddress) → 별 spec
- Redis storage / jti deny list → 별 spec
- 자동 expired session cleanup (cron) → 별 spec
- testcontainers integration test → phase-10

## 6. 검증 결과

- lint ✓ / typecheck ✓ / test 12/12 ✓ / depcruise ✓ (143 modules / 211 deps, violations 0)
- 실 PG migration ✓ (Docker 자동 검증)
