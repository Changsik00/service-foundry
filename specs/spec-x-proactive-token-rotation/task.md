# Task List: spec-x-proactive-token-rotation

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Task 0: 브랜치 생성
- [ ] `git checkout -b spec-x-proactive-token-rotation`

## Task 1: JWT exp 디코드 유틸 + SDK 계약 (TDD)
- [ ] `decodeJwtExp(token)` 유틸 + 테스트 (Red→Green): 유효/만료/깨진 토큰
- [ ] `CoreAuthSDK.getAccessTokenExpiresAt?()` optional 추가 (auth-contracts)
- [ ] Commit: `feat(spec-x-proactive-token-rotation): jwt exp decode util + sdk contract`

## Task 2: apps/web auth-sdk 만료 추적 (TDD)
- [ ] `auth-sdk.ts`: sign/signUp/refresh accessToken 디코드 → 만료 추적 + `getAccessTokenExpiresAt()`, signOut 시 null
- [ ] 테스트: sign 후 expiry 반환 / signOut 후 null
- [ ] Commit: `feat(spec-x-proactive-token-rotation): track access token expiry in web sdk`

## Task 3: AuthProvider 선제 갱신 타이머 (TDD)
- [ ] `provider.tsx`: exp-margin 타이머 → refresh → 재스케줄, cleanup. getAccessTokenExpiresAt 없으면 비활성
- [ ] 테스트(fake timers): 타이머 발화→refresh, 재스케줄, provider 모드 비활성, signOut 정리
- [ ] Commit: `feat(spec-x-proactive-token-rotation): proactive refresh timer in AuthProvider`

## Task 4: 탭 재포커스 갱신 (TDD)
- [ ] `provider.tsx`: visibilitychange(visible) + 만료 임박/경과 → 즉시 refresh
- [ ] 테스트: visibility 이벤트 시 refresh 호출/미호출 분기
- [ ] Commit: `feat(spec-x-proactive-token-rotation): refresh on tab refocus`

## Task 5: Ship
- [ ] `pnpm turbo run lint typecheck test` 통과
- [ ] walkthrough.md / pr_description.md 작성 + Commit
- [ ] push + PR (base main) → CI 그린 후 merge → `sdd specx done proactive-token-rotation`
