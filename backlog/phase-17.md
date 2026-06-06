# phase-17: 멀티테넌시 Foundation + 이메일 어댑터 (Spine)

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-17-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-17` |
| **상태** | In Progress |
| **시작일** | 2026-06-06 |
| **목표 종료일** | 미정 |
| **소유자** | changsik |
| **Base Branch** | `phase-17` (spec-17-02~ 부터 적용; spec-17-01 은 main 직접 머지됨) |

## 🎯 배경 및 목표

### 현재 상황

phase-03~16 에서 인증(native/OAuth/MFA/passkey)·보안·CI/CD·서비스 기반을 완성했다. 그러나 모든 도메인 데이터가 **단일 테넌트 평면**에 있어, 이후 추가할 조직 관리·RBAC·빌링·어드민이 모두 테넌시 스코프를 전제한다. 테넌시는 교차절단 관심사 — 나중에 넣으면 모든 테이블·서비스·토큰을 재작업해야 한다.

또한 notification 포트가 stub 상태라 password-reset/email-verify 이메일이 실제로 발송되지 않는다. 이메일 어댑터는 초대 메일(phase-17 멀티테넌시 spec들의 전제)이기도 하므로 이 phase 의 첫 spec 으로 배치한다.

### 목표 (Goal)

1. 실 이메일 어댑터(Resend)를 배선해 password-reset / email-verify / 초대 메일이 실제 발송된다.
2. `organizations` · `memberships` · `invitations` 엔티티와 DB 스키마가 완성된다.
3. 기존 테이블(`users` · `sessions` · `failed_logins` · `lockouts` · audit 등)에 `org_id` + Postgres RLS 가 적용된다.
4. signup 시 개인 워크스페이스(personal org)가 자동 생성되며, **유저 프로비저닝 seam** 이 native/provider 공통 경로로 동작한다.
5. access token 에 `active_org_id` / `org_role` 클레임이 포함되고, org 전환 endpoint 와 AsyncLocalStorage→DB 세션변수 주입이 동작한다.
6. 전역 `role` 필드가 org 멤버십 role(owner/admin/member)로 의미 이동한다.

### 성공 기준 (Success Criteria) — 정량 우선

1. `POST /auth/password/forgot` → 실제 이메일 수신 (Resend 발송 로그 확인)
2. `POST /auth/signup` → `organizations` + `memberships` 행 자동 생성 (e2e 검증)
3. 기존 테이블 전체 RLS 적용 후 `SET app.current_org = 'wrong'` 시 타 org 데이터 접근 불가 (DB-level 검증)
4. `POST /auth/org/switch` → 재발급 토큰의 `active_org_id` 클레임 변경 확인
5. 모든 기존 e2e 테스트 GREEN (회귀 없음)

## 🧩 작업 단위 (SPEC + phase-FF)

> 본 절은 phase 의 *작업 지도* 입니다. 실질적/불확실 → **SPEC**, 작고 가역적인 1–2 commit → **phase-FF**.
> SPEC 은 요점 + 방향성 + 참조까지만 적습니다. 자세한 spec/plan/task 는 `specs/spec-17-{seq}-{slug}/` 에서 작성합니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-17-01` | email-adapter | P? | Merged | `specs/spec-17-01-email-adapter/` |
| `spec-17-02` | multi-tenancy-entity-schema | P? | Active | `specs/spec-17-02-multi-tenancy-entity-schema/` |
| `spec-17-03` | org-id-retrofit-rls | P? | Merged | `specs/spec-17-03-org-id-retrofit-rls/` |
| `spec-17-04` | personal-workspace-provisioning | P? | Active | `specs/spec-17-04-personal-workspace-provisioning/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-17-01 — 이메일 어댑터 (Resend 실 발송 배선)

- **요점**: notification 포트의 stub 구현을 Resend SDK 실 어댑터로 교체하고, password-reset / email-verify 실발송을 검증한다.
- **방향성**: `packages/backend/notification` 에 `ResendEmailAdapter` 구현 → NestJS DI 교체. 환경변수 `RESEND_API_KEY` + `EMAIL_FROM` 추가. Resend sandbox 모드로 e2e 테스트. 초대 이메일 템플릿도 이 spec 에서 준비.
- **참조**:
  - `docs/adr/0022-multi-tenancy-strategy.md` (초대 메일 전제 언급)
  - `backlog/queue.md` Icebox "notification 실 어댑터"
- **연관 모듈**: `packages/backend/notification/`, `apps/api/`

### spec-17-02 — 멀티테넌시 엔티티 스키마

- **요점**: `organizations` · `memberships`(user×org×role) · `invitations` Drizzle 스키마 + migration 을 추가한다.
- **방향성**: `packages/backend/db` 에 3개 테이블 스키마 정의(org_id UUID PK, memberships FK, invitations 이메일+토큰+만료). Zod contracts 도 함께. `role` enum: owner/admin/member. migration 파일 생성 후 drizzle-kit push 검증.
- **참조**:
  - `docs/adr/0022-multi-tenancy-strategy.md` §Decision 항목 1, 3
- **연관 모듈**: `packages/backend/db/`, `packages/contracts/`

### spec-17-03 — org_id retrofit + Postgres RLS

- **요점**: 기존 테이블(`users` · `sessions` · `failed_logins` · `lockouts` · audit_logs 등)에 `org_id` 컬럼을 추가하고 RLS 정책을 적용한다.
- **방향성**: migration 으로 `NOT NULL DEFAULT(personal-org-placeholder)` 추가 → personal org 생성 spec(17-04)과 데이터 일관성 확보. RLS 정책: `USING (org_id = current_setting('app.current_org')::uuid)`. drizzle 스키마 동기화. 기존 e2e 회귀 검증.
- **참조**:
  - `docs/adr/0022-multi-tenancy-strategy.md` §Decision 항목 1
- **연관 모듈**: `packages/backend/db/`, migration 파일

### spec-17-04 — 개인 워크스페이스 자동 생성 + 유저 프로비저닝 seam

- **요점**: signup 시 개인 org + owner 멤버십을 트랜잭션으로 생성하는 **프로비저닝 seam** 을 native/provider 공통 경로로 구현한다.
- **방향성**: `provisionUser(userId)` 공용 함수: org 생성 → memberships 삽입 → users.org_id 업데이트. `AuthSignupService` 에서 호출. provider-first-login(phase-18) 도 동일 seam 사용 예정이므로 provider-agnostic 으로 설계. 전역 `role` 필드는 이 spec 에서 deprecate 표시(실제 제거는 spec-17-05 와 협의).
- **참조**:
  - `docs/adr/0022-multi-tenancy-strategy.md` §Decision 항목 3, "유저 프로비저닝 seam"
  - `docs/adr/0023-auth-authority-modes.md`
- **연관 모듈**: `packages/backend/auth-*/`, `apps/api/`

### spec-17-05 — active_org 토큰 클레임 + org 전환 endpoint + AsyncLocalStorage 주입

- **요점**: access token 에 `active_org_id` / `org_role` 클레임을 추가하고, org 전환 endpoint 와 AsyncLocalStorage→DB 세션변수 주입을 구현한다.
- **방향성**: `JwtService.sign` 에 org 클레임 추가. `POST /auth/org/switch { orgId }` → 멤버십 검증 후 새 토큰 발급. `AuthMiddleware` 에서 `active_org_id` 추출 → `AsyncLocalStorage` 에 set → DB 커넥션 풀 훅에서 `SET app.current_org` 실행. RLS 가 자동 스코프 적용. AuthGuard 도 org 컨텍스트 검증.
- **참조**:
  - `docs/adr/0022-multi-tenancy-strategy.md` §Decision 항목 2, 4
- **연관 모듈**: `packages/backend/auth-jwt/`, `packages/backend/auth-nestjs/`, `apps/api/`

### spec-17-06 — 초대 endpoint + 수락 흐름

- **요점**: `POST /auth/org/invite` → invitations 행 생성 + 이메일 발송, `POST /auth/org/invite/accept` → memberships 추가 흐름을 구현한다.
- **방향성**: invitation 토큰(UUID) 생성 → DB 저장 + Resend 이메일 발송(spec-17-01 어댑터 활용). accept endpoint: 토큰 검증 → memberships 삽입 → org switch. 만료(24h) + 재사용 방지.
- **참조**:
  - `docs/adr/0022-multi-tenancy-strategy.md` §Consequences (invitations 엔티티)
- **연관 모듈**: `packages/backend/db/`, `packages/backend/notification/`, `apps/api/`

### phase-FF 예정 항목 (spec 미생성)

> 작고 가역적인 1–2 commit 항목. spec 없이 직접 커밋. (draft — 진행 중 조정 가능)

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| `role` 필드 완전 제거 | spec-17-04 에서 deprecate 후 마이그레이션 + 코드 정리 | 1 |
| knip / dependency-cruiser 규칙 갱신 | 새 패키지 allowlist 추가 | 1 |

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 이메일 어댑터 서비스 | Resend vs SES | Resend | 개발자 경험 우수, API 단순, sandbox 지원 |
| RLS 트리거 방식 | 미들웨어 SET vs 커넥션 훅 | AsyncLocalStorage→커넥션 훅 | 모든 쿼리에 자동 적용, 누락 방지 |

## 🧪 통합 테스트 시나리오 (간결)

> 본 phase 의 Done 조건 중 하나.

### 시나리오 1: 이메일 실발송

- **Given**: `RESEND_API_KEY` 설정됨
- **When**: `POST /auth/password/forgot { email }`
- **Then**: Resend API 호출 로그 + 이메일 수신 확인

### 시나리오 2: signup → 개인 org 자동 생성

- **Given**: 신규 유저
- **When**: `POST /auth/signup`
- **Then**: `organizations` + `memberships`(role=owner) 행 생성, token 에 `active_org_id` 포함
- **연관 SPEC**: spec-17-04, spec-17-05

### 시나리오 3: RLS 격리

- **Given**: 두 org(A, B)의 유저가 존재
- **When**: org A 컨텍스트로 조회 시
- **Then**: org B 데이터 row 접근 불가 (DB-level 차단)
- **연관 SPEC**: spec-17-03, spec-17-05

### 시나리오 4: org 전환

- **Given**: 유저가 org A, B 모두 멤버
- **When**: `POST /auth/org/switch { orgId: B }` → 재발급 토큰 사용
- **Then**: 토큰 `active_org_id` = B, RLS 컨텍스트 전환
- **연관 SPEC**: spec-17-05

### 시나리오 5: 초대→수락

- **Given**: org owner 가 이메일로 초대
- **When**: `POST /auth/org/invite` → 이메일 수신 → `POST /auth/org/invite/accept { token }`
- **Then**: 초대받은 유저가 org memberships 에 추가됨
- **연관 SPEC**: spec-17-01, spec-17-02, spec-17-06

### 통합 테스트 실행
```bash
pnpm turbo run test:e2e --filter=api -- --testPathPattern="phase-17"
```

## 🔗 의존성

- **선행 phase**: phase-16 (Security Hardening II — 완료)
- **외부 시스템**: Resend API (이메일 발송), PostgreSQL 15+ (RLS `current_setting` 지원)
- **연관 ADR**:
  - `docs/adr/0022-multi-tenancy-strategy.md` — 멀티테넌시 전략 전체
  - `docs/adr/0023-auth-authority-modes.md` — provider-first-login seam 연계

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| org_id retrofit migration 실패 | 기존 데이터 손상 | DEFAULT personal-org-placeholder 로 NULL 방지, rollback migration 준비 |
| RLS `SET` 누락 시 전체 데이터 노출 | 보안 사고 | 커넥션 풀 훅에 RLS SET 강제, 테스트에서 wrong-org 접근 차단 검증 |
| Resend API 키 미설정 시 발송 실패 | 기능 불동작 | production 가드: `RESEND_API_KEY` 없으면 기동 거부 |
| spec-17-03~05 의존성 순서 | 데이터 불일치 | spec 순서 준수: 스키마(02) → retrofit(03) → seam(04) → 토큰(05) |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC merge (spec-17-01 ~ spec-17-06)
- [ ] 통합 테스트 5개 시나리오 PASS
- [ ] 성공 기준 5항목 정량 측정 완료 (검증 결과 섹션에 기록)
- [ ] 기존 e2e 전체 GREEN (회귀 없음)
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
