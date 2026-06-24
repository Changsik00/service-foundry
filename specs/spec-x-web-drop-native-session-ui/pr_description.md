fix(spec-x-web-drop-native-session-ui): drop native-only session UI from provider web

## 📋 Summary

### 배경 및 목적
로컬 dev 에서 콘솔/계정의 **세션관리 카드가 `/auth/sessions` 404**. `apps/web` 은 **Supabase(provider) 인증 전용**(`env.ts` 가 SUPABASE 필수 + http-client `auth: source`)인데, native 전용 엔드포인트 `/auth/sessions` 를 호출하던 `SessionsCard` 가 데모에 잘못 포함돼 있었다. provider 모드에선 세션을 Supabase 가 관리하므로 우리 화면 대상이 아니다.

### 주요 변경 사항
- [x] `SessionsCard.tsx` 삭제
- [x] `features/account/queries.ts` 의 session 쿼리/뮤테이션/스키마 제거 (`sessionQueries`·`useRevokeSession`·`useRevokeOtherSessions`·`SessionSchema` 등)
- [x] `features/account/index.ts` + 콘솔/계정 페이지에서 SessionsCard 제거

### 타입
- **Fix (frontend 모드 정합)** · spec-x → main

## 🎯 Key Review Points
1. 제거 vs 게이트: env 가 SUPABASE 를 **필수**로 요구 → 웹은 provider 전용이라 native 세션 분기는 영구 dead → 제거가 정직.
2. 범위는 **세션만**(보고된 404). password/MFA 등 동일 클래스 점검 + `/auth/orgs` native 갭은 Icebox.

## 🧪 Verification
```bash
grep -rn "/auth/sessions" apps/web/src   # 잔여 0 (주석 제외)
turbo run lint typecheck test --filter=@apps/web   # 13/13
```
dev 웹 재컴파일 후 콘솔/계정에 세션 카드 없음 → 404 호출 소멸.

## 📦 Files Changed
### 🗑 Deleted
- `apps/web/src/features/account/SessionsCard.tsx`
### 🛠 Modified
- `apps/web/src/features/account/queries.ts` · `index.ts`
- `apps/web/src/app/(console)/page.tsx` · `(console)/account/page.tsx`

## ✅ Definition of Done
- [x] SessionsCard + 세션 쿼리 제거, 페이지 정리, 잔여 0
- [x] @apps/web lint/typecheck/test PASS

## 🔗 관련
- 잔여 모드 부정합 Icebox(`/auth/orgs` native 갭), wiring audit
