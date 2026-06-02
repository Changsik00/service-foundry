# Task List: spec-06-01 — NestJS 인증 어댑터

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-06.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-06-01-auth-nestjs` (base: `phase-06-auth-integration`)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: 패키지 스캐폴드

### 2-1. 파일 생성
- [ ] `packages/nestjs/auth/package.json` — `@repo/nestjs-auth`, `@nestjs/common` + `@nestjs/core` + `@repo/backend-auth-jwt` + `@repo/auth-contracts` 의존
- [ ] `packages/nestjs/auth/tsconfig.json` — `experimentalDecorators` + `emitDecoratorMetadata` true
- [ ] `packages/nestjs/auth/src/index.ts` — 빈 파일 (추후 채움)

### 2-2. 검증
- [ ] `pnpm install` (workspace 인식 확인)
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `chore(spec-06-01): @repo/nestjs-auth 패키지 스캐폴드`

---

## Task 3: AuthGuard — TDD

### 3-1. 테스트 작성 (Red)
- [ ] `packages/nestjs/auth/src/auth.guard.test.ts` 작성
  - 케이스 1: 유효 token + role → `canActivate` true, `req.user = { sub, role }` 설정
  - 케이스 2: 만료/invalid token → `UnauthorizedException` throw
  - 케이스 3: role claim 없는 token → `UnauthorizedException` throw
- [ ] 테스트 실행 → Fail 확인

### 3-2. 구현 (Green)
- [ ] `packages/nestjs/auth/src/auth.guard.ts` 작성
  - `NESTJS_AUTH_OPTIONS` Symbol + `NestjsAuthOptions` 인터페이스 (`keyStore: KeyStore | (() => KeyStore)`, `issuer`, `audience`)
  - `AuthenticatedUser` 타입: `{ sub: string; role: Role }`
  - `AuthGuard` (`CanActivate`): Bearer 추출 → `verifyAccessToken` → `decodeJwt` → role 파싱
- [ ] 테스트 실행 → Pass 확인
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-06-01): AuthGuard — bearer 검증 + AuthenticatedUser 부착`

---

## Task 4: RolesGuard + 데코레이터 — TDD

### 4-1. 테스트 작성 (Red)
- [ ] `packages/nestjs/auth/src/roles.guard.test.ts` 작성
  - 케이스 4: `@Roles` 없는 handler → 통과
  - 케이스 5: `user.role` 일치 → 통과
  - 케이스 6: `user.role` 불일치 → `ForbiddenException` throw

### 4-2. 구현 (Green)
- [ ] `packages/nestjs/auth/src/decorators.ts` 작성
  - `ROLES_KEY` 상수
  - `@Roles(...roles: Role[])`: `SetMetadata` 기반
  - `@CurrentUser()`: `createParamDecorator` — `request.user` 추출
- [ ] `packages/nestjs/auth/src/roles.guard.ts` 작성
  - `RolesGuard` (`CanActivate`): `Reflector.getAllAndOverride` → `user.role` 검사
- [ ] 테스트 실행 → Pass 확인
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-06-01): RolesGuard + @Roles + @CurrentUser 데코레이터`

---

## Task 5: NestjsAuthModule + index.ts + apps/api 연동

### 5-1. 모듈 완성
- [ ] `packages/nestjs/auth/src/module.ts` 작성
  - `NestjsAuthModule.forRoot(opts)` — 동기 DynamicModule
  - `NestjsAuthModule.forRootAsync({ imports, inject, useFactory })` — 비동기 DynamicModule
- [ ] `packages/nestjs/auth/src/index.ts` — 모든 public export (`AuthGuard`, `RolesGuard`, `@Roles`, `@CurrentUser`, `NestjsAuthModule`, `AuthenticatedUser`, `NestjsAuthOptions`, `NESTJS_AUTH_OPTIONS`)

### 5-2. apps/api 연동
- [ ] `apps/api/package.json` — `@repo/nestjs-auth: workspace:*` 추가
- [ ] `apps/api/src/app.module.ts` — `NestjsAuthModule.forRootAsync` import 추가 (JwtService keyStore lazy 주입)

### 5-3. 검증
- [ ] `pnpm --filter @repo/nestjs-auth exec vitest run` → 전체 PASS
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm --filter @repo/nestjs-auth exec biome check src/` PASS

- [ ] Commit: `feat(spec-06-01): NestjsAuthModule + apps/api 연동`

---

## Task 6: Ship

> `/hk-ship` 절차를 따릅니다.

- [ ] 전체 테스트 재실행 → PASS
- [ ] **walkthrough.md 작성** (증거 로그)
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-06-01): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-06-01-auth-nestjs`
- [ ] **PR 생성**: target `phase-06-auth-integration`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (브랜치 포함) |
| **예상 commit 수** | 4 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 |
