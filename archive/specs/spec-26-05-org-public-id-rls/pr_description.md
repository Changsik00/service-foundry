feat(spec-26-05): organizations.public_id + RLS-consistent exposure

## 📋 Summary

### 배경 및 목적
org 식별자를 외부 표면에서 `public_id` 로 전환(users 26-02/03 패턴). **핵심: JWT `active_org`·`SET LOCAL app.current_org`·RLS 술어는 내부 uuid 유지**(격리 SoT 불변) — 외부 표면만 변환.

### 주요 변경 사항
- [x] `organizations.public_id` (text UK, `gen_public_id('org')` default) + 백필 마이그레이션
- [x] 응답 org 식별자 → org public_id: `/auth/orgs`·`/auth/org/members`·`/auth/me`(native+provider)·provider switch/invite-accept·`/admin/orgs`·`/admin/users`
- [x] `/auth/org/members` userId → **user public_id 상속** (member table 내부 uuid 제거; 커서는 내부 id 유지)
- [x] **org/switch 입력 = public_id** → 내부 해석 + **멤버십 검증**(ADR-0029: 비멤버/미존재 403)
- [x] web: 코드 변경 불요(format-agnostic) — 투명 호환

### 타입
- **Feature (schema/API 계약/노출 전환)** · spec-26-05 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **격리 불변**: RLS/JWT/SET LOCAL 은 내부 uuid 그대로. tenant-isolation e2e 회귀 0.
2. **switch 게이트**: org public_id → 내부 해석(raw pool, RLS 우회 정당) → 멤버십 검증이 유일 인가 게이트. 미존재/비멤버 fail-close(403).
3. **검증 2단계(`/hk-refute`) Go**: 격리 회귀·게이트 우회 시나리오 없음. 유일 지적은 web no-op(format-agnostic 우연 호환) — walkthrough 기록.
4. admin cursor 는 내부 id(불투명 base64) 유지 — 26-07 누출 점검 대상(Out of Scope).

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- org public_id 컬럼·org_ 형식 응답·members userId=usr_·switch(200/403/403) e2e + 단위.
- 전체 **154/154 tasks**, tenant-isolation 회귀 0.

## 📦 Files Changed
- `packages/backend/schema/src/organizations.ts` + `apps/api/drizzle/0022_*`
- `apps/api/src/auth/{org-list,org-members,org-switch,provider-org-switch,org-invite,account.stores,auth.controller,provider-me.controller}.ts`
- `apps/api/src/admin/admin.service.ts`, `packages/shared/auth-contracts/src/index.ts`(OrgSwitchInput)
- 관련 단위/e2e 갱신

## ✅ Definition of Done
- [x] organizations.public_id + 백필, RLS/JWT 내부 uuid 불변
- [x] org 응답 + members userId → public_id, switch 입력 public_id 해석+멤버십 검증
- [x] web 투명 호환 확인, tenant-isolation 회귀 0
- [x] walkthrough/pr_description + refute Go

## 🔗 관련
- ADR-0028 §5·0029·0024·0026, spec-26-05, 후속 26-06(나머지 root)·26-07(누출 스냅샷)
