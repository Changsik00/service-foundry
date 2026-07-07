# phase-24: refactor-hardening-2

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-24-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-24` |
| **상태** | Done (2026-06-23, PR #178) |
| **시작일** | 2026-06-19 |
| **목표 종료일** | 2026-06-23 |
| **소유자** | dennis |
| **Base Branch** | `phase-24-refactor-hardening-2` (opt-in, 첫 hk-ship 시 자동 생성) |

## 🎯 배경 및 목표

### 현재 상황

phase-23(refactor-hardening) 1차에서 7차원 코드 감사(2026-06-18, `backlog/queue.md` "🛠 리팩토링 감사 인벤토리")의 핫패스(A1~A4)·전역 에러 필터(B)·상수화(C)·일부 중복(D1/D5)·auth.controller 분할(F1)·enum(F3/F4) 을 처리했다. 그러나 **아키텍처급 패키지 이관(E)**, **account.controller 분할(F2)**, **컨트롤러 테스트 부채(G)**, **zod 패턴 통일(B2)**, **팩토리 중복 제거(D2/D3/D4/D6)** 가 이월됐고, phase-23 회고(/hk-phase-review)에서 잔여 Warning(Wa/Wb/Wd/We/Wf)이 추가로 식별됐다.

특히 G(테스트 부채)는 이후 이관·분할 작업의 **회귀 안전망**이라 선결되어야 하며, E(이관)는 50+ 파일에 걸친 cross-cutting 변경이라 단독 phase 의 신중한 진행이 필요하다.

### 목표 (Goal)

이월된 구조 개선과 회고 잔여 결함을 **테스트 안전망 선결 → 결함 수정 → 분할 → 패키지 이관** 순으로 정리해, 무테스트 컨트롤러를 가드로 덮고 도메인/인프라 코드를 재사용 가능한 패키지 경계로 옮긴다. 모든 변경은 기존 e2e 회귀 0 을 전제로 한다.

### 성공 기준 (Success Criteria) — 정량 우선

1. phase-23 G 대상 무테스트 모듈(~11) 중 컨트롤러/서비스 핵심 경로에 단위 테스트 추가 — 신규 테스트 전부 PASS.
2. 회고 잔여 Warning(Wa/We/Wf) 해소 — empty-secret fail-fast, role 런타임 검증, ADR-0027 문서화 완료.
3. `account.controller.ts`(277 LOC) 책임 분리 — 단일 컨트롤러 LOC 200 이하.
4. RLS tenant infra(E1, spec-24-05) 패키지 이관 후 기존 격리 e2e(spec-17-08 경로) 전부 PASS — 회귀 0.
5. 전체 `turbo run test` / lint / typecheck PASS — 회귀 0.

## 🧩 작업 단위 (SPEC + phase-FF)

> 본 절은 phase 의 *작업 지도* 입니다. 실질적/불확실 → **SPEC**(아래 표), 작고 가역적인 1–2 commit → **phase-FF**(맨 아래 목록).
> SPEC 은 *요점 + 방향성 + 참조* 까지만. 자세한 spec/task 는 `specs/spec-24-{seq}-{slug}/` 에서 작성.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-24-01` | controller-test-net | P1 | Merged | `specs/spec-24-01-controller-test-net/` |
| `spec-24-02` | retro-defects | P2 | Merged | `specs/spec-24-02-retro-defects/` |
| `spec-24-03` | account-controller-split | P2 | Merged | `specs/spec-24-03-account-controller-split/` |
| `spec-24-04` | zod-validation-unify | P2 | Merged | `specs/spec-24-04-zod-validation-unify/` |
| `spec-24-05` | tenant-infra-package | P1 | Merged | `specs/spec-24-05-tenant-infra-package/` |
| `spec-24-06` | drizzle-schema-package | P1 | Merged | `specs/spec-24-06-drizzle-schema-package/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`
> sdd가 ship 시 자동으로 `Merged`로 갱신합니다. `In Progress`는 active spec에 자동 마킹됩니다.

### spec-24-01 — 컨트롤러 테스트 안전망 (G)

- **요점**: phase-23 회귀 안전망 선결. 무테스트 모듈에 단위 테스트를 깐다.
- **방향성**: account/mfa/oauth/passkey/session/org 컨트롤러 + mfa.service/oauth.service/jwt.service 핵심 경로를 단위 테스트로 덮는다. Wb(account.stores 테스트 독립성)·Wd(route-inventory DI 미검증) 교훈 반영 — 신구현 거울이 아닌 동작 가드. 실DB 필요 경로는 범위 명시 후 분리.
- **참조**:
  - `backlog/queue.md` "🛠 리팩토링 감사 인벤토리" §G, phase-23 회고 §Wb/Wd
  - `reference_route_inventory_pattern` (라우트+가드 리플렉션 스냅샷)
- **연관 모듈**: `apps/api/src/auth/**/*.controller.ts`, `*.service.ts`

### spec-24-02 — 회고 잔여 결함 묶음 (Wa/We/Wf)

- **요점**: phase-23 회고 Warning 중 작은 결함 번들 처리.
- **방향성**: Wa `oauth.service.getClientId/Secret` 설정된 provider 에 env 없으면 `?? ""` 조용한 빈 시크릿 → fail-fast(throw). We role enum 컴파일타임 캐스트만 → 런타임 검증 추가. Wf AppError 필터 5xx→4xx 의미변경을 ADR-0027 에 문서화.
- **참조**:
  - phase-23 회고 §Wa/We/Wf, `docs/decisions/ADR-0027-*` (AppError 전역 필터)
- **연관 모듈**: `apps/api/src/auth/oauth/oauth.service.ts`, role enum, `ADR-0027`

### spec-24-03 — account.controller 분할 (F2)

- **요점**: 277 LOC account.controller 를 책임별로 분리(이메일 변경 추출).
- **방향성**: EmailChangeController(이메일 변경 request/confirm, EmailChangeService) 추출 → AccountController 는 password/profile/delete/avatar(AccountService)만. F1(auth.controller 3분할, spec-23-06) 패턴 재사용. `auth.module` + `provider-auth.module` 양쪽 등록 갱신 + route-inventory 스냅샷 보존. **spec-24-01 안전망 위에서 수행.**
- **참조**:
  - `backlog/queue.md` 감사 §F2, spec-23-06 (auth.controller 3분할 선례), `reference_route_inventory_pattern`
- **연관 모듈**: `apps/api/src/auth/account.controller.ts`, `auth.module.ts`, `provider-auth.module.ts`

### spec-24-04 — 컨트롤러 zod 검증 패턴 통일 (B2)

- **요점**: 컨트롤러 검증 3패턴(`zodPipe`/`parseOr400`/raw `.parse()`)을 표준 `zodPipe` 로 수렴.
- **방향성**: provider-org 의 `parseOr400` 로컬헬퍼 제거, mfa(3)·passkey(2) 의 raw `.parse()`+try/catch 를 `zodPipe` 로 치환. 기존 BadRequest 매핑 동작 보존. (account 는 분할 후 별도 — zod 부재라 통일 대상 아님, 필요 시 후속.)
- **참조**:
  - `backlog/queue.md` 감사 §B2, `docs/decisions/ADR-0010-*` (Result parse), `auth-controller.shared.ts` (`zodPipe`)
- **연관 모듈**: `provider-org.controller.ts`, `mfa.controller.ts`, `passkey.controller.ts`

### spec-24-05 — RLS tenant infra 패키지 이관 (E1)

- **요점**: `apps/api/infra/tenant.*` 의 RLS tenant 인프라를 backend+nestjs 패키지로 이관(worker 재사용 가능).
- **방향성**: tenant interceptor/ALS tx/SET LOCAL 흐름을 platform-agnostic core(`packages/backend/*`) + nestjs adapter(`packages/nestjs/*`) 로 분리(ADR-0015/0016 패턴). 이관 후 격리 e2e(spec-17-08 실 HTTP 경로) 회귀 0 필수.
- **참조**:
  - `backlog/queue.md` 감사 §E1, `docs/adr/0024-tenant-isolation-enforcement.md`
  - `feedback_platform_agnostic_packages`, `feedback_isolation_test_real_path`
- **연관 모듈**: `apps/api/infra/tenant.*` → `packages/backend/*` + `packages/nestjs/*`

### spec-24-06 — Drizzle 스키마 패키지 이관 (E2)

- **요점**: `apps/api/infra/schema/*` Drizzle 스키마를 `packages/backend/schema` 로 이관(50+ 파일).
- **방향성**: org 도메인 경계 정리 선결. 마이그레이션 저널 정합 유지(`feedback_drizzle_migration_journal`). 규모가 크므로 spec-24-05 결과 보고 후 §11.3 재검증으로 범위 확정 — 필요 시 분할.
- **참조**:
  - `backlog/queue.md` 감사 §E2, `feedback_drizzle_migration_journal`
- **연관 모듈**: `apps/api/infra/schema/*` → `packages/backend/schema`

> **후속 후보(미배치)**: D2/D3/D4/D6 팩토리 중복 제거, E3(provision·org 도메인 분리)/E4(superuser-guard·feature-flag·cookie/csrf 패키지화). spec-24-05/06 진행 결과를 보고 phase 내 추가 spec 또는 다음 phase 로 판단.

### phase-FF 예정 항목 (spec 미생성)

> 작고 가역적인 1–2 commit 항목. spec 산출물 없이 phase base 브랜치에 직접 커밋(phase-FF, → ADR-004). 착수 시 §11.3 재검증으로 크기 재확인, 커지면 SPEC 승격. (draft)

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| A5 목록 limit | org-list·feature-flag 목록 쿼리 limit 부재 보강 | 1 |
| B4 worker logger | worker `console.*` → logger 치환 | 1 |
| knip ignore 정리 | 배선 완료된 `@repo/backend-auth-rate-limit` ignore 잔존 제거(phase-15 W4) | 1 |

## 📌 결정 기록 (Review)

> Phase PR review 중 발생한 결정·합의·발견을 누적 (→ agent.md §6.3.2). PR body 동기화는 `gh pr edit --body-file`.

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| B2 분리 (24-03) | F2+B2 한 spec / 분리 | 분리 → 24-04 | 파일 비중복·단일 관심사 |
| E2 스키마 경계 (24-06, auto) | 스키마+마이그레이션 통째 / 스키마만 | 스키마 소스만 패키지, migrations+config apps/api 잔류 | 저널 정합·deploy 관심사 |
| E2 파일 이동 (24-06, auto) | 복사 / git mv | git mv | 히스토리 보존 |
| 보안 누수 대응 (회고) | 이월 / 즉시 hotfix | 즉시 hotfix(spec-x #179) | cross-tenant 이메일 노출은 deferral 불가 |

## 🧪 통합 테스트 시나리오 (간결)

> 본 phase 는 리팩토링/하드닝 중심이라 통합 테스트의 핵심은 **회귀 0** 검증이다.

### 시나리오 1: 패키지 이관 후 멀티테넌트 격리 유지
- **Given**: spec-24-05 로 RLS tenant infra 가 패키지로 이관된 상태
- **When**: 실 HTTP(토큰→guard→interceptor→RLS) 경로로 cross-org 접근 시도
- **Then**: spec-17-08 격리 e2e 시나리오 전부 PASS (격리 회귀 0)
- **연관 SPEC**: spec-24-05, spec-24-06

### 시나리오 2: 컨트롤러 분할/검증 통일 후 동작 보존
- **Given**: spec-24-03 으로 account.controller 분할 + zod 통일 적용
- **When**: 계정 관련 e2e(이메일 변경·아바타·프로필) 실행
- **Then**: 기존 엔드포인트 동작·검증 응답 보존, 신규 컨트롤러 단위 테스트 PASS
- **연관 SPEC**: spec-24-01, spec-24-03

### 통합 테스트 실행
```bash
turbo run test
turbo run lint typecheck
```

## 🔗 의존성

- **선행 phase**: phase-23 (refactor-hardening 1차)
- **외부 시스템**: 기존 스택과 동일 (PostgreSQL + RLS, Supabase 등)
- **연관 ADR**:
  - `docs/adr/0024-tenant-isolation-enforcement.md`
  - `docs/decisions/ADR-0010-*` (Result parse), `ADR-0015/0016` (패키지/어댑터 경계), `ADR-0020` (AppError), `ADR-0027` (전역 AppError 필터)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| E 이관 중 RLS 격리 깨짐 | 보안(테넌트 누수) | 이관 전 spec-24-01 안전망 + 이관 후 실 HTTP 격리 e2e 필수(`feedback_isolation_test_real_path`) |
| Drizzle 스키마 이관 시 마이그레이션 저널 drift | CI 500/컬럼 누락 | `db:generate` 사용, `_journal.json` 정합 확인(`feedback_drizzle_migration_journal`) |
| 테스트가 신구현 거울이 되어 독립성 상실(Wb) | 거짓 GREEN | 동작 가드로 작성, 가드 대상 코드와 동일 커밋 재작성 금지 |
| E 범위 과대(50+ 파일) | 일정 지연 | §11.3 재검증으로 spec-24-06 범위 확정, 필요 시 분할/후속 phase 이월 |

## 🏁 Phase Done 조건

- [x] 모든 SPEC 이 merge (base branch 모드: `phase-24-refactor-hardening-2` → main, PR #178)
- [x] 통합 테스트 전 시나리오 PASS (격리 회귀 0)
- [x] 성공 기준 정량 측정 결과 (하단 "검증 결과" 섹션에 기록)
- [x] 사용자 최종 승인 (2026-06-23 Go)

## 📊 검증 결과 (phase 완료 시 작성)

- **성공 기준**: 5/5 PASS — 무테스트 컨트롤러 8개 단위+route-inventory(24-01) / Wa·We·Wf(24-02) / account.controller 188 LOC<200(24-03) / RLS 이관 후 격리 e2e 6/6(24-05) / 전체 `turbo run lint typecheck test` **151/151 task**.
- **통합 테스트**: 2/2 — 멀티테넌트 격리 유지(tenant-isolation.http.e2e, 실 HTTP) / 컨트롤러 분할·검증 후 동작 보존(account·email-change e2e).
- **신규 패키지 3**: `@repo/backend-tenant`, `@repo/nestjs-tenant`, `@repo/backend-schema`.
- **회고**: `docs/review/2026-06-23-phase-24-review.md` — 보안 패널이 cross-tenant 누수 발견 → hotfix `spec-x-null-org-isolation-failclose`(#179) 로 해소.
