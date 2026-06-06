# Walkthrough: spec-17-05

## 변경 요약

JWT 토큰에 `activeOrgId`/`orgRole` 클레임을 추가하고, `POST /auth/org/switch` 엔드포인트와 AsyncLocalStorage 기반 tenant context 주입 인프라를 구현했다.

## 주요 결정 사항

### 1. ProvisionService 리턴 타입 void → { orgId, orgRole }

signup 직후 발급하는 accessToken에 `activeOrgId`/`orgRole`을 포함하려면 provisionUser 결과가 필요했다. 기존 `void` 리턴 대신 `{ orgId, orgRole }` 을 반환하도록 변경. SignupService에서 구조분해하여 `signAccessToken` 페이로드에 전달.

### 2. AuthenticatedUser에 orgId 추가 (@repo/nestjs-auth)

AuthGuard는 JWT claims에서 `role`만 추출했다. `orgId`도 검증된 JWT payload에서만 읽도록 수정:
```typescript
const orgId = typeof result.value.orgId === "string" ? result.value.orgId : null;
req.user = { sub, role, orgId };
```
기존 소비자(`roles.guard.test.ts`, `auth.controller.test.ts`)는 `orgId: null` 픽스처 추가로 타입 보정.

### 3. OrgSwitchService — refreshToken 미재발급

`POST /auth/org/switch`는 새 accessToken만 반환한다. org 전환은 세션(refreshToken)의 교체 없이 인증 컨텍스트만 바꾸는 것으로 결정. 향후 필요 시 refreshToken 재발급 추가 가능.

### 4. withTenantContext — db.transaction + set_config(true)

`set_config('app.current_org', orgId, true)` 의 세 번째 인자 `true` = is_local. 트랜잭션 스코프에만 적용되므로 커넥션 반환 시 자동 해제 — 추가 cleanup 불필요. 현재 RLS가 퍼미시브이므로 실질적 격리는 spec-17-06 이후 `withTenantContext` 채택 범위 확대 시 발효.

### 5. APP_INTERCEPTOR는 @nestjs/core에서 import

`@nestjs/common`에는 없다. `TenantContextInterceptor`를 `APP_INTERCEPTOR`로 전역 등록해 모든 요청의 ALS에 orgId를 자동 저장.

## 파일 변경 내역

| 파일 | 변경 |
|---|---|
| `packages/nestjs/auth/src/auth.guard.ts` | MODIFY — `AuthenticatedUser.orgId` 추가, orgId 클레임 추출 |
| `packages/nestjs/auth/src/roles.guard.test.ts` | FIX — orgId:null 픽스처 |
| `packages/shared/auth-contracts/src/index.ts` | MODIFY — `OrgSwitchInput` 추가 |
| `apps/api/src/provision/provision.service.ts` | MODIFY — 리턴 void → { orgId, orgRole } |
| `apps/api/src/provision/provision.service.test.ts` | MODIFY — 리턴값 검증 추가 |
| `apps/api/src/auth/signup.service.ts` | MODIFY — provisionUser 결과 → token claims |
| `apps/api/src/auth/signup.service.test.ts` | MODIFY — mock 리턴값 업데이트 |
| `apps/api/src/auth/auth.controller.test.ts` | FIX — orgId:null 픽스처 |
| `apps/api/src/auth/org-switch.service.ts` | NEW — OrgSwitchService |
| `apps/api/src/auth/org-switch.service.test.ts` | NEW — 단위 테스트 |
| `apps/api/src/auth/auth.controller.ts` | MODIFY — POST /auth/org/switch 라우트 |
| `apps/api/src/auth/auth.module.ts` | MODIFY — OrgSwitchService 등록 |
| `apps/api/src/infra/tenant.ts` | NEW — TenantAls, TENANT_ALS, withTenantContext |
| `apps/api/src/infra/tenant.interceptor.ts` | NEW — TenantContextInterceptor |
| `apps/api/src/infra/tenant.test.ts` | NEW — withTenantContext 단위 테스트 |
| `apps/api/src/infra/tenant.interceptor.test.ts` | NEW — ALS 저장 단위 테스트 |
| `apps/api/src/app.module.ts` | MODIFY — TENANT_ALS + APP_INTERCEPTOR 전역 등록 |

## 검증

- 단위 테스트 총 14개 PASS (provision:1, signup:4, org-switch:3, tenant:3, interceptor:2, roles-guard:4(기존))
- typecheck PASS (전체 모노레포)
- lint PASS (biome — non-null assertion 경고는 pre-existing)
