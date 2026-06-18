# Implementation Plan: spec-x-tenant-isolation-hardening

## 📋 Branch Strategy
- 신규 브랜치: `spec-x-tenant-isolation-hardening` (= spec 디렉토리명)
- 시작 지점 / PR base: **`main`** (spec-x, phase 비소속)
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **WITH CHECK 강제**: 도메인 테이블 INSERT/UPDATE 가 `org_id = app.current_org` 를 만족해야 함. 정당한 cross-org 쓰기(provision·invite accept)는 `runWithSystemTenant`(컨텍스트 NULL) 로 통과 — 회귀 0 가정을 e2e 로 검증.
> - [ ] **부팅 거부 가드**: production + 런타임 슈퍼유저면 앱 기동 실패(OnApplicationBootstrap + `SELECT rolsuper`). 잘못된 운영 배포를 빠르게 차단(의도된 fail-fast).

> [!WARNING]
> - [ ] 0014 마이그레이션이 도메인 정책 재생성(WITH CHECK 추가) — down 경로(0012 형태 복원) 문서화.

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **쓰기 강제** | 0014: 3 도메인 정책 `WITH CHECK (NULLIF(ctx,'') IS NULL OR org_id=ctx)` | 읽기(USING)와 대칭. NULL=시스템/무컨텍스트 허용 → 회귀 0 |
| **슈퍼유저 가드** | OnApplicationBootstrap provider: production 시 `SELECT rolsuper` → true 면 throw | username 휴리스틱(W-5)보다 정확 |
| **W-6** | 에러경로 테스트 보강 + 한계 명시 | SDK 호출은 이미 검증됨 |
| **쓰기 격리 검증** | app_runtime + ctx=A 로 org_id=B INSERT 시도 → 거부 (DB-level) + 기존 흐름 회귀 e2e | 강제 작동 증명 |

## 📂 Proposed Changes

### 1. 쓰기 격리 테스트 (TDD Red)
#### [MODIFY] `apps/api/src/infra/tenant-isolation.e2e.test.ts`
- 케이스 추가: ctx=org A 에서 `INSERT organizations(id=B 계열)` 또는 `memberships(org_id=B)` → 예외(WITH CHECK 위반). 현재 `WITH CHECK(true)` 라 통과 → **Red**.

### 2. WITH CHECK 강제 마이그레이션
#### [NEW] `apps/api/drizzle/0014_rls_write_check.sql` (+journal)
- organizations·memberships·invitations 정책 DROP+CREATE: USING 유지 + `WITH CHECK (NULLIF(current_setting('app.current_org',true),'') IS NULL OR <org_id|id> = NULLIF(...)::uuid)`.

### 3. 부팅 슈퍼유저 가드 (W-5)
#### [NEW] `apps/api/src/infra/superuser-guard.provider.ts` (OnApplicationBootstrap)
- production 시 `SELECT rolsuper FROM pg_roles WHERE rolname=current_user` → true 면 throw. app.module 에 등록.
- (선택) `settings.ts` 의 username 휴리스틱은 빠른 1차 가드로 유지하거나 주석으로 보강 관계 명시.
- 단위 테스트(mock db: superuser/비-superuser × prod/dev).

### 4. W-6 정리
#### [MODIFY] `packages/backend/notification/src/index.test.ts`
- Resend `error` 응답 → `sendEmail` throw 케이스 보강(없으면 추가).

## 🧪 검증 계획
### 단위 + 통합
```bash
DATABASE_URL=<app_runtime> DATABASE_MIGRATE_URL=<owner> pnpm --filter @apps/api test
pnpm --filter @repo/backend-notification test
```
### 전체 게이트 (fresh DB)
```bash
pnpm turbo run knip depcruise lint typecheck test build
```
### 수동 검증
1. ctx=A INSERT org_id=B → 거부. ctx=A INSERT org_id=A → 통과.
2. signup/invite create+accept/switch → 정상(회귀 0).
3. (가드) prod + supertuser URL 부팅 → 거부 로그.

## 🔁 Rollback Plan
- 0014 down: 정책을 0012 형태(WITH CHECK true)로 복원.
- 가드 provider 제거 시 부팅 거부 해제.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 전 task + walkthrough/pr ship
