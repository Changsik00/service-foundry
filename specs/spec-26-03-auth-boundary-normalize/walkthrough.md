# Walkthrough: spec-26-03

> 외부 식별자 노출 전환 — auth 응답·/auth/me 의 user.id → public_id. JWT sub 는 내부 id 유지.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| JWT `sub` 정책 | public_id / **내부 id 유지** | **내부 id 유지** | self-bearer(타인 비노출). public_id 화 시 native 매 요청 lookup. ADR §1 완화 |
| 응답 필드명 | `publicId` 신설 / **`id` 값만 교체** | **`id`=public_id 값** | 외부 시각에서 public_id 가 "the id", 클라 breakage 최소 |
| 26-03 범위 | 노출+sub정규화 / **노출만** | **노출만** | sub 정규화·컨트롤러 통합은 위험·횡단 → 후속 spec |
| provider /me 해석 | sub만 / **findById∥findByProviderUid** | **fallback 해석** | provider sub=providerUid 도 public_id 반환(모드 무관 일관) |

## 💬 사용자 협의

- "내부엔 pk, 외부엔 id" 확인 → JWT sub 예외 + 노출만 범위로 합의("1").

## 🧪 검증 결과

- e2e(노출): signup `user.id`=`usr_…`(uuid 아님), `/auth/me` 식별자=public_id·내부 `sub` 미노출.
- provider-me 단위: findById→fallback(findByProviderUid)→null 폴백 3 케이스.
- **회귀 blast radius 처리**: signup 응답 `user.id` 가 내부 uuid→public_id 로 바뀌어, 이를 내부 id 로 쓰던 e2e 4종(users-public-id·tenant-isolation·email-change·account)의 signup 헬퍼를 **이메일로 내부 id 해석**하도록 정정. auth.controller/auth.e2e 의 /me `sub` 단언을 `id` 로 갱신.
- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, apps/api **348/348**, web 포함 회귀 0.

## 🔧 변경

- `auth-controller.shared.ts` S_User.id format string(public_id).
- `auth.controller.ts` signin/signup/refresh `id=user.publicId`; `/auth/me` → `{id: publicId, email, role, orgId, orgRole, displayName}`(내부 sub 미노출).
- `provider-me.controller.ts` findById∥findByProviderUid → publicId.
- `account.stores.ts` `AccountUserProfile`(+publicId) + `findByProviderUid`.
- `oauth.service.ts` callback `userId`=publicId; `OAuthUserRow`+publicId(타입).
- web `queries.ts`(MeSchema id/email)·`AccountCard`·`ProfileForm`.
- ADR-0028 §1/§4 완화(JWT sub 예외).

## 🚧 이월

- **sub 정규화**(Supabase verifier providerUid→내부 id) + provider/native 컨트롤러 통합 + `listForProviderUid` 제거 → 후속 spec 후보(ADR §4 비고).
- org/sessions/api-keys 식별자·member table `userId` → 26-04/05. 전체 uuid 부재 스냅샷 → 26-06.
