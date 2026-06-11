# Walkthrough: spec-x-org-screens

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 전환 후 갱신 | 키별 invalidate / 전체 | **`invalidateQueries()` 전체** | ADR-0026 토큰 불변 — org 스코프 데이터 전부가 무효 |
| DropdownMenu·Table·Badge | 직접 구현 / shadcn(Radix) | **fill-forward 생성 (TOKEN.md §6 스펙)** | 첫 실수요 발생. Radix = a11y 위임 (FRONT §6.2) |
| CardCanvas | (auth) layout 내 유지 | **components/ 승격** | /orgs 가 2회째 사용 — 승격 기준 충족 |
| 역할 선택 | Select 컴포넌트 | **네이티브 select** | 옵션 2개 — 컴포넌트 생성은 filler |
| "새 조직 만들기" | 디밍 버튼 | **생략** | 생성 API 부재 — filler 금지 |
| 초대 수락 성공 e2e | DB 픽스처(pg dep+hash 재현) | **단위 3건 + 무효토큰 실HTTP 로 대체** | 토큰이 메일에만 존재(DB 는 해시) — 수락 코어는 api 단위·native e2e(C-4/C-5)가 기커버. pg dep 추가 비용 > 증분 가치 |
| 초대 preview(조직명 표시) | api 추가 | **생략 — 후속** | §6.4 부제의 조직명은 preview 엔드포인트 필요 — 본 spec 범위 밖 (코드 주석 기록) |

## 🔍 발견 — dev/web-e2e 의 RLS 우회 (Icebox 등록)

멤버 e2e 에서 타 org 행 노출 → 원인: dev·CI(web e2e) DATABASE_URL 이 postgres **superuser** — RLS 가 통째로 비활성 (코드 버그 아님, 환경). 격리 검증은 runtime role 을 쓰는 api e2e(spec-17-08)가 담당. dev 를 app_runtime role 로 전환하는 항목 Icebox 등록.

## 🧪 검증 결과

```
단위: web 42 (TenantSwitcher 2 / InviteForm 2 / InviteAccept 3 신규 — TDD) + ui 22
e2e:  18/18 PASS — 신규 5 (스위처 표시 / orgs 선택→콘솔 / 멤버 행+초대 전송 /
      초대 비로그인 분기(redirect 보존) / 무효 토큰 실HTTP 에러)
게이트: turbo 전 패키지 GREEN · knip 0 · depcruise ✔
디버깅: vitest @ alias 부재(추가) / Radix 트리거 jsdom click 미반응(keyboard 오픈) /
        getByText strict 위반(행 스코프)
```

## ✅ DESIGN §8 Audit Checklist

1. 회색 ink 파생만 ✅ 2. 블루 — active 인디케이터·링크만 ✅ 3. ring 경계 (테이블 내부 border 예외) ✅
4. 라디우스 위계 (배지만 pill — 버튼 아님) ✅ 5. userId tnum ✅ 6. 톤 — 사실+행동 카피 ✅
7. a11y — Radix 위임 + 아바타 aria-hidden + 트리거 aria-label ✅

## 📦 Commits

1. feat: features/orgs + 테넌트 스위처 (+ DropdownMenu, vitest @ alias)
2. feat: 조직 선택·멤버·초대 화면 (+ Table·Badge·CardCanvas 승격)
3. feat: 초대 수락 화면 (+ SignupForm redirect 소비)
4. test: org e2e 5종 + RLS 우회 Icebox + ship
