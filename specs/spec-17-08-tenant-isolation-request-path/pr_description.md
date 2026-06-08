# fix(spec-17-08): 테넌트 격리 — 요청 경로 배선 + 회귀 차단

## 📋 Summary

### 배경 및 목적

spec-17-07 이 DB-level 격리 메커니즘을 닫았으나, phase-17 회고(독립 감사 + 코드 검증, `docs/review/2026-06-08-phase-17-review.md`)에서 **격리가 실제 HTTP 요청 경로에서 작동하지 않음** 을 발견했다(NO-GO). 본 spec 은 회고 Critical 5건을 실 경로로 해소하고, 거짓 GREEN 재발을 막는 실 HTTP 통합 테스트를 추가한다.

### 주요 변경 사항
- [x] **C-1** AuthGuard 가 `activeOrgId` 클레임을 읽어 `req.user.orgId` 채움 (서명/검증 공유 상수 `ACTIVE_ORG_CLAIM`)
- [x] **C-2** signin/refresh 토큰에 `activeOrgId`/`orgRole` 포함
- [x] **C-3** RLS 를 도메인 테이블(orgs/memberships/invitations)로 한정, auth 인프라에서 제거 (세션 회귀 차단)
- [x] **C-4** 토큰 기반 invite accept 의 cross-org 조회를 시스템 컨텍스트 seam(`runWithSystemTenant`)으로 처리
- [x] **C-5** invite 토큰-이메일 바인딩 + 멤버십 중복 거부 + 단일 tx 원자화
- [x] **실 HTTP 통합 테스트**(토큰→guard→interceptor→RLS) + ADR-0024(invariant)

### Phase 컨텍스트
- **Phase**: `phase-17` (멀티테넌시 spine)
- **본 SPEC 의 역할**: spine 의 핵심 보장(테넌트 격리)을 *실 경로에서* 실효화 — phase-17 ship 의 전제.

## 🎯 Key Review Points

1. **클레임 계약** (`auth.guard.ts`, `claims.ts`): 서명·검증이 공유 상수로 `activeOrgId` 사용. 표류가 원래 결함 원인.
2. **RLS 범위 정정** (`0013_rls_scope_domain_only.sql`): auth 인프라는 org-스코프 데이터가 아니므로 RLS 제거 — spec-17-03 과대적용 정정.
3. **시스템 컨텍스트 seam** (`tenant.ts` `runWithSystemTenant`, `org-invite.service.ts`): 같은 tx 안에서 컨텍스트 토글로 cross-org accept 원자 처리.
4. **org 토큰 role 클레임**: org-invite/org-switch 토큰이 전역 `role` 누락 → C-1 로 401 표면화 → 수정.
5. **실 HTTP 검증** (`tenant-isolation.http.e2e.test.ts`): raw SQL 우회 금지, 실제 요청 경로로 격리 증명.

## 🧪 Verification

```bash
DATABASE_URL=postgres://app_runtime:test@localhost:5434/test \
DATABASE_MIGRATE_URL=postgres://postgres:test@localhost:5434/test \
pnpm turbo run knip depcruise lint typecheck test build
```

**결과 요약** (fresh DB):
- ✅ 전체 게이트 **137 tasks successful**
- ✅ `@apps/api` **144 tests / 23 files** (실 HTTP 격리 + cross-org invite accept 포함)

### 수동 검증 시나리오
1. signup 토큰 `GET /auth/org/members` → org A 만 (Before: org B 노출 → After: 차단)
2. org A 가 B 초대 → B accept → B 가 org A 멤버 (시스템 컨텍스트)
3. email 불일치 accept → 403 / 중복 → 409 / refresh → 200(회귀 0)

## 📦 Files Changed

### 🆕 New Files
- `apps/api/src/auth/tenant-isolation.http.e2e.test.ts`: 실 HTTP 격리 + cross-org accept
- `apps/api/src/auth/org-members.service.ts` + `GET /auth/org/members`: 격리 검증 read 표면
- `apps/api/drizzle/0013_rls_scope_domain_only.sql`: RLS 도메인 한정
- `apps/api/src/infra/tenant.module.ts`: @Global ALS 공유
- `packages/backend/auth-jwt/src/claims.ts`: 클레임 상수
- `docs/adr/0024-tenant-isolation-enforcement.md`

### 🛠 Modified Files
- `packages/nestjs/auth/src/auth.guard.ts`: activeOrgId 매핑
- `apps/api/src/auth/signin.service.ts`: org 클레임 주입
- `apps/api/src/auth/org-invite.service.ts`: 시스템 컨텍스트 + email 바인딩 + 원자화
- `apps/api/src/auth/org-switch.service.ts`: role 클레임
- `apps/api/src/infra/tenant.ts`: runWithSystemTenant
- `apps/api/src/app.module.ts`: TenantModule 배선
- 테스트: guard/signin/org-switch/org-invite/controller/tenant + DB-level e2e

**Total**: 28 files changed (+842 / -76), 9 commits

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과
- [x] 통합 테스트(실 HTTP 격리) 통과 + 기존 e2e 무회귀
- [x] 회고 C-1~C-5 코드 해소
- [x] ADR-0024 작성
- [x] lint / type check 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- 회고: `docs/review/2026-06-08-phase-17-review.md`
- ADR: `docs/adr/0024-tenant-isolation-enforcement.md`
- **PR base**: `phase-17`
