# Task List: spec-06-03 — cookie-strategy

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight

- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-06-03-cookie-strategy`
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: `signAccessToken` custom claims 확장

- [ ] `packages/backend/auth-jwt/src/sign.ts`: `SignAccessTokenPayload` 에 index signature 추가
- [ ] 구현: `const { sub, ...rest } = payload; new SignJWT(rest).setSubject(sub)...`
- [ ] 기존 테스트 PASS: `pnpm --filter @repo/backend-auth-jwt test`
- [ ] Commit: `feat(spec-06-03): signAccessToken — custom claims index signature`

---

## Task 3: sessions → appSchema + migration

- [ ] `apps/api/src/infra/schema/local.ts`: `sessions` export 추가
- [ ] `apps/api/src/infra/schema/index.ts`: `sessions` + `SessionRow` + `SessionInsert` export + appSchema 편입
- [ ] `pnpm --filter @repo/api exec drizzle-kit generate`
- [ ] 생성된 migration SQL 검토
- [ ] Commit: `feat(spec-06-03): sessions 테이블 appSchema 편입 + migration`

---

## Task 4: SigninService TDD

- [ ] `apps/api/src/auth/signin.service.test.ts` 작성 (3케이스: 성공 / 잘못된 password / email 없음)
- [ ] 테스트 RED: `pnpm --filter @repo/api test --run signin`
- [ ] `apps/api/src/auth/signin.service.ts` 구현
  - `UserStore.findByEmail` → `verifyPassword` → `createSession` → `signAccessToken({ sub, role })`
  - email 없음 / password 틀림: `UnauthorizedException` (enumeration-safe)
- [ ] `apps/api/src/auth/password-reset.stores.ts`: `UserStore` 에 `findById` 추가
- [ ] 테스트 GREEN: `pnpm --filter @repo/api test --run signin`
- [ ] Commit: `feat(spec-06-03): SigninService — 인증 + session 생성`

---

## Task 5: SignupService TDD

- [ ] `apps/api/src/auth/signup.service.test.ts` 작성 (3케이스: 성공 / 이메일 중복 / validation)
- [ ] 테스트 RED
- [ ] `apps/api/src/auth/signup.service.ts` 구현
  - `UserStore.findByEmail` → 중복 체크 → `hashPassword` → `UserStore.insert` → `createSession` → `signAccessToken({ sub, role })`
  - `UserStore` 에 `insert` 추가 (stores.ts 확장)
- [ ] 테스트 GREEN
- [ ] Commit: `feat(spec-06-03): SignupService — 회원가입 + session 생성`

---

## Task 6: cookie helper + AuthController 확장 + 통합

- [ ] `apps/api/src/auth/cookie.helper.ts`:
  - `setRefreshTokenCookie(res, token)` — httpOnly / secure / sameSite=lax / path=/ / maxAge=30d
  - `clearRefreshTokenCookie(res)` — maxAge=0
- [ ] `apps/api/src/auth/auth.controller.ts` 확장:
  - `POST /auth/signin` — `@Res({ passthrough: true })` → cookie + `{ accessToken, user }`
  - `POST /auth/signup` — cookie + `{ accessToken, user }`
  - `POST /auth/signout` — cookie 삭제 + `{ status: "ok" }`
  - `POST /auth/refresh` — rotateSession → cookie + `{ accessToken, user }`
  - `GET /auth/me` — `@UseGuards(AuthGuard)` + `@CurrentUser()` → `{ user }`
- [ ] `apps/api/src/auth/auth.module.ts` 확장: `JwtModule` import + `SessionStore` + `SigninService` + `SignupService`
- [ ] `apps/api/src/auth/auth.controller.test.ts` 작성 (5 endpoints, mock service)
- [ ] 테스트 PASS
- [ ] `pnpm typecheck`
- [ ] `pnpm --filter @repo/api exec biome check src/`
- [ ] Commit: `feat(spec-06-03): cookie auth endpoints (signin/signup/signout/refresh/me)`

---

## Task 7: Ship

- [ ] `specs/spec-06-03-cookie-strategy/walkthrough.md` 작성
- [ ] `specs/spec-06-03-cookie-strategy/pr_description.md` 작성
- [ ] Commit: `docs(spec-06-03): ship walkthrough and pr description`
- [ ] `git push -u origin spec-06-03-cookie-strategy`
- [ ] PR 생성 (base: `phase-06-auth-integration`)
- [ ] 사용자에게 PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 |
| **예상 commit 수** | 6 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 |
