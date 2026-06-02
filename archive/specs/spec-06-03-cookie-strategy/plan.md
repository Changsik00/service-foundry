# Implementation Plan: spec-06-03 — cookie-strategy

## 📋 Branch Strategy

- 신규 브랜치: `spec-06-03-cookie-strategy`
- 시작 지점: `phase-06-auth-integration`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `signAccessToken` payload 에 index signature 추가 — 기존 호출자 영향 없음 (하위 호환), 기존 테스트 PASS 확인 필요
> - [ ] sessions 테이블 migration SQL 생성 (drizzle-kit generate) — DB 실행은 수동

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| `signAccessToken` 확장 | index signature `readonly [key: string]: unknown` | `role` 등 임의 claim 포함 가능. 기존 `{ sub }` 호출 그대로 동작 |
| sessions → appSchema | `@repo/backend-auth-session` 의 `sessions` import | 단일 Drizzle 인스턴스가 sessions 타입 인식. DB 마이그레이션은 별도 실행 |
| cookie helper | 순수 함수 `setRefreshTokenCookie(res, token)` / `clearRefreshTokenCookie(res)` | NestJS `@Res({ passthrough: true })` 패턴. 테스트 시 mock Response 사용 |
| `GET /auth/me` 응답 | `AuthenticatedUser { sub, role }` (DB lookup 없음) | YAGNI — 라우팅 guard 에는 충분. full User 조회는 spec-06-05 필요 시 |
| UserStore 확장 | `insert` + `findById` 추가 | signup (insert) + me endpoint DB lookup (findById) |
| SigninService 에러 응답 | `UnauthorizedException` (401) | enumeration-safe — email 없음 / password 틀림 동일 응답 |

## 📂 Proposed Changes

### `@repo/backend-auth-jwt`

#### [MODIFY] `packages/backend/auth-jwt/src/sign.ts`

`SignAccessTokenPayload` 에 index signature 추가. 구현에서 `{ sub, ...rest }` 분리 후 `new SignJWT(rest)`.

```ts
export interface SignAccessTokenPayload {
  readonly sub: string;
  readonly [key: string]: unknown;
}
// 구현: const { sub, ...rest } = payload; new SignJWT(rest).setSubject(sub)...
```

### `apps/api` — 스키마

#### [MODIFY] `apps/api/src/infra/schema/local.ts`

`sessions` import 추가.

#### [MODIFY] `apps/api/src/infra/schema/index.ts`

`sessions` export 추가, `appSchema` 에 포함.

#### [NEW] `apps/api/drizzle/000N_sessions.sql`

`drizzle-kit generate` 로 생성 (sessions 테이블).

### `apps/api` — Auth layer

#### [MODIFY] `apps/api/src/auth/password-reset.stores.ts`

`UserStore` 에 `insert(data: UserInsert): Promise<UserRow>` + `findById(id: string): Promise<UserRow | null>` 추가 + `createDrizzleUserStore` 구현.

#### [NEW] `apps/api/src/auth/cookie.helper.ts`

```ts
export function setRefreshTokenCookie(res: Response, token: string): void
export function clearRefreshTokenCookie(res: Response): void
```

#### [NEW] `apps/api/src/auth/signin.service.ts`

```ts
signIn(email, password): Promise<{ accessToken: string; user: UserRow; refreshToken: string }>
```
- `UserStore.findByEmail` → `verifyPassword` → `createSession` → `signAccessToken({ sub, role })`
- email 없음 / password 틀림: `UnauthorizedException` (동일 응답, enumeration-safe)

#### [NEW] `apps/api/src/auth/signup.service.ts`

```ts
signUp(email, password): Promise<{ accessToken: string; user: UserRow; refreshToken: string }>
```
- email 중복: `ConflictException`
- `hashPassword` → `UserStore.insert` → `createSession` → `signAccessToken({ sub, role })`

#### [MODIFY] `apps/api/src/auth/auth.controller.ts`

5 endpoints 추가:
- `POST /auth/signin` — `@Res({ passthrough: true })` → cookie + `{ accessToken, user }`
- `POST /auth/signup` — cookie + `{ accessToken, user }`
- `POST /auth/signout` — cookie 삭제 + `{ status: "ok" }`
- `POST /auth/refresh` — rotateSession → cookie + `{ accessToken, user }`
- `GET /auth/me` — `@UseGuards(AuthGuard)` + `@CurrentUser()` → `{ user }`

#### [MODIFY] `apps/api/src/auth/auth.module.ts`

`JwtModule` import + `SigninService` + `SignupService` + `SessionStore` provider + `UserStore` 확장.

### 테스트

#### [NEW] `apps/api/src/auth/signin.service.test.ts`

3 케이스: 성공 / 잘못된 password / email 없음

#### [NEW] `apps/api/src/auth/signup.service.test.ts`

3 케이스: 성공 / 이메일 중복 / validation

#### [NEW] `apps/api/src/auth/auth.controller.test.ts`

5 endpoints × mock Service: signin / signup / signout / refresh / me

## 🧪 검증 계획

```bash
pnpm --filter @repo/backend-auth-jwt test
pnpm --filter @repo/api test
pnpm typecheck
pnpm --filter @repo/api exec biome check src/
```

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
