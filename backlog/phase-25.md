# phase-25: refactor-hardening-3

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-25-{seq}-{slug}/spec.md` 에서 다룹니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-25` |
| **상태** | Done (2026-06-24, 범위 재조정 — E3/E4 이월) |
| **시작일** | 2026-06-24 |
| **목표 종료일** | 2026-06-24 |
| **소유자** | dennis |
| **Base Branch** | `phase-25-refactor-hardening-3` (opt-in, 첫 hk-ship 시 자동 생성) |

## 🎯 배경 및 목표

### 현재 상황

phase-23(1차)·phase-24(2차)에서 핫패스·결함·컨트롤러 분할·tenant/schema 패키지 이관(E1/E2)을 처리했다. 7차원 감사(2026-06-18)와 phase-24 회고에서 **남은 구조 부채**가 이월됐다:
- **E3** — provision·org 도메인 서비스가 auth 모듈에 섞여 있음(도메인 경계 흐림).
- **E4** — superuser-guard·feature-flag·cookie/csrf 등 재사용 가능 인프라가 앱-로컬.
- **D2/D3/D4/D6** — verifier 공통 헬퍼·frontend auth 어댑터·NestJS `forRoot` DynamicModule·Roles/OrgRoles guard 중복.
- **route-inventory Wd** — 컨트롤러 미인스턴스화(리플렉션만)라 DI·가드 실행순서·body 검증 공백.

### 목표 (Goal)

남은 중복(D)을 제거하고 도메인/인프라 경계(E3/E4)를 패키지로 정리해, auth 모듈을 얇게 만들고 재사용성을 높인다. route-inventory 를 실제 DI 통과 검증으로 강화. 전 과정 기존 e2e 회귀 0.

### 성공 기준 (Success Criteria) — 정량 우선 (2026-06-24 범위 재조정)

> 진행 중 §11.3 건별 검증으로 범위를 right-size 했다: D6 채택, **D2·D4 드롭(substance 없는 묶음)**, **E3·E4 이월(구조-only·DI 수술 risk>payoff)**. 고가치(E1/E2 패키지·컨트롤러 분할·보안)는 phase-24 에서 완료.

1. ✅ route-inventory Wd 해소 — 가드 **선언 순서** 검증 + AppModule **DI-compile smoke**(이후 이관 안전망). (spec-25-01)
2. ✅ D6 가드 중복 제거 — RolesGuard/OrgRolesGuard → 공유 `checkRoles`. D2/D4 는 per-item 검증 후 드롭. (spec-25-02)
3. ⏭ **이월**: E3(provision·org 도메인 분리)·E4(인프라 패키지화)·D2 — 다음 리팩토링 phase 후보(queue Icebox). 구조-only·공유 토큰 DI 수술이라 별도 appetite 시 진행.
4. ✅ 전체 `turbo run lint typecheck test` + 격리 e2e 회귀 0.

## 🧩 작업 단위 (SPEC + phase-FF)

> 실질적/불확실 → **SPEC**(아래 표), 작고 가역적 → phase-FF. sdd 가 마커 사이를 자동 갱신.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-25-01` | route-inventory-di | P1 | Merged | `specs/spec-25-01-route-inventory-di/` |
| `spec-25-02` | factory-guard-dedup | P2 | Merged | `specs/spec-25-02-factory-guard-dedup/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-25-01 — route-inventory Wd 근본 개선 (안전망 선결)

- **요점**: route-inventory 가 컨트롤러를 실제 인스턴스화/DI 통과시켜 가드·순서·라우트를 검증.
- **방향성**: 리플렉션 스냅샷 → `Test.createTestingModule` 기반 인스턴스화 + 가드 실행순서 단언. 이후 E3/E4 이관의 회귀 안전망. (24-01 안전망-선결 패턴)
- **참조**: phase-23 §Wd, `reference_route_inventory_pattern`, phase-24 회고
- **연관 모듈**: `apps/api/src/auth/route-inventory.test.ts`

### spec-25-02 — 팩토리/가드 중복 제거 (D2/D4/D6)

- **요점**: verifier 공통 claim 추출·NestJS `forRoot` DynamicModule·Roles/OrgRoles guard 중복을 공통화.
- **방향성**: 감사 §D 항목별 건별 검증 후 공통 헬퍼/제네릭으로 수렴. 안전망(25-01) 위에서.
- **참조**: `backlog/queue.md` 감사 §D
- **연관 모듈**: nestjs/auth guards, verifier, forRoot 모듈군

### spec-25-03 — provision·org 도메인 분리 (E3) — ⏭ 이월 (2026-06-24)

> 다음 리팩토링 phase 후보. org 서비스가 공유 토큰(JWT/NOTIFIER/FRONTEND_URL)에 깊게 의존 → 모듈 추출 시 공유 config DI 수술 필요, 구조-only payoff. queue Icebox 등재.

- **요점**: provision·org 도메인 서비스를 auth 모듈에서 별 모듈/경계로 분리.
- **방향성**: 도메인 서비스 그룹화 → 모듈 분리(또는 패키지 후보). DI 회귀 0 (e2e 가드).
- **참조**: 감사 §E3
- **연관 모듈**: `apps/api/src/provision/*`, `apps/api/src/auth/org-*.service.ts`

### spec-25-04 — 인프라 패키지화 (E4) — ⏭ 이월 (2026-06-24)

> 다음 리팩토링 phase 후보(E3 와 묶어). queue Icebox 등재.

- **요점**: superuser-guard·feature-flag·cookie/csrf 중 재사용 가치 높은 1군 패키지화.
- **방향성**: E1/E2 패키지 경계 패턴(ADR-0015/0016) 재사용. spec-25-03 결과 보고 후 §11.3 으로 대상 확정.
- **참조**: 감사 §E4, ADR-0015/0016
- **연관 모듈**: `superuser-guard.provider.ts`, `feature-flag.*`, `csrf.*`/`cookie.helper.ts`

> **D3(frontend auth 어댑터 팩토리)**: frontend 변경이라 백엔드 리팩토링과 분리 — 별도 판단(본 phase 후속/Icebox).

### phase-FF 예정 항목 (spec 미생성)

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| D1 잔여 | `sleep()` 등 잔여 utils 중복 정리(있으면) | 1 |

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| (없음 — 진행 중 추가) | | | |

## 🧪 통합 테스트 시나리오 (간결)

> 리팩토링 phase — 핵심은 **회귀 0**.

### 시나리오 1: 도메인/인프라 이관 후 동작·격리 보존
- **Given**: E3/E4 분리·패키지화 적용
- **When**: 전체 e2e(auth·org·admin·tenant-isolation) 실행
- **Then**: 전부 PASS, 멀티테넌트 격리 회귀 0
- **연관 SPEC**: spec-25-03, spec-25-04

### 시나리오 2: 중복 제거 후 가드/라우트 보존
- **Given**: D 공통화 + route-inventory 강화 적용
- **When**: route-inventory + 컨트롤러 단위 + e2e
- **Then**: 라우트·가드·순서 보존
- **연관 SPEC**: spec-25-01, spec-25-02

### 통합 테스트 실행
```bash
turbo run lint typecheck test
```

## 🔗 의존성

- **선행 phase**: phase-24 (E1/E2 패키지 이관 + 보안 hotfix)
- **외부 시스템**: 기존 스택 동일 (PostgreSQL+RLS)
- **연관 ADR**: ADR-0015/0016 (패키지/어댑터 경계), ADR-0024 (tenant isolation)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| E3/E4 이관 중 DI/격리 회귀 | 런타임 깨짐·테넌트 누수 | 25-01 안전망 선결 + 이관 후 실 HTTP e2e 필수(`feedback_isolation_test_real_path`) |
| D 공통화 과도 추상화 | 가독성 저하 | 건별 검증, 억지 묶기 금지(감사 §D 주석) |
| phase 범위 과대 | 일정 지연 | §11.3 재검증으로 25-04 대상 확정, 필요 시 후속 phase 이월 |

## 🏁 Phase Done 조건

- [x] 착수 SPEC(25-01·25-02) merge (base: `phase-25-refactor-hardening-3` → main). E3/E4 는 이월.
- [x] 통합 테스트 시나리오 PASS (격리 회귀 0)
- [x] 성공 기준 정량 측정 결과 기록 (하단)
- [x] 사용자 최종 승인 (2026-06-24)

## 📊 검증 결과 (phase 완료 시 작성)

- **성공 기준**: 채택 범위 3/3 PASS — Wd 해소(가드 순서+DI smoke, 25-01) / D6 가드 dedup(25-02) / 전체 `turbo run lint typecheck test` **151/151**, 격리·rbac e2e 회귀 0.
- **범위 재조정(2026-06-24)**: D2·D4 per-item 검증 후 드롭(substance 부재), E3·E4 이월(구조-only·DI 수술 risk>payoff). queue Icebox 등재.
- **Spec**: 25-01·25-02 Merged. 25-03·25-04 이월.
