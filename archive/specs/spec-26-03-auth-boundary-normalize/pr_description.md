feat(spec-26-03): expose users.public_id in auth responses (id/me/oauth)

## 📋 Summary

### 배경 및 목적
`users.public_id`(26-02)를 **외부 응답에 실제 노출**해 ADR-0028 의 users 누출 불변식을 충족한다. signin/signup/refresh/oauth/`/auth/me` 의 사용자 식별자가 내부 uuid PK → `public_id`. JWT `sub`·서버 내부 식별자는 내부 id 유지(사용자 결정: self-bearer 예외).

### 주요 변경 사항
- [x] 응답 `user.id` = `public_id` (필드명 `id` 유지, 값만 교체) — signin/signup/refresh
- [x] `/auth/me`(native+provider): 식별자=public_id, 내부 `sub` 미노출. provider 는 `findById∥findByProviderUid` 로 해석
- [x] oauth callback `userId` 값 = public_id
- [x] web `/auth/me` 소비처(`AccountCard`·`ProfileForm`·MeSchema)
- [x] ADR-0028 §1/§4 완화 — JWT `sub` self-bearer 예외(불변식=응답 body·URL)

### 타입
- **Feature (API 계약 / 노출 전환)** · spec-26-03 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **JWT sub = 내부 id 유지**(완화). 응답·URL 만 public_id. native 추가 lookup 0.
2. **응답 필드명 `id` 유지, 값만 public_id** — 외부=public_id 가 "the id".
3. **회귀 blast radius**: signup `user.id` 가 uuid→public_id 로 바뀌어, 이를 내부 id 로 쓰던 e2e 4종 signup 헬퍼를 **이메일로 내부 id 해석**하도록 정정(동작 동일). /me `sub`→`id` 단언 갱신.
4. **범위=노출만**. sub 정규화·컨트롤러 통합은 후속(ADR §4 비고). org/sessions/api-keys 는 26-04/05.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- 노출 e2e + provider-me 단위 + web 단위 PASS.
- 전체: **154/154 tasks**, apps/api **348/348**, 회귀 0.

## 📦 Files Changed
- `apps/api/src/auth/{auth-controller.shared,auth.controller,provider-me.controller,oauth.service,account.stores}.ts` + 관련 e2e/단위
- `packages/backend/auth-oauth/src/account.ts`(타입)
- `apps/web/src/features/account/{queries,AccountCard,ProfileForm}.tsx` + test
- `docs/adr/0028-public-id-scheme.md`

## ✅ Definition of Done
- [x] auth 응답·/auth/me·oauth 식별자 = public_id, 내부 uuid 미노출
- [x] web 반영 + ADR §1 완화
- [x] 전체 게이트 회귀 0 + ship 산출물

## 🔗 관련
- ADR-0028, spec-26-01/02, 후속 26-04(org+RLS)·26-05(sessions/api-keys)·26-06(누출 스냅샷)
