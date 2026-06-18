# Walkthrough: spec-x-console-shell

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 가드 | auth-react `RequireAuth` 재사용 | **앱 로컬 `AuthGuard` 신설** | RequireAuth 는 fallback 렌더만 (redirect 없음) — (console) 은 `/login?redirect=` 이동 필요. GuestOnly 와 대칭 |
| redirect 복귀 | 무조건 `/` | **`?redirect=` 소비 + 내부 경로 검증** | 오픈 리다이렉트 방지 (`//` 차단) |
| 사이드바 메뉴 | 멤버/조직 자리 디밍 | **대시보드 1개만** | 실화면 없는 메뉴 = filler (가드레일 #3 정신). org-screens 에서 추가 |
| 비밀번호 토글 | 앱 로컬 | **frontend-ui `PasswordInput` 승격** | 로그인·가입 2회 사용 = 승격 기준 (TOKEN.md §8). 아이콘은 인라인 SVG (lucide dep 회피) |
| 강도 표시 | 게이지 바 | **규칙 체크리스트 (✓/·) 라이브** | 두 규칙(8자+/영문+숫자)뿐 — 게이지는 과장식. 색+기호 병행 (색 단독 금지) |
| 데모 잔재 | 유지 | **health-card-client·lib/queries 삭제** | 대시보드가 RSC(health)+client(account) 하이브리드를 계승 — 구 데모는 중복 |
| http-auth e2e 2건 | 삭제 | **의도 보존 재조준** | 홈이 가드 뒤로 가며 호스트 소실 — "public 무토큰"은 단위가 커버, e2e 는 "가드가 클라 호출 0건 보장(401 스팸 방지)" + 401 재시도는 /auth/me 로 |

## 🧪 검증 결과

```
단위: 35 (web) + 22 (ui, PasswordInput 2 추가) — TDD Red→Green
e2e:  13/13 PASS (기존 10 + 로그아웃/미로그인 가드/confirm 불일치)
게이트: turbo 137/137 · knip 0 (미사용 Me 타입 제거) · depcruise ✔
```

## ✅ DESIGN §8 Audit Checklist

1. 회색 — ink 파생 유틸만 ✅ 2. 블루 — CTA·링크만, 사이드바 active 무채색 ✅
3. 경계 — ring (UserMenu 상단 구분선만 border, 테이블류 예외 준용) ✅
4. 라디우스 — 카드 12/인풋·버튼 8/메뉴 6 ✅ 5. tnum — 대시보드 수치 행 적용, keep-all 전역 ✅
6. 톤 — 이모지·감탄사 0, 에러 = 사실+행동 ✅
7. a11y — 토글 aria-label, role=alert, 라벨 상시, status dot 텍스트 병행 ✅

## 📦 Commits

1. feat: appshell + (console) 가드 + 로그아웃
2. feat: 대시보드 (계정·api 상태 실데이터)
3. feat: 비밀번호 토글·확인·강도 힌트
4. test: e2e 확장 + 데모 잔재 정리
5. docs: ship
