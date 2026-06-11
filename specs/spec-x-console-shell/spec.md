# spec-x-console-shell: 콘솔 셸 (AppShell+로그아웃) + 대시보드 + auth 폼 보강

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-console-shell` |
| **Branch** | `spec-x-console-shell` |
| **상태** | Plan Accepted |
| **타입** | Feature |
| **Integration Test Required** | yes (Playwright full-stack e2e) |
| **작성일** | 2026-06-11 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

#135 리뷰 피드백 (dennis, 2026-06-11):
- 로그아웃 없음 / `/` 가 옛 헬스카드 데모 그대로 — 콘솔 셸(사이드바·유저 메뉴) 부재
- 회원가입 너무 단순 — DESIGN §6.1 의 비밀번호 표시 토글 누락, 확인 필드 없음
- "실제 필요한 구현에 가깝게"

## 🎯 요구사항

1. **AppShell + (console) 그룹** (DESIGN §5.8)
   - 사이드바 240px `#f6f5f4`: 상단 워드마크, 메뉴(대시보드), **하단 유저 영역(이메일 + 로그아웃)**
   - active 메뉴 = 무채색 `surface-selected` (blue 금지)
   - 콘텐츠: max-w 1200, 페이지 패딩 32px
   - **RequireAuth 가드** — 미로그인 → `/login?redirect=<path>` (그룹 layout 1곳)
2. **대시보드 `/`** — 헬스카드 데모 제거. 페이지 헤더("대시보드") + 실데이터 카드만:
   - 내 계정 (`GET /auth/me`: sub·role·orgId — http-client requiresAuth 경유)
   - API 상태 (health) — 기존 RSC+클라이언트 하이브리드 패턴은 유지하되 셸 안으로
   - filler 통계 카드 금지 (가드레일 #3)
3. **로그아웃** — 유저 메뉴에서 signOut → `/login`
4. **auth 폼 보강**
   - 비밀번호 **표시 토글** (로그인·가입, §6.1 누락분) — icon-only 버튼 aria-label 필수
   - 가입: **비밀번호 확인 필드** (불일치 인라인) + 강도 힌트 (8자+ / 영문+숫자 조합 표시)
5. **e2e 확장** — 로그아웃 / 미로그인 `/` 접근 → login redirect / 가입 confirm 불일치 인라인

## 🚫 Out of Scope

- 멤버/조직 메뉴 실화면 → spec-x-org-screens (메뉴에 자리만 안 만들고 생략 — filler 금지)
- MFA UI·email-verify 분기 (Icebox 조건: Confirm ON 복귀와 함께) / 다크모드
- 서버측 비밀번호 정책 강화 (Supabase 프로젝트 설정 영역)

## ✅ Definition of Done

- [ ] 단위 (RHF 검증 경로) + e2e (기존 10 + 신규) PASS, 전 게이트 GREEN
- [ ] DESIGN §8 Audit Checklist 자가검증
- [ ] ship + push + PR
