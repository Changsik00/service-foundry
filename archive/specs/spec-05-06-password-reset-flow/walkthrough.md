# Walkthrough: spec-05-06 — Password Reset Flow

## 증거 로그

### 단위 테스트 (19 tests PASS)

```
✓ src/jwt/jwks.controller.test.ts (2 tests)
✓ src/auth/password-reset.service.test.ts (3 tests)
✓ src/auth/password-reset.confirm.service.test.ts (7 tests)
✓ src/auth/auth.e2e.test.ts (6 tests)
✓ src/health/health.e2e.test.ts (1 test)

Test Files  5 passed (5)
Tests       19 passed (19)
Duration    805ms
```

### Typecheck & Biome

```
turbo typecheck: 24 successful (23 cached)
biome check src/: Checked 20 files. No fixes applied.
```

### 커밋 목록

```
7b88d21 test(spec-05-06): E2E — password reset + JWKS round-trip (real PG)
646f34c feat(spec-05-06): password reset confirm — token verify + password update
52bed00 feat(spec-05-06): password reset request endpoint — always-200 + token generation
bd0e3f9 feat(spec-05-06): JWKS endpoint (GET /.well-known/jwks.json)
2e01758 feat(spec-05-06): apps/api schema — users + password_reset_tokens + drizzle config
```

---

## 설계 결정 기록

### 1. Enumeration-safe 응답 (항상 200)

`POST /auth/password/reset`과 `POST /auth/password/reset/confirm` 모두 성공/실패와 무관하게 `{ status: "ok" }` + HTTP 200을 반환한다. email 미존재나 token 무효 여부를 노출하면 공격자가 계정 존재 여부를 탐지할 수 있다.

### 2. Token 저장 방식: SHA-256 hash

원본 token은 URL로 전송되고 즉시 버려진다. DB에는 `hashToken(token)` (SHA-256, hex 인코딩)만 저장한다. auth-session의 패턴 (ADR-0014)을 그대로 따른다.

```ts
const token = generateRefreshToken();   // 43자 URL-safe random
const tokenHash = hashToken(token);     // SHA-256 hex
await this.tokenStore.insert({ userId: user.id, tokenHash, expiresAt });
```

### 3. Email 전송 stub: console.info

spec이 실제 이메일 전송을 out-of-scope로 명시했다. `console.info("[password-reset] token=... userId=...")` 로 토큰을 로그 출력해 개발 환경에서 테스트 가능하게 했다.

### 4. Local users 테이블

auth-session/auth-rate-limit과 달리 users 테이블은 apps/api에 local로 정의한다. 패키지로 추출하려면 sign-in/sign-up 등 전체 user 도메인이 안정화되어야 한다.

### 5. AppModule schema: LOCAL ONLY

`DatabaseModule.forRoot({ schema: appSchema })`의 `appSchema`는 `{ users, passwordResetTokens }`만 포함한다. auth-rate-limit/auth-session은 테이블 객체를 export하지 않으며, Drizzle 구현체 내에서 자체 테이블 참조를 사용한다.

### 6. Store 인터페이스 + biome-ignore 전략

NestJS parameter decorator (`@InjectUserStore()`)를 사용하려면 Biome의 `useImportType` 규칙을 우회해야 한다. 이를 위해 root `biome.json`에 `apps/api/src/**`에 대한 override를 추가했다 (nested root config 금지로 인해 apps/api/biome.json은 사용 불가).

### 7. Drizzle DB 타입 cast 전략

`appSchema`의 generic에 auth 패키지 테이블이 포함되지 않으므로 `AnyDb = NodePgDatabase<Record<string, unknown>>`을 사용하고, 각 쿼리 시 구체적인 schema 타입으로 cast한다:

```ts
type AnyDb = NodePgDatabase<Record<string, unknown>>;
// 사용 시:
(db as NodePgDatabase<{ users: typeof users }>).select()...
```

### 8. `!` 연산자 대신 이중 캐스팅 destructuring

`noUncheckedIndexedAccess: true` + biome `noNonNullAssertion` 규칙 조합으로 `mock.calls[0]!` 패턴이 막힌다. `as unknown as [[Type]]` 이중 캐스팅 + 구조 분해로 해결:

```ts
const [[call]] = tokenStore.insert.mock.calls as unknown as [[{ tokenHash: string; ... }]];
```
