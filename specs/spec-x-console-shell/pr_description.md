# spec-x: 콘솔 셸 + 대시보드 + auth 폼 보강

## 목적

#135 리뷰 피드백 4건 반영 — "실제 필요한 구현에 가깝게": 로그아웃 부재, 헬스카드 데모 홈,
회원가입 과단순(토글·확인 없음).

## 변경 내용

### 1. AppShell + (console) 그룹 + 로그아웃 (DESIGN §5.8)

- 사이드바 240px `#f6f5f4` — 워드마크 / 메뉴(active 무채색) / **하단 유저 메뉴(이메일+로그아웃)**
- `AuthGuard` — 미로그인 → `/login?redirect=` (LoginForm 이 내부 경로 검증 후 복귀 — 오픈 리다이렉트 차단)
- 메뉴는 실화면 있는 것만 (자리용 디밍 금지 — filler 가드레일)

### 2. 대시보드 `/`

- 헬스카드 데모 제거 → **내 계정**(세션 이메일 + `GET /auth/me` sub·role·orgId, Skeleton 로딩) + **API 상태**(RSC fetch, status dot+텍스트, 가동시간 tnum)
- RSC+client 하이브리드 패턴 계승 (구 데모 파일 삭제)

### 3. auth 폼 보강

- **`PasswordInput`** (frontend-ui 승격 — 2회 사용 규칙): 표시 토글, icon-only aria-label
- 가입: **비밀번호 확인**(불일치 인라인) + **규칙 체크리스트 라이브**(8자+/영문+숫자 — 색+기호 병행), zod regex 강제

### 4. e2e — 13/13

신규: 로그아웃 / 미로그인 콘솔 → /login + **클라 API 호출 0건**(401 스팸 방지) / confirm 불일치.
재조준 2건: 홈 가드화로 호스트 소실된 public·재시도 시나리오 → 의도 보존 이전 (재시도는 /auth/me).

## 검증

단위 35+22 (TDD) · e2e 13/13 · turbo 137/137 · knip 0 · depcruise ✔ · Audit Checklist 7항 (walkthrough)
