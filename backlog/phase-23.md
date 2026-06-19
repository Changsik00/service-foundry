# phase-23: refactor-hardening

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-23-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-23` |
| **상태** | In Progress |
| **시작일** | 2026-06-18 |
| **목표 종료일** | (미정) |
| **소유자** | dennis |
| **Base Branch** | 없음 (non-base — 각 spec PR → main) |

## 🎯 배경 및 목표

### 현재 상황
2026-06-18 7차원 리팩토링 감사(`backlog/queue.md` 🛠 인벤토리)에서 코드는 대체로 건전하나 다수의 개선 대상이 식별됐다. 첫 퀵윈(`spec-x-refactor-tidy`, behavior-preserving 상수/중복)은 머지됐고, 남은 항목은 **동작에 영향을 주거나(핫패스), 회귀 안전망이 필요하거나, 구조를 바꾸는** 작업이라 Phase 로 묶어 의존순서대로 처리한다.

### 목표 (Goal)
보안·핫패스 correctness 를 회귀 없이 개선하고, 컨벤션/중복/복잡도 부채를 정리한다. **핵심 원칙: 테스트 안전망을 먼저 깐 뒤 동작을 바꾼다.** 패키지 이관(E)은 규모·아키텍처 영향이 커 **phase-24 로 분리**한다.

### 성공 기준 (Success Criteria) — 정량 우선
1. 보안 크리티컬 무테스트 모듈(~11개: mfa/oauth.service, account/passkey/mfa.controller, jwt.service 등) 단위/통합 테스트 추가 — 각 모듈 테스트 파일 존재.
2. 핫패스 수정 검증: sole-owner 체크 단일 쿼리화(N+1 제거), API key 검증 경로에서 동기 쓰기 제거, JWKS 응답 캐시(요청당 재계산 0), 무제한 목록 쿼리 0.
3. 회귀 0 — 기존 단위/e2e 스위트가 phase 전과 동일하게 그린 유지(CI 기준).
4. 잔여 컨벤션/중복(B·C4·D) 및 복잡도(F) 정리 — `auth.controller.ts` 600+ LOC 분할, role `string`→enum.

## 🧩 작업 단위 (SPEC + phase-FF)

> 실질적/불확실 → **SPEC**(아래 표). 표는 draft — 다음 spec 전 §11.3 재검증으로 조정.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-23-01` | test-safety-net | P? | Merged | `specs/spec-23-01-test-safety-net/` |
| `spec-23-02` | hotpath-fixes | P? | Merged | `specs/spec-23-02-hotpath-fixes/` |
| `spec-23-03` | constants-and-dedup | P? | Merged | `specs/spec-23-03-constants-and-dedup/` |
| `spec-23-04` | error-handling-convention | P? | Merged | `specs/spec-23-04-error-handling-convention/` |
| `spec-23-05` | type-design | P? | Merged | `specs/spec-23-05-type-design/` |
| `spec-23-06` | controller-split | P? | Merged | `specs/spec-23-06-controller-split/` |
| `spec-23-07` | phase-review-fixes | P? | Merged | `specs/spec-23-07-phase-review-fixes/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-23-01 — test-safety-net (G)

- **요점**: 보안 크리티컬 무테스트 모듈에 단위/통합 테스트 추가 — A(핫패스 변경)의 회귀 안전망.
- **방향성**: mfa.service / oauth.service / account·passkey·mfa.controller / jwt.service 등 우선. 격리 테스트는 실 HTTP 경로 통과 원칙([[격리 e2e 실경로 필수]]) 준수, mock 우회 금지.
- **참조**: `backlog/queue.md` 🛠 인벤토리 G
- **연관 모듈**: `apps/api/src/auth/*.service.ts`, `*.controller.ts`, `apps/api/src/jwt/`

### spec-23-02 — hotpath-fixes (A)

- **요점**: 핫패스 correctness/scaling — N+1·동기쓰기·재계산·무제한쿼리 제거.
- **방향성**: A1 sole-owner 단일 집계쿼리(+early-exit) / A2 api-key `last_used_at` fire-and-forget / A3 JWKS 메모이즈(키 rotation 시 무효화 필수) / A4 signin 독립 await Promise.all / A5 org-list·feature-flag limit. 각 변경 전 23-01 테스트로 회귀 가드.
- **참조**: 인벤토리 A. ❌반려: tenant.interceptor tx 래핑은 RLS SET LOCAL 필수(유지).
- **연관 모듈**: `account.stores.ts`, `api-key.service.ts`, `jwt/jwks.controller.ts`, `signin.service.ts`, `org-list.service.ts`

### spec-23-03 — convention-and-dedup (B+C4+D)

- **요점**: 컨벤션 일관성 + 잔여 상수/중복 정리.
- **방향성**: B1 `throw new Error`→`AppError`(건별 의도 판단, 부트스트랩 fail-fast 예외) / B2 raw zod `.parse()`→`parse()` Result + 컨트롤러 검증 3패턴 통일 / C4 이메일TTL·페이지네이션·Bearer 상수 / D2~D6 dedup(verifier 헬퍼·adapter 팩토리·forRoot 팩토리·`CursorPaginationResult<T>`·guard 제네릭).
- **참조**: 인벤토리 B·C4·D. ADR-0020/0010.
- **연관 모듈**: 광범위 — 착수 시 분할 가능성 재검토.

### spec-23-04 — complexity-split (F)

- **요점**: 거대 파일/타입설계 정리.
- **방향성**: `auth.controller.ts`(639 LOC)→Auth/Session/Org 분할, `account.controller.ts` email-change/avatar 분리, role `string`→`OrgRole`/`Role` enum, `OAuthUserInfo` discriminated union.
- **참조**: 인벤토리 F.
- **연관 모듈**: `apps/api/src/auth/auth.controller.ts`, `account.controller.ts`, `org-members.service.ts`, `admin.service.ts`

> draft 순서: 23-01(G) → 23-02(A) → 23-03(B/C/D) → 23-04(F). 23-01 이 23-02 의 선결.

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| E(패키지 이관) phase 포함 여부 | 포함 / 분리 | **분리(phase-24)** | tenant infra·schema(50+파일)·org 도메인은 아키텍처급. correctness+cleanup 과 리스크·기간 분리 (2026-06-18) |
| Branch 모드 | base / non-base | **non-base** | 각 spec 이 독립적으로 가치있고 즉시 머지 가능. 절차 단순·저위험 (2026-06-18) |
| 처리 순서 | 가치순 / 의존순 | **의존순(G先)** | A 핫패스 변경의 회귀 안전망이 G. 테스트 먼저 → 동작 변경 |
| 23-03 범위 재구성 (§11.3, 2026-06-18) | B+C4+D 한 spec / 분할 | **분할** | B1 throw 15곳 중 대부분 의도적 부트스트랩 fail-fast(전환 소수), B2 는 미테스트 컨트롤러 위험 → 23-03=C4+D5(저위험), 23-04=B(컨트롤러 안전망 선행), 23-05=F |

## 🧪 통합 테스트 시나리오 (간결)

> 리팩토링 phase 의 Done 조건은 "기존 동작 보존". 기존 api e2e 스위트(실 PG + app_runtime role)가 그린 유지되는지로 검증.

### 시나리오 1: 인증 풀사이클 회귀
- **Given**: app_runtime role + 마이그레이션 적용된 e2e DB
- **When**: signup → signin → refresh → /me → org invite/accept → session revoke
- **Then**: 전 단계 기존과 동일 응답(상태코드·claim·쿠키). 핫패스 변경 후에도 불변.
- **연관 SPEC**: spec-23-01, spec-23-02

### 시나리오 2: 테넌트 격리 불변
- **Given**: org A/B 토큰
- **When**: cross-org 접근 시도
- **Then**: 기존대로 거부(spec-17-08 경로 유지) — 리팩토링이 격리를 깨지 않음.
- **연관 SPEC**: spec-23-02, spec-23-04

### 통합 테스트 실행
```bash
# api e2e (CI compose 스택 또는 로컬 app_runtime role + migrate 선행)
pnpm --filter @apps/api test
```

## 🔗 의존성

- **선행 phase**: 없음 (spec-x-refactor-tidy 머지 완료가 출발점)
- **후속 phase**: **phase-24 (패키지 이관 E)** — tenant infra·schema·org 도메인. 본 phase 와 분리.
- **외부 시스템**: PostgreSQL(app_runtime role) + Redis (e2e)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| 핫패스 변경이 동작 변경 유발 | 인증/격리 회귀 | 23-01 테스트 안전망 선결 + 시나리오1/2 회귀 |
| JWKS 캐시가 키 rotation 무효화 누락 | 토큰 검증 실패 | rotation 시 캐시 무효화 명시 + 테스트 |
| 로컬 e2e DB 미셋업으로 거짓 실패 | 검증 신뢰도 | CI compose 기준 + 로컬 app_runtime/migrate 선행 확인 |
| B1 throw→AppError 과교정 | 부트스트랩 fail-fast 손상 | 건별 의도 판단(부트스트랩은 예외 유지) |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC 이 main 에 merge (non-base)
- [ ] 통합 테스트 시나리오 1·2 PASS (회귀 0)
- [ ] 성공 기준 정량 측정 결과 기록
- [ ] 사용자 최종 승인 (`/hk-phase-ship`)

## 📊 검증 결과 (2026-06-19, /hk-phase-review 후)

### 성공 기준 정량 측정 (정직 기록)
| # | 기준 | 결과 | 측정 |
|---|---|:---:|---|
| 1 | 보안 무테스트 모듈 ~11개 테스트 | **△ 부분** | service 4개 신규(account.stores·jwt.service·mfa.service·oauth.service, 23-01/23-07 보강). **컨트롤러(account/mfa/oauth/passkey/session/org)는 미커버 → 이월**. "~11개" 미달 |
| 2 | 핫패스 (N+1·동기쓰기·JWKS캐시·무제한쿼리0) | **△ 대부분** | N+1제거✅·api-key fire-and-forget✅·JWKS 메모이즈✅(23-07 spy 검증). **무제한 limit(A5) 미적용 → 이월** |
| 3 | 회귀 0 (CI green) | **✅ 충족** | PR #165~170 전부 verify+e2e SUCCESS(gh 실측). 시나리오 1·2 e2e green |
| 4 | 컨벤션/중복/복잡도 (auth.controller 분할·role enum) | **✅ 충족** | 639→3분할(23-06)·role enum(23-05)·상수/dedup(23-03)·에러레이어링 ADR-0027(23-04). B2만 이월 |

### 통합 테스트 (시나리오 1·2)
- 로컬 e2e 는 DB 미셋업으로 미실행(위험표 인지) → **CI e2e 가 증거**: #170 e2e pass(1m54s) 등 전 머지 commit green. 인증 풀사이클·테넌트 격리 회귀 없음.

### /hk-phase-review 회고 결함 (spec-23-07 에서 수정 완료)
- C1 AppErrorFilter status 클램프 + 5xx 새니타이즈 ✅
- C2 route-inventory 에 @OrgRoles 메타 단언(권한 라우트 fail-open 회귀 가드) ✅
- 테스트 무결성: JWKS 메모이즈 실검증 + MFA verifyMfa reject/backup 경로 ✅
- C3 장부 정합성(본 갱신 + queue.md 이월 승격) ✅

### 잔여 (이월 — queue.md 🧊 인벤토리 반영)
A5·B2·D2/3/4/6·E(→phase-24)·F2·G 컨트롤러 테스트·로컬 e2e DB setup·Serena 일관.
