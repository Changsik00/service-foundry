fix(spec-x-org-members-defensive-scope): add explicit org_id scope to org-members

## 📋 Summary

### 배경 및 목적
phase-24 회고 §W6(얇은 방어선) 후속. cross-tenant 누수(#179)가 났던 `memberships` 가 `OrgMembersService.list` 에서 **명시 `WHERE org_id` 없이 RLS+interceptor 단일 의존**이었다. defense-in-depth 로 애플리케이션 레이어 명시 스코프를 추가.

### 감사 결과 (착수 전)
- **A (RLS-off 인증 인프라)** / **B (raw pool 우회)**: 전수 감사 → 전부 self-scope WHERE 또는 admin-gate. **실제 노출 0, 코드 변경 불필요.**
- **C (org-members)**: 유일한 실 변경 대상.

### 주요 변경 사항
- [x] `OrgMembersService.list` 에 `orgId` 파라미터 + `eq(memberships.orgId, orgId ?? NIL_ORG)` (orgId 없으면 fail-closed 0건)
- [x] `org.controller`·`provider-org.controller` 가 `user.orgId` 전달
- [x] 단위 테스트(RLS-독립 조건 적용 증명) + 컨트롤러 테스트 갱신 + org-members.e2e AuthGuard stub 현실화

### 타입
- **Fix (보안 하드닝)** · spec-x → main

## 🎯 Key Review Points

1. **이중방어**: RLS(컨텍스트) + interceptor fail-close(#179) + **앱 레이어 명시 WHERE** → 한 계층 어긋나도 cross-org 누수 0.
2. **fail-closed 일관**: orgId 없으면 nil-uuid → 0건 (interceptor 와 동일 철학).
3. A/B 는 감사로 안전 확인(walkthrough 기록) — 불필요한 변경 안 함.

## 🧪 Verification

```bash
turbo run lint typecheck test   # fresh DB 5434 → 151/151
```
**결과**: ✅ 151/151 task, e2e 회귀 0. org-members 단위 RLS-독립 스코프 증명.

> 디버깅 노트: 장기 공유 테스트 DB 누적 상태로 무관 e2e 가 오탐 실패 → fresh DB 재생성 후 전부 PASS(코드 무관).

## 📦 Files Changed

### 🛠 Modified
- `apps/api/src/auth/org-members.service.ts` (명시 org 스코프)
- `apps/api/src/auth/org.controller.ts` · `provider-org.controller.ts` (user.orgId 전달)
- `apps/api/src/auth/org-members.service.test.ts` · `org.controller.test.ts` · `provider-org.controller.test.ts` · `org-members.e2e.test.ts` · `org-members.email.test.ts` (테스트)

## ✅ Definition of Done

- [x] 명시 `WHERE org_id` + 컨트롤러 orgId 전달
- [x] RLS-독립 스코프 단위 + e2e 회귀 0
- [x] A/B 감사 안전 확인 문서화
- [x] lint/typecheck/test PASS

## 🔗 관련 자료
- spec-x-null-org-isolation-failclose (#179), ADR-0024, phase-24 회고
