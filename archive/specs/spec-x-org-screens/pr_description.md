# spec-x: 테넌트 스위처 + 조직 선택·멤버·초대 화면

## 목적

#137 provider org API 의 소비자 — design-md 프로젝트 화면의 마지막 조각 (DESIGN §5.8 / §6.3 / §6.4).

## 변경 내용

### 1. features/orgs + 테넌트 스위처 (사이드바 상단)

- queries(orgs/members, `["orgs",…]` 계층 키) + mutations(switch/invite/accept)
- 스위처: 아바타(`--color-tenant` 슬롯 첫 실사용)+조직명+chevron → 드롭다운(행 48px, active 좌측 brand 인디케이터) → 전환 = switch API + **전체 invalidate** (ADR-0026 토큰 불변)

### 2. 조직 선택 `/orgs` + 멤버 `/members`

- /orgs: CardCanvas(2회 사용 승격) + 행 클릭 전환→콘솔. "새 조직 만들기"는 생성 API 부재로 생략 (filler 금지)
- /members: 사이드바 메뉴 추가 — 멤버 테이블(email/역할 배지/userId tnum) + 인라인 초대 폼 (403 권한 인라인)

### 3. 초대 수락 `/invite/[token]`

비로그인 → 가입/로그인 분기(redirect 보존, SignupForm 도 ?redirect= 소비 추가) / 수락 → 해당 org 콘솔 / 만료·중복·이메일 불일치 사실+행동 에러

### 4. frontend-ui fill-forward 4종

DropdownMenu(Radix — a11y 위임) · Table · Badge · (CardCanvas 는 앱 레벨) — 전부 TOKEN.md §6 스펙

## 발견 — Icebox 등록

dev·web-e2e 의 DATABASE_URL 이 superuser 라 **RLS 미적용** (격리는 api e2e spec-17-08 이 runtime role 로 검증). dev 를 app_runtime role 로 전환하는 항목 등록.

## 검증

단위 42+22 (TDD) · **e2e 18/18** (신규 5) · turbo/knip/depcruise GREEN · Audit Checklist 7항

## 후속 (Icebox/주석 기록)

조직 생성 API+화면 · 초대 preview(조직명) · dev runtime role
