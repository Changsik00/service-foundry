# Task List: spec-x-web-drop-native-session-ui

> One Task = One Commit. provider-전용 웹에서 native 세션 UI 제거.

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-x-web-drop-native-session-ui` (base: `main`)

## Task 2: native 세션 UI/쿼리 제거
- [ ] `(console)/page.tsx`·`(console)/account/page.tsx` 에서 `SessionsCard` import·렌더 제거
- [ ] `features/account/index.ts` 에서 `SessionsCard` export 제거
- [ ] `features/account/SessionsCard.tsx` 삭제
- [ ] `features/account/queries.ts` 에서 session 쿼리/뮤테이션/스키마(`sessionQueries`·`useRevokeSession`·`useRevokeOtherSessions`·SessionSchema 등) 제거
- [ ] `grep /auth/sessions apps/web/src` → 잔여 0
- [ ] `turbo run lint typecheck test --filter=@apps/web` PASS
- [ ] Commit: `fix(spec-x-web-drop-native-session-ui): drop native-only session UI from provider web`

## Task 3: Ship
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-x-web-drop-native-session-ui): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-x-web-drop-native-session-ui`
- [ ] PR 생성 (base: `main`)
