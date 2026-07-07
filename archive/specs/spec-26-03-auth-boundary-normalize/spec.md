# spec-26-03: 외부 식별자 노출 전환 (user.id → public_id)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-03` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-03-auth-boundary-normalize` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Feature (API 계약 / 노출 전환) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

`users.public_id`(26-02)가 존재하지만 **아직 미사용**. signin/signup/refresh/oauth/`/auth/me` 응답이 여전히 내부 `users.id`(uuid PK)를 노출한다(26-01 감사). ADR-0028 의 불변식("외부 표면에 내부 uuid 0")이 users 에 대해 미충족.

### 문제점

- 응답 `user.id`(signin/signup/refresh)·`/auth/me`·oauth callback `userId` 가 내부 PK 노출.
- web(provider)이 `/auth/me` 의 `sub`(내부 id)를 "사용자 ID"로 표시 → 내부 id 가 UI 까지 노출.

### 해결 방안

외부 응답의 사용자 식별자를 **`public_id` 로 전환**한다. 외부 시각에선 `public_id` 가 곧 "the id" 이므로 응답 필드명 `id` 는 유지하되 **값만 public_id**. JWT `sub`·`AuthenticatedUser.sub`(서버 내부)는 **내부 id 그대로 유지**(사용자 결정: self-bearer 예외). sub 정규화·컨트롤러 통합은 본 spec 범위 아님(별도).

## 요구사항

1. **응답 전환**: signin/signup/refresh 의 `user.id` = `user.publicId`. `S_User.id` 스키마 `format: uuid` → `string`(public id).
2. **/auth/me (native + provider)**: 응답의 사용자 식별자를 `public_id` 로(내부 `sub` 미노출). 필드명 `id` 로 통일.
3. **oauth callback**: 응답 `userId` 값을 `public_id` 로.
4. **web 반영**: `/auth/me` 소비처(`AccountCard`·`ProfileForm`)가 새 식별자 필드 사용.
5. **JWT/verifier/sub 무변경**: `AuthenticatedUser.sub`=내부 id 유지(조인용). 토큰 발행도 무변경.
6. **ADR-0028 §1 완화**: "JWT `sub` 는 self-bearer 예외 — 내부 id 허용. 누출 불변식은 응답 body·URL 대상." 명문화.
7. **회귀 0**: 기존 e2e(native+provider) PASS. 내부 조인·인증 동작 불변.

## Out of Scope

- sub 정규화(Supabase verifier providerUid→내부 id), provider/native 컨트롤러 통합, `listForProviderUid` 제거 (→ 별도 후속 spec)
- JWT `sub` 를 public_id 로 바꾸기 (사용자 결정: 내부 id 유지)
- organizations/sessions/api-keys 식별자 (→ 26-04/05)
- memberships `userId` 노출(member table) — users public_id 상속 건이나 org 맥락 → 26-04 에서 함께

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **응답 필드명 `id` 유지(값만 public_id)** — 외부 시각에서 public_id 가 "the id". 클라 breakage 최소.
> - [ ] **ADR-0028 §1 완화**(JWT sub 예외). 26-06 누출 스냅샷은 응답 body·URL 만 검사(JWT payload 제외).

> [!WARNING]
> - [ ] **Breaking change**: API 응답의 user 식별자 값이 uuid → `usr_…`. 외부 클라가 user.id 를 내부 uuid 로 가정하면 깨짐(현 코드베이스엔 그런 사용처 없음 — user.id 가 URL/param 으로 안 감). web 동시 수정.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **응답 user.id** | `user.publicId` 값 (필드명 `id` 유지) | 외부=public_id, 클라 breakage 최소 |
| **/auth/me** | row.publicId 반환, 내부 sub 미노출 | UI 까지 내부 id 안 샘 |
| **sub (서버)** | 내부 id 유지 | 조인 동작 불변, native lookup 0 |
| **ADR §1** | JWT sub 예외 명문화 | self-bearer, 성능 |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/auth-controller.shared.ts`
- `S_User.id` `format: "uuid"` → `format: "string"`(예: `usr_…`). 빌더가 `publicId` 사용.

#### [MODIFY] `apps/api/src/auth/auth.controller.ts`
- signin/signup/refresh: `id: user.id` → `id: user.publicId`
- `/auth/me`: `{ ...currentUser, displayName }`(sub=내부 id) → `{ id: row.publicId, email, role, orgId, displayName }`

#### [MODIFY] `apps/api/src/auth/provider-me.controller.ts`
- `/auth/me` 응답 식별자 → `row.publicId`(내부 sub 미노출)

#### [MODIFY] `apps/api/src/auth/oauth.controller.ts`
- callback 응답 `userId` 값 → `publicId`

#### [MODIFY] `apps/web/src/features/account/{AccountCard,ProfileForm}.tsx`
- `data.user.sub` → 새 식별자 필드(`data.user.id`)

#### [MODIFY] `docs/adr/0028-public-id-scheme.md`
- §1 완화: JWT `sub` 예외(self-bearer, 내부 id 허용). 불변식 = 응답 body·URL.

## 검증 계획

```bash
# fresh 5434 DB
turbo run lint typecheck test
```

수동/통합 검증 시나리오:
1. signup/signin 응답 `user.id` → `^usr_[0-9A-HJKMNP-TV-Z]{26}$`, uuid 아님 — 기대: PASS
2. `GET /auth/me` 응답 식별자 = public_id, 내부 uuid 미포함 — 기대: PASS
3. 기존 auth/org/격리 e2e 회귀 0 (sub 내부 동작 불변) — 기대: PASS
4. web `AccountCard` 가 public_id 표시 (단위) — 기대: PASS

## 롤백 계획

- `git revert`. DB/state 무변경(응답 직렬화만). 운영 롤백 시 클라가 이전 uuid 형식 기대하면 재배포 필요.

## ADR 후보

- [x] ADR-0028 §1 완화(본 spec 에서 수정) — 신규 ADR 불요.

## ✅ Definition of Done

- [ ] signin/signup/refresh/oauth/`/auth/me`(native+provider) 식별자 = public_id, 내부 uuid 미노출
- [ ] web `/auth/me` 소비처 반영
- [ ] ADR-0028 §1 완화 반영
- [ ] 전체 게이트(fresh DB) 회귀 0 + walkthrough/pr_description + push
