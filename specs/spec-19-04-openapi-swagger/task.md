# Task List: spec-19-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: 패키지 설치 + Swagger 초기화 + 컨트롤러 데코레이터 (Green)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-19-04-openapi-swagger` (base: `phase-19-account-authz`)

### 1-2. 패키지 설치
- [ ] `apps/api/package.json` — `@nestjs/swagger`, `swagger-ui-express` 추가
- [ ] `pnpm install`

### 1-3. settings.ts 확장
- [ ] `SWAGGER_ENABLED: z.coerce.boolean().default(false)` 추가

### 1-4. main.ts SwaggerModule 초기화
- [ ] `SWAGGER_ENABLED` 게이팅 + `DocumentBuilder` + `SwaggerModule.setup`

### 1-5. 컨트롤러 데코레이터
- [ ] `auth.controller.ts` — `@ApiTags('auth')` + 핵심 엔드포인트 데코레이터
- [ ] `account.controller.ts` — `@ApiTags('account')` + 핵심 엔드포인트 데코레이터
- [ ] `health.controller.ts` — `@ApiTags('health')` + 데코레이터

### 1-6. 검증
- [ ] `pnpm --filter=@apps/api exec vitest run` → PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-19-04): @nestjs/swagger 설치 + SwaggerUI /api-docs (SWAGGER_ENABLED 게이팅)`

---

## Task 2: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm turbo run typecheck` → PASS
- [ ] 전체 테스트 PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-19-04): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-19-04-openapi-swagger`
- [ ] **PR 생성**: base `phase-19-account-authz` 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 2 |
| **예상 commit 수** | 2 (구현 / Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-12 |
