# Task List: spec-05-06

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-05.md SPEC 표 갱신 — sdd spec new)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-05-06-password-reset-flow` (base: `phase-05-auth-core-security`)
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: apps/api DB Schema — users + password_reset_tokens

### 2-1. 파일 작성
- [x] `apps/api/src/infra/schema/users.ts` — users 테이블 (id, email unique, password_hash, email_verified, created_at)
- [x] `apps/api/src/infra/schema/password-reset-tokens.ts` — password_reset_tokens 테이블 (id, user_id, token_hash unique, expires_at, used_at nullable, created_at)
- [x] `apps/api/src/infra/schema/index.ts` — users + passwordResetTokens re-export + appSchema

### 2-2. Drizzle config + migration
- [x] `apps/api/drizzle.config.ts` 작성 (local schema → `./drizzle`)
- [x] `apps/api/package.json`에 `db:generate` / `db:migrate` 스크립트 + `drizzle-kit` devDep 추가
- [x] `pnpm --filter @apps/api db:generate` 실행 → migration SQL 생성 확인

### 2-3. AppModule schema 업데이트
- [x] `apps/api/src/app.module.ts` — `DatabaseModule.forRoot({ schema: appSchema })` 업데이트

### 2-4. 검증
- [x] `pnpm typecheck` PASS

- [x] Commit: `feat(spec-05-06): apps/api schema — users + password_reset_tokens + drizzle config`

---

## Task 3: JWKS Endpoint (GET /.well-known/jwks.json)

### 3-1. JwtModule 작성
- [x] `apps/api/src/jwt/jwt.service.ts` — `createInMemoryKeyStore()` + `getJwks(): Jwks` 제공
- [x] `apps/api/src/jwt/jwks.controller.ts` — `GET /.well-known/jwks.json` (`@SkipThrottle()`)
- [x] `apps/api/src/jwt/jwt.module.ts` — providers: [JwtService], controllers: [JwksController], exports: [JwtService]

### 3-2. 테스트 (NestJS TestingModule)
- [x] `apps/api/src/jwt/jwks.controller.test.ts` — supertest로 GET /.well-known/jwks.json → JWKS 구조 검증
- [x] `pnpm --filter @apps/api test` PASS (2/2)

### 3-3. AppModule 업데이트
- [x] `app.module.ts`에 `JwtModule` import 추가
- [x] `pnpm typecheck` PASS

- [x] Commit: `feat(spec-05-06): JWKS endpoint (GET /.well-known/jwks.json)`

---

## Task 4: Password Reset Request Endpoint

### 4-1. PasswordResetService + AuthModule 작성 (request 로직)
- [ ] `apps/api/src/auth/password-reset.service.ts`
  - `request(ip: string, email: string): Promise<void>` — rate limit check → user lookup → token 생성 + DB 저장 + console.log (email stub). 항상 void (caller가 200 반환).
  - `zodPipe(schema)` inline helper
- [ ] `apps/api/src/auth/auth.controller.ts` — `POST /auth/password/reset` (`@Body(zodPipe(PasswordResetRequest)) body`)
- [ ] `apps/api/src/auth/auth.module.ts` — providers: [PasswordResetService], controllers: [AuthController]

### 4-2. 단위 테스트 (TDD)
- [ ] `apps/api/src/auth/password-reset.service.test.ts`
  - 케이스 1: 존재 email → DB에 token_hash 저장됨, TTL = 15분
  - 케이스 2: 미존재 email → DB에 token 없음 (enumeration-safe)
  - 케이스 3: rate limit 초과 → token 미생성 (rate limited)
- [ ] `pnpm --filter @apps/api test` PASS

### 4-3. AppModule 업데이트
- [ ] `app.module.ts`에 `AuthModule` import 추가
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-05-06): password reset request endpoint — always-200 + token generation`

---

## Task 5: Password Reset Confirm Endpoint

### 5-1. PasswordResetService confirm 로직 추가
- [ ] `password-reset.service.ts`에 `confirm(token: string, newPassword: string): Promise<void>` 추가
  - token hash → DB 조회 → expires_at + used_at 검증
  - 통과 시: `hashPassword(newPassword)` → users.password_hash 갱신 → token used_at 갱신
  - 실패 시: silent (caller는 200 반환)

### 5-2. 컨트롤러 업데이트
- [ ] `auth.controller.ts`에 `POST /auth/password/reset/confirm` 추가

### 5-3. 단위 테스트 추가
- [ ] 케이스 4: confirm 성공 → password_hash 갱신됨, used_at 설정됨
- [ ] 케이스 5: confirm 만료 token → 갱신 없음 (silent fail)
- [ ] 케이스 6: confirm 재사용 token → 갱신 없음 (single-use)
- [ ] `pnpm --filter @apps/api test` PASS (전체)

- [ ] Commit: `feat(spec-05-06): password reset confirm — token verify + password update`

---

## Task 6: E2E 테스트 + 전체 품질 점검

### 6-1. E2E 테스트 (real PG)
- [ ] Docker postgres 기동 (port 5434)
- [ ] auth-session + auth-rate-limit + apps/api 순서로 migration 실행
- [ ] `apps/api/src/auth/auth.e2e.test.ts` 작성 (supertest + real PG)
  - request (존재 user) → DB token_hash 확인
  - request (미존재 email) → DB token 없음
  - confirm (유효 token) → DB password_hash 갱신
  - JWKS endpoint → 구조 검증
- [ ] `DATABASE_URL=... pnpm --filter @apps/api test` PASS

### 6-2. 품질 점검
- [ ] `pnpm --filter @apps/api lint` PASS (biome)
- [ ] `pnpm typecheck` PASS (turbo)
- [ ] `npx depcruise --config packages/config/depcruise-config/base.cjs packages apps` PASS

- [ ] Commit: `test(spec-05-06): E2E — password reset + JWKS round-trip (real PG)`

---

## Task 7: Ship

> `/hk-ship` 절차를 따릅니다.

- [ ] 전체 테스트 재실행 → PASS
- [ ] **walkthrough.md 작성** (증거 로그 + 설계 결정)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-05-06): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-05-06-password-reset-flow`
- [ ] **PR 생성**: target `phase-05-auth-core-security` (에이전트가 `gh pr create` 또는 `/hk-pr-gh` 로 생성)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (브랜치 포함) |
| **예상 commit 수** | 5 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 |
