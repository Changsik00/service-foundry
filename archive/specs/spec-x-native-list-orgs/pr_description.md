feat(spec-x-native-list-orgs): add native GET /auth/orgs (list my orgs)

## 📋 Summary

### 배경 및 목적
"내 org 목록"(테넌트 스위처)이 **provider 모드 전용**(`ProviderOrgController.orgs` → providerUid 키)이라 **native 모드엔 `GET /auth/orgs` 가 없어 404**. native 도 cross-org 멤버십을 지원하므로 parity 완성.

### 주요 변경 사항
- [x] `OrgListService.listForUserId(userId)` — native sub(=내부 userId) 키로 내 org 목록 (runWithSystemTenant + 정렬 + limit)
- [x] native `OrgController` 에 `GET /auth/orgs` (`@UseGuards(AuthGuard)`) + OrgListService 주입
- [x] `auth.module` OrgListService provider 등록
- [x] 응답 계약 provider 와 동일(`{ orgs: OrgSummary[] }`)

### 타입
- **Fix (모드 parity)** · spec-x → main

## 🎯 Key Review Points
1. native sub = 내부 userId(`sub: user.id`, signin/signup 확인) → `memberships.userId` 직접 스코프(users join 불필요).
2. route-inventory EXPECTED 에 `GET /auth/orgs [AuthGuard]` 추가, DI smoke 가 native AppModule provider 주입 검증.
3. 웹 미변경(웹은 provider 전용) — 본 spec 은 native API parity.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB → 151/151
```
- 단위(listForUserId·orgs) + route-inventory + DI smoke PASS.
- **native e2e**: signup → `GET /auth/orgs` → 개인 org 포함 200 (이전 404).

## 📦 Files Changed
- `apps/api/src/auth/org-list.service.ts` (`listForUserId`)
- `apps/api/src/auth/org.controller.ts` (`GET /auth/orgs`)
- `apps/api/src/auth/auth.module.ts` (provider)
- `apps/api/src/auth/org-list.service.test.ts` · `org.controller.test.ts` · `route-inventory.test.ts` · `tenant-isolation.http.e2e.test.ts`

## ✅ Definition of Done
- [x] listForUserId + native GET /auth/orgs + provider 등록
- [x] route-inventory 갱신, DI smoke + e2e 회귀 0
- [x] native 실증 e2e

## 🔗 관련
- Icebox `/auth/orgs` native 갭, wiring audit, spec-x-list-query-bounds(limit 패턴)
