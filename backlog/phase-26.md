# phase-26: id-scheme-public-id

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-26-{seq}-{slug}/spec.md` 에서 다룹니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-26` |
| **상태** | Planning |
| **시작일** | 2026-06-25 |
| **목표 종료일** | (미정) |
| **소유자** | dennis |
| **Base Branch** | phase-26-id-scheme-public-id (opt-in, 첫 hk-ship 시 자동 생성) |

## 🎯 배경 및 목표

### 현재 상황

식별자 체계에 두 누수가 있다 (ADR-0028 참조):
- **PK 노출** — `users.id`(uuid PK)가 API·URL·native JWT `sub` 에 직접 노출 → 내부/외부 결합.
- **`sub` 다형성** — native=내부 PK, provider=providerUid. 컨슈머 분기·쿼리 중복(`listForUserId` vs `listForProviderUid`)·식별자 의미 모호성(잠재 누수원).

### 목표 (Goal)

ADR-0028 의 3-티어 체계(내부 uuid v7 PK + 불투명 prefixed public_id + provider_uid 매핑)를 시행한다. 경계(verifier/guard)에서 식별자를 내부 `userId` 로 정규화해 컨슈머를 단일화하고, 외부 표면에 내부 uuid 가 일절 노출되지 않음을 스냅샷 테스트로 강제한다. 전 과정 기존 e2e 회귀 0, 멀티테넌트 격리 보존.

### 성공 기준 (Success Criteria)

1. `public_id` 생성기 + prefix 레지스트리 + uuidv7 default 유틸 확립 (순수 단위 테스트). 외부 노출 root 감사 리스트 확정.
2. users·organizations·api-keys·sessions 등 확정 root 에 `public_id`(UK) 도입 + 백필 마이그레이션(3-step).
3. 경계 정규화 — native JWT `sub`=public_id, guard resolve→`AuthenticatedUser.userId`(내부 PK). API 응답의 식별자=public_id. `listForUserId` 로 수렴(모드 분기 제거).
4. org RLS 정합 — interceptor 에서 active_org public→내부 id 해석, 격리 e2e 회귀 0.
5. **누출 감사 스냅샷** — API 응답·JWT 에 내부 uuid 노출 0 (불변식 안전망).
6. 전체 `turbo run lint typecheck test` + 격리 e2e 회귀 0.

## 🧩 작업 단위 (SPEC + phase-FF)

> 실질적/불확실 → **SPEC**(아래 표), 작고 가역적 → phase-FF. sdd 가 마커 사이를 자동 갱신.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-26-01` | id-util-and-audit | P1 | Merged | `specs/spec-26-01-id-util-and-audit/` |
| `spec-26-02` | users-public-id | P1 | Merged | `specs/spec-26-02-users-public-id/` |
| `spec-26-03` | auth-boundary-normalize | P? | Active | `specs/spec-26-03-auth-boundary-normalize/` |
| `spec-26-04` | org-public-id-rls | P2 | Backlog | `specs/spec-26-04-org-public-id-rls/` |
| `spec-26-05` | remaining-roots-public-id | P2 | Backlog | `specs/spec-26-05-remaining-roots-public-id/` |
| `spec-26-06` | leak-audit-snapshot | P1 | Backlog | `specs/spec-26-06-leak-audit-snapshot/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-26-01 — id 유틸 + 노출 root 감사 (안전망 선결)

- **요점**: `public_id` 생성기(prefix + base32 랜덤 128bit) + prefix 중앙 레지스트리 + uuidv7 default 헬퍼. 스키마 무변경, 순수 단위 TDD.
- **방향성**: 외부 노출되는 aggregate root 를 grep/감사로 확정(users·organizations·api-keys·sessions·invitations 후보)해 후속 spec 범위를 고정. (24-01 안전망-선결 패턴)
- **참조**: ADR-0028
- **연관 모듈**: `packages/backend/*` 신규 id 유틸, schema default

### spec-26-02 — users.public_id 도입

- **요점**: `users.public_id` 컬럼(text UK) + 백필 마이그레이션(nullable→backfill→NOT NULL UK).
- **방향성**: 마이그레이션 저널 정합(`feedback_drizzle_migration_journal`). 내부 PK·FK 무변경, public_id 는 조회/노출용 보조키.
- **참조**: ADR-0028, `feedback_drizzle_migration_journal`
- **연관 모듈**: `packages/backend/schema/src/users.ts`, drizzle migrations

### spec-26-03 — auth 경계 정규화 (식별자 단일화)

- **요점**: native JWT `sub`=public_id 로 전환, verifier/guard 가 sub(public_id 또는 providerUid)→내부 `users.id` 해석 → `AuthenticatedUser.userId`. API 응답 user 식별자=public_id. `listForProviderUid`/`listForUserId` → 단일 `listForUserId`(내부 id) 로 수렴.
- **방향성**: 직전 "경계 정규화" 논의 통합. 실 HTTP e2e 로 native+provider 양모드 회귀 0 (`feedback_isolation_test_real_path`).
- **참조**: ADR-0028 §4, ADR-0023/0026
- **연관 모듈**: `packages/nestjs/auth/*`(verifier·guard), `packages/nestjs/auth-supabase/*`, `apps/api/src/auth/org-list.service.ts`·`org.controller.ts`·`provider-org.controller.ts`

### spec-26-04 — organizations.public_id + RLS 정합

- **요점**: `organizations.public_id` + JWT `active_org`·`SET LOCAL app.current_org` 를 public→내부 id 해석으로 운반, RLS 는 내부 id 로 작동.
- **방향성**: interceptor 해석 추가, 콘솔/URL 의 org 식별자 public_id 화. 격리 e2e 필수.
- **참조**: ADR-0028 §5, ADR-0024(RLS), ADR-0026(active-org 운반)
- **연관 모듈**: `packages/nestjs/tenant/*`(interceptor), `organizations.ts`, 콘솔 라우트

### spec-26-05 — 나머지 root public_id 일괄

- **요점**: api-keys·sessions·invitations 등 확정 root 에 public_id + DTO 일괄 적용.
- **방향성**: 26-01 감사 리스트 기준. DTO/응답 식별자 public_id 화.
- **참조**: ADR-0028
- **연관 모듈**: api-key·session·invitation 컨트롤러/스토어/DTO

### spec-26-06 — 누출 감사 스냅샷 (불변식 안전망)

- **요점**: API 응답·JWT 페이로드에 내부 uuid 가 노출되지 않음을 자동 검증하는 스냅샷/스캔 테스트.
- **방향성**: 주요 엔드포인트 응답을 순회해 내부 uuid 패턴 부재 단언. 회귀 시 즉시 RED.
- **참조**: ADR-0028 §1 불변식
- **연관 모듈**: `apps/api/src/**/*.e2e.test.ts` 신규 감사 테스트

### phase-FF 예정 항목 (spec 미생성)

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| (없음 — 진행 중 추가) | | |

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| public_id 형식 | 불투명 랜덤 / ULID / uuidv7 | **불투명 랜덤+prefix** | 정보 비노출(timestamp·순서 X), 정렬성은 내부 PK(v7)에서 취함 |
| 적용 범위 | users만 / users+org / 전 root | **전 aggregate root** | org id 의 URL·JWT 노출 누수까지 제거 (단계적 시행) |
| 표기 | prefix / bare | **prefix(usr_/org_/key_)** | 로그 자기설명·타입 혼동 방지 |
| 내부 PK | v4 유지 / v7 전환 | **v7 default(신규)** | 정렬·인덱스 지역성, 기존 v4 행 호환 유지 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 양모드 식별자 정규화 후 동작 보존
- **Given**: 경계 정규화(26-03) 적용
- **When**: native·provider 양모드 auth·org e2e
- **Then**: 전부 PASS, `userId` 단일 경로
- **연관 SPEC**: spec-26-03

### 시나리오 2: org public_id + RLS 격리 보존
- **Given**: org public_id + interceptor 해석(26-04)
- **When**: tenant-isolation e2e
- **Then**: 격리 회귀 0
- **연관 SPEC**: spec-26-04

### 시나리오 3: 내부 uuid 외부 노출 0
- **Given**: 전 root public_id 적용
- **When**: 누출 감사 스냅샷(26-06)
- **Then**: 응답·JWT 에 내부 uuid 패턴 0건
- **연관 SPEC**: spec-26-06

### 통합 테스트 실행
```bash
turbo run lint typecheck test
```

## 🔗 의존성

- **선행 phase**: phase-24/25 (패키지 경계·컨트롤러 분할·보안 hotfix)
- **외부 시스템**: PostgreSQL+RLS, Supabase(provider)
- **연관 ADR**: ADR-0028(본 phase 시행), ADR-0022/0023/0024/0026

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| 경계 정규화 중 양모드 회귀 | 인증/격리 깨짐 | 26-01 유틸 선결 + 실 HTTP e2e 양모드 필수(`feedback_isolation_test_real_path`) |
| org RLS public→내부 해석 누락 | 테넌트 누수 | interceptor 해석 + 격리 e2e RED-우선 |
| 백필 마이그레이션 결함 | 컬럼 누락→런타임 500 | 저널 정합(`feedback_drizzle_migration_journal`), `db:generate` 사용 |
| 내부 uuid 잔여 노출 | 결정 무력화 | 26-06 스냅샷 불변식으로 강제 |

## 🏁 Phase Done 조건

- [ ] 성공 기준 6항 PASS (증거 기록)
- [ ] 통합 테스트 시나리오 PASS (격리 회귀 0)
- [ ] 누출 감사 스냅샷 GREEN (내부 uuid 노출 0)
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

- (phase 완료 시 작성)
