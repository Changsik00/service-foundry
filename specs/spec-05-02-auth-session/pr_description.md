# spec-05-02: auth-session — refresh token rotation 기반 session 관리

## 요약

`@repo/backend-auth-session` 신규 — *framework-agnostic* refresh token session 관리.

- Drizzle `sessions` schema + drizzle-kit migration (0000_funny_jane_foster.sql)
- Token primitives — 256-bit base64url + SHA-256 hex hash (ADR-0014)
- 3 함수 — `createSession` / `rotateSession` / `revokeSession`
- Rotation chain (`refreshTokenFamily`) + reuse detection (ADR-0013)
- Repository 패턴 (`SessionStore` interface) — domain 은 ORM 모름

## 핵심 설계

### Repository 패턴

```
src/store.ts          → SessionStore interface (insert / findByHash / updateRevoked / bulkRevokeByFamily)
src/session.ts        → createSession / rotateSession / revokeSession (interface 의존)
src/drizzle-store.ts  → drizzleSessionStore(db) — production adapter
src/session.test.ts   → fake in-memory store (Map 기반) — unit test
```

`apps/api` 등 호출자는 `drizzleSessionStore(db)` 박은 후 도메인 함수 호출 — drizzle 직접 의존 안 함. phase-03 spec-03-05 의 `@repo/backend-database` docstring 가이드 답습.

### Refresh token rotation + reuse detection

- `createSession` → 새 family UUID 발행.
- `rotateSession (active)` → 기존 revoke + 새 token (같은 family).
- `rotateSession (already revoked)` → **family 전체 revoke** + `reuse_detected` 반환.
- 보안 의도: attacker 가 훔친 token 으로 rotate 박은 뒤 원본 사용자가 다시 시도하면 *둘 다 revoke* — 둘 다 강제 재인증.

### Refresh token hash 저장

`crypto.randomBytes(32).toString("base64url")` (256-bit, URL-safe, ~43자) 발급 + DB 에는 SHA-256 hex 저장. DB 유출 시 raw token plaintext 미노출.

## 변경 사항

| 파일 | 박힌 거 |
|---|---|
| `packages/backend/auth-session/package.json` | name @repo/backend-auth-session, deps: backend-database/errors/drizzle-orm |
| `tsconfig.json` / `vitest.config.ts` | 표준 |
| `drizzle.config.ts` | postgresql dialect, schema: ./src/schema.ts |
| `src/schema.ts` | sessions pgTable (7 column) + SessionRow/SessionInsert |
| `src/token.ts` | generateRefreshToken / hashToken |
| `src/store.ts` | SessionStore interface |
| `src/session.ts` | createSession / rotateSession / revokeSession (도메인) |
| `src/drizzle-store.ts` | drizzleSessionStore(db) adapter |
| `src/index.ts` | barrel |
| `src/token.test.ts` (6) / `src/session.test.ts` (6) | 12 unit test |
| `drizzle/0000_funny_jane_foster.sql` | CREATE TABLE sessions (+ unique constraint) |
| `README.md` | 수동 검증 가이드 |
| `apps/web-next/vitest.config.ts` | passWithNoTests:true (별 fix — turbo run test 그린화) |

## 검증

- lint ✓ / typecheck ✓ / test 12/12 ✓ / depcruise ✓ (143 modules / 211 deps, violations 0)
- **실 PG migration ✓** — Docker postgres:16 + db:migrate + `\d sessions` + round-trip (서브에이전트 자동 검증). **phase-03 의 *postgres-pkg 실 PG 검증 이연* 항목 해소**.

## 본 spec 의 *scope 밖*

- NestJS adapter (phase-06)
- User 테이블 (별 spec)
- multi-device tracking / Redis / jti deny list / cron cleanup
- testcontainers integration test (phase-10)

Refs phase-05-auth-core-security
