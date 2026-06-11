# spec-x-org-screens: 테넌트 스위처 + 조직 선택·멤버·초대 화면

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-org-screens` |
| **Branch** | `spec-x-org-screens` |
| **상태** | Plan Accepted |
| **Integration Test Required** | yes (full-stack e2e) |
| **작성일** | 2026-06-11 |
| **소유자** | dennis |

## 📋 배경

#137 로 provider org API 완비 (orgs/switch/members/invite/accept). DESIGN §5.8(스위처)·§6.3(조직 선택)·§6.4(초대 수락) 화면이 비어 있음 — design-md 프로젝트의 마지막 조각.

## 🎯 요구사항

1. **features/orgs** — queries(orgs/members) + mutations(switch/invite/accept), `["orgs", …]` 계층 키
2. **TenantSwitcher** (사이드바 상단, §5.8) — 아바타(`--color-tenant`)+조직명+chevron → 드롭다운(조직 행 48px: 아바타+이름+역할 caption, active 좌측 2px brand 인디케이터) → 전환 시 switch API + **콘솔 쿼리 전체 invalidate** (ADR-0026: 토큰 불변)
3. **/orgs 선택 화면** (§6.3) — (auth) 골격 재사용. 복수 조직 시에만 의미 — 행 48px, hover, 클릭 전환→콘솔. "새 조직 만들기"는 **생성 API 부재로 생략** (filler 금지 — Out of Scope 명시)
4. **멤버 페이지 /members** (§5.4 Table) — 사이드바 메뉴 추가. 테이블(이메일/역할 배지/userId), **초대 폼** (이메일+역할 → invite API, 403=권한 인라인). Table·Badge 컴포넌트 fill-forward 생성
5. **/invite/[token] 수락** (§6.4) — 로그인 분기(비로그인→login?redirect=), 수락→해당 org 콘솔, 만료/무효 카드 내 에러
6. **e2e** — 스위처 표시·전환 / 멤버 목록+초대(메일 발송은 mock 불가 — 초대 생성 200 까지) / 초대 수락 풀플로우(fixtures 로 두 유저)

## 🚫 Out of Scope

- 조직 생성/이름변경/멤버 제거 API·화면 (API 부재 — 후속)
- Dialog 컴포넌트 (초대 폼은 인라인 — 모달 불필요)
- 초대 이메일 실수신 검증 (notifier 는 콘솔 로그 — invite 200 + DB row 로 검증)

## ✅ DoD — e2e (기존 13 + 신규) PASS · 게이트 GREEN · Audit Checklist · ship + PR
