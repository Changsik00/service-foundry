# PR: spec-17-05 — active_org 토큰 클레임 + org 전환 endpoint + AsyncLocalStorage 주입

## Summary

- JWT access token에 `activeOrgId`, `orgRole` 클레임 추가 — signup 시 personal org ID 자동 포함
- `POST /auth/org/switch { orgId }` — 멤버십 검증 후 새 accessToken 발급 (org 전환)
- `AsyncLocalStorage` 기반 tenant context 주입 인프라 — `TenantContextInterceptor` 전역 등록, `withTenantContext()` DB 헬퍼

## Test plan

- [x] `provision.service.test.ts` — provisionUser 리턴값 `{ orgId, orgRole }` 검증
- [x] `signup.service.test.ts` — activeOrgId/orgRole 클레임 포함 token 발급
- [x] `org-switch.service.test.ts` — 멤버십 있음 → token 발급, 없음 → ForbiddenException
- [x] `tenant.test.ts` — withTenantContext: set_config 실행 여부, fn 리턴값 전달
- [x] `tenant.interceptor.test.ts` — ALS에 orgId 저장 확인
- [x] typecheck PASS (전체 모노레포)
- [x] lint PASS (biome)

## 참고

- 기반 브랜치: `phase-17`
- 선행 spec: spec-17-04 (ProvisionService)
- 후속 spec: spec-17-06 (초대 endpoint — withTenantContext 사용 범위 확대)
- RLS는 여전히 퍼미시브 — `withTenantContext` 강제 사용은 spec-17-06+에서 적용

🤖 Generated with [Claude Code](https://claude.com/claude-code)
