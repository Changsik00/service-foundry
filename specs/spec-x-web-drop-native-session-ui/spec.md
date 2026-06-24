# spec-x-web-drop-native-session-ui: 웹에서 native 전용 세션관리 UI 제거 (모드 정합)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-web-drop-native-session-ui` |
| **Branch** | `spec-x-web-drop-native-session-ui` |
| **Base 브랜치** | `main` |
| **타입** | Fix (frontend 정합) |
| **작성일** | 2026-06-24 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (로컬 dev 확인)

`apps/web` 은 **Supabase(provider) 인증 전용**이다 — `src/env.ts` 가 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 를 **필수**로 요구하고, http-client 가 `auth: source`(Supabase 토큰)로 배선됨. 그런데 콘솔/계정 화면의 **`SessionsCard`** 가 native 전용 엔드포인트 `GET/DELETE /auth/sessions` 를 호출한다.

→ provider 모드에선 세션/기기 관리를 **Supabase 가 담당**하고 우리 API 는 `/auth/sessions`(native 전용)를 노출하지 않으므로, 웹의 세션관리 카드가 **항상 404**. 데모 예시 부정합.

### 해결 방안

이 웹(provider 전용)에서 **native 전용 세션관리 UI·쿼리를 제거**한다. (세션은 Supabase 가 관리 — 우리 화면에서 다룰 대상 아님.) 향후 native 모드 웹을 지원하려면 env optional + 모드 분기가 필요한 별도 큰 작업이며 본 spec 범위 밖.

## 요구사항

1. `SessionsCard` 를 콘솔(`(console)/page.tsx`)·계정(`(console)/account/page.tsx`)에서 제거.
2. `SessionsCard.tsx` + `features/account/queries.ts` 의 세션 관련(`sessionQueries`·`useRevokeSession`·`useRevokeOtherSessions`·Session 스키마/타입) 제거.
3. `features/account/index.ts` export 정리.
4. 잔여 참조 0, 웹 lint/typecheck/test PASS.

## Out of Scope

- native 모드 웹 지원(env optional + 모드 분기 + native 토큰 소스) — 큰 작업, 별도.
- `/auth/orgs` native 갭(별 Icebox 항목), password/MFA/passkey 등 다른 native-전용 UI 점검 — 본 spec 은 **세션**만(보고된 404). 동일 클래스 점검은 follow-up.

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| (console)/page·account/page | `SessionsCard` import·렌더 제거 |
| SessionsCard.tsx | 삭제 |
| account/queries.ts | session 쿼리/뮤테이션/스키마 제거 |
| account/index.ts | export 제거 |

## Proposed Changes

#### [DELETE] `apps/web/src/features/account/SessionsCard.tsx`
#### [MODIFY] `apps/web/src/features/account/queries.ts` — session 관련 제거
#### [MODIFY] `apps/web/src/features/account/index.ts` — SessionsCard export 제거
#### [MODIFY] `apps/web/src/app/(console)/page.tsx` · `(console)/account/page.tsx` — SessionsCard 사용 제거

## 검증 계획

```bash
grep -rn "SessionsCard\|sessionQueries\|/auth/sessions" apps/web/src   # 잔여 0
npx turbo run lint typecheck test --filter=@apps/web
```

수동: 콘솔/계정 화면에 더 이상 세션 카드 없음 → 404 호출 사라짐.

## 롤백 계획

- `git revert`. UI 제거뿐.

## ✅ Definition of Done

- [ ] SessionsCard + 세션 쿼리 제거, 페이지에서 제거, 잔여 참조 0
- [ ] @apps/web lint/typecheck/test PASS
- [ ] walkthrough/pr_description ship + push
