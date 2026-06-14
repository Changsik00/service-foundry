# phase-21: 어드민 + 빌링

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-21-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-21` |
| **상태** | In Progress |
| **시작일** | 2026-06-14 |
| **목표 종료일** | — |
| **소유자** | changsik |
| **Base Branch** | phase-21-admin-billing |

## 🎯 배경 및 목표

### 현재 상황

phase-20 완료로 멤버 목록 검색·필터·페이지네이션까지 구현됐다. 그러나 운영자가 전체 조직/유저를 관리할 수단이 없고, 플랜별 기능 게이팅·빌링 흐름이 미구현이다.

### 목표 (Goal)

수퍼어드민이 조직·유저를 조회·관리할 수 있고, 피처플래그로 기능을 제어할 수 있는 상태. 빌링은 Stripe 연동 기반 org 구독 플랜을 최소 구현한다.

### 성공 기준 (Success Criteria) — 정량 우선

1. 어드민 API: 전체 조직 목록 + 특정 조직 멤버 조회 e2e PASS
2. 피처플래그 API: 플래그 on/off 설정 + 가드 적용 e2e PASS
3. 빌링: Stripe Checkout 세션 생성 + webhook 수신 e2e PASS (test mode)
4. 프론트엔드: 어드민 패널 기본 화면 + 피처플래그 관리 UI 동작

## 📐 Spec 계획

> SPEC 은 *요점 + 방향성 + 참조* 까지만 적습니다. 자세한 spec/plan/task 는 `specs/spec-21-{seq}-{slug}/` 에서 작성합니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### 예정 Spec 목록

| 순서 | 슬러그 | 설명 |
|---|---|---|
| spec-21-01 | admin-panel | 수퍼어드민 조직·유저 조회 API + 어드민 패널 UI |
| spec-21-02 | feature-flags | 피처플래그 설정 API + 가드 + 관리 UI |

> Stripe 빌링은 optional — Icebox 이동 (원래 "(선택)" 항목, 복잡도 대비 당장 필요 없음)

## 📎 참조

- phase-17: 멀티테넌시 Foundation (RLS, tenant context)
- phase-19: RBAC RolesGuard, API Key
- ADR-0022: 멀티테넌트 SaaS 로드맵
