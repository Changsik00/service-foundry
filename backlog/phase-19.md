# phase-19: 계정 완성 + 인가

> 본 phase 의 모든 SPEC 을 한 파일에 요점/방향성으로 나열합니다.
> *구체적* 작업 내용은 `specs/spec-19-{seq}-{slug}/spec.md` 에서 다룹니다.
>
> 본 문서는 "이번 phase 에서 무엇을 어디까지 할 것인가" 를 한 번에 보기 위한 *업무 지도* 입니다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-19` |
| **상태** | In Progress |
| **시작일** | 2026-06-12 |
| **목표 종료일** | — |
| **소유자** | changsik |
| **Base Branch** | `phase-19-account-authz` |

## 🎯 배경 및 목표

### 현재 상황

phase-17·18 이후 멀티테넌시 기반과 인증 권위 모드가 완성됐다. 그러나 사용자가 자신의 계정을 직접 관리할 수 있는 수단(비밀번호 변경, 이메일 변경, 회원 탈퇴, 세션 목록)이 없고, 조직 내 역할 기반 접근 제어(RBAC)도 Guard만 존재할 뿐 실제 라우트에 배선되지 않은 상태다. API 문서화(OpenAPI/Swagger)도 없어 외부 연동이나 프론트엔드 계약 확인이 어렵고, API Key(org 스코프) 역시 미구현 상태다.

### 목표 (Goal)

사용자가 직접 계정을 관리하고, 조직 역할에 따라 접근이 제어되며, 프로그래밍 방식의 API 접근(API Key)이 가능한 상태. OpenAPI 문서로 전체 API surface를 공식 노출.

### 성공 기준 (Success Criteria) — 정량 우선

1. 계정 변경 API 3종 (비밀번호·이름·탈퇴) e2e PASS
2. 이메일 변경 + 재검증 흐름 e2e PASS
3. 세션 목록·취소 API e2e PASS + 프론트 세션 관리 UI 동작
4. `GET /api-docs` → OpenAPI JSON 반환, 주요 컨트롤러 스키마 표시
5. org-role `owner/admin/member` 기반 RBAC — 미인가 요청 403 e2e PASS
6. API Key 발급·사용·취소 e2e PASS
7. 계정 설정 UI — 비밀번호 변경·이름 변경·세션 목록·탈퇴 화면 동작

## 🧩 작업 단위 (SPEC + phase-FF)

> 본 절은 phase 의 *작업 지도* 입니다. phase 설계 시 각 작업을 크기에 맞게 미리 배치합니다 — 실질적/불확실 → **SPEC**(아래 표), 작고 가역적인 1–2 commit → **phase-FF**(맨 아래 목록, spec 산출물 없음, → ADR-004).
> SPEC 은 *요점 + 방향성 + 참조* 까지만 적습니다. 자세한 spec/plan/task 는 `specs/spec-19-{seq}-{slug}/` 에서 작성합니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-19-01` | account-mutations-api | P? | Active | `specs/spec-19-01-account-mutations-api/` |
| `spec-19-06` | api-key | P? | Merged | `specs/spec-19-06-api-key/` |
<!-- sdd:specs:end -->

### spec-19-01 — 계정 변경 API

- **요점**: 비밀번호 변경·프로필(이름) 변경·회원 탈퇴 3종 엔드포인트 구현
- **방향성**: `apps/api/src/auth/account.controller.ts` + `account.service.ts` 신규. `PATCH /auth/account/password`, `PATCH /auth/account/profile`, `DELETE /auth/account` (org owner 탈퇴 거부 + soft-delete). `@UseGuards(JwtAuthGuard)` 적용.
- **참조**:
  - `apps/api/src/auth/` (기존 auth 컨트롤러 패턴)
  - `packages/backend/auth-password/` (비밀번호 해시 검증·변경)
- **연관 모듈**: `apps/api/src/auth/`, `packages/backend/auth-password/`

### spec-19-02 — 이메일 변경 API

- **요점**: 이메일 변경 요청·확인 흐름 구현 (요청 → 인증 메일 발송 → 토큰 확인 → 변경)
- **방향성**: `POST /auth/account/email/change-request` → 인증 토큰 생성 + 메일 발송. `POST /auth/account/email/change-confirm` → 토큰 검증 + 이메일 갱신. 기존 `email/verify` 흐름 패턴 답습. **Supabase "Confirm email" ON 복귀 필수** (현재 dev OFF, queue.md Icebox 항목 해소).
- **참조**:
  - `apps/api/src/auth/verify.controller.ts` (기존 이메일 인증 패턴)
  - `packages/backend/notification/` (메일 발송)
- **연관 모듈**: `apps/api/src/auth/`, `packages/backend/notification/`, `packages/backend/auth-session/`

### spec-19-03 — 세션 관리 API + UI

- **요점**: 내 세션 목록 조회·개별 취소·전체 로그아웃 API + 프론트 세션 관리 UI
- **방향성**: `GET /auth/sessions` (현재 사용자 세션 목록), `DELETE /auth/sessions/:id` (특정 세션 취소), `DELETE /auth/sessions` (현재 세션 제외 전체 취소). `packages/backend/auth-session/SessionStore`의 기존 `revokeSession()` 활용. 프론트 세션 목록 컴포넌트 추가.
- **참조**:
  - `packages/backend/auth-session/src/` (SessionStore, revokeSession)
  - `apps/web/src/features/account/` (프론트 계정 UI 위치)
- **연관 모듈**: `apps/api/src/auth/`, `packages/backend/auth-session/`, `apps/web/`

### spec-19-04 — OpenAPI/Swagger

- **요점**: `@nestjs/swagger` 설치·설정 + 주요 컨트롤러 데코레이터 추가
- **방향성**: `apps/api/src/main.ts`에 SwaggerModule 초기화 (`GET /api-docs`). `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` 핵심 데코레이터만 주요 컨트롤러에 추가. **production 노출은 `SWAGGER_ENABLED` env 게이팅**.
- **참조**:
  - `apps/api/src/main.ts`
  - `apps/api/src/auth/*.controller.ts`
- **연관 모듈**: `apps/api/`

### spec-19-05 — RBAC 배선

- **요점**: org-role 기반 `RolesGuard` 실제 라우트 배선 + `canXxx(user, resource)` policy helper
- **방향성**: 기존 `packages/nestjs-auth/src/roles.guard.ts` Guard를 org-scoped 라우트(`/orgs/:orgId/**`)에 배선. `owner` 전용 엔드포인트(조직 삭제·멤버 강퇴), `admin+` 허용 엔드포인트(멤버 초대) 구분. `packages/backend/authz/` 신규 — `canManageOrg`, `canInviteMember` 등 순수 함수 policy helper (프레임워크 독립).
- **참조**:
  - `packages/nestjs-auth/src/roles.guard.ts`
  - `apps/api/src/orgs/` (org 라우트)
- **연관 모듈**: `packages/nestjs-auth/`, `packages/backend/authz/` (신규), `apps/api/src/orgs/`

### spec-19-06 — API Key

- **요점**: org 스코프 API Key 발급·목록·취소 + `ApiKeyGuard` 인증
- **방향성**: `api_keys` 테이블 (id, orgId, keyHash, name, lastUsedAt, revokedAt) + Drizzle 스키마 신규. `POST /orgs/:orgId/api-keys` (발급 — 평문 1회 반환), `GET /orgs/:orgId/api-keys` (목록, 평문 미포함), `DELETE /orgs/:orgId/api-keys/:id` (취소). `ApiKeyGuard` — `X-API-Key` 헤더 검증 + org 컨텍스트 주입.
- **참조**:
  - `packages/backend/database/src/schema.ts` (Drizzle 스키마)
  - `packages/nestjs-auth/src/` (Guard 패턴)
- **연관 모듈**: `packages/backend/database/`, `packages/nestjs-auth/`, `apps/api/src/orgs/`

### spec-19-07 — 계정 설정 UI

- **요점**: 비밀번호 변경·이름 변경·세션 목록·회원 탈퇴 계정 설정 화면
- **방향성**: `apps/web/src/app/(console)/account/` 신규. 탭 구조: 프로필(이름 변경), 보안(비밀번호 변경·이메일 변경·세션 목록·탈퇴). spec-19-01~03 API를 `http-client` + `auth: AuthSource` 방식으로 호출. 기존 `AccountCard.tsx` 확장 또는 대체.
- **참조**:
  - `apps/web/src/features/account/AccountCard.tsx`
  - `apps/web/src/app/(console)/` (콘솔 레이아웃)
- **연관 모듈**: `apps/web/`, `packages/frontend/http-client/`

### phase-FF 예정 항목 (spec 미생성)

| 항목 | 요점 | 예상 commit |
|---|---|:---:|
| phase 진입 chore | phase.md 메타 확정, base branch 점검 | 1 |

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 아바타 업로드 포함 여부 | phase-19 포함 / phase-20 이관 | phase-20 이관 | storage 포트 배선 필요 — phase-20 데이터 UX phase와 응집성 ↑ |
| email-change Supabase 설정 | OFF 유지 / ON 복귀 | spec-19-02 시 ON 복귀 | autoconfirm OFF인 채 구현 시 영구 거짓 GREEN (Icebox 항목 해소) |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 계정 변경 전체 흐름

- **Given**: 인증된 사용자 (org member)
- **When**: 비밀번호 변경 → 새 비밀번호로 로그인 → 이름 변경 → `GET /auth/me` 확인
- **Then**: 변경된 비밀번호로 로그인 성공, 이름 반영
- **연관 SPEC**: spec-19-01

### 시나리오 2: 세션 관리

- **Given**: 동일 계정으로 2개 세션 생성
- **When**: 세션 A에서 `DELETE /auth/sessions/:id` (세션 B 취소)
- **Then**: 세션 B의 refresh token으로 갱신 시 401, 세션 A는 정상 동작
- **연관 SPEC**: spec-19-03

### 시나리오 3: RBAC — 권한 없는 작업 거부

- **Given**: org `member` 권한 사용자
- **When**: `DELETE /orgs/:orgId/members/:userId` (owner 전용 강퇴) 시도
- **Then**: 403 Forbidden
- **연관 SPEC**: spec-19-05

### 시나리오 4: API Key 인증

- **Given**: org `owner`가 API Key 발급
- **When**: `X-API-Key: <key>` 헤더로 보호된 엔드포인트 호출
- **Then**: 200 OK, org 컨텍스트 정상 주입
- **연관 SPEC**: spec-19-06

### 통합 테스트 실행

```bash
pnpm turbo run test:e2e --filter=@apps/api -- --testPathPattern="phase-19"
```

## 🔗 의존성

- **선행 phase**: phase-17 (멀티테넌시 Foundation), phase-18 (Auth Authority Mode)
- **외부 시스템**: Supabase (이메일 발송 — spec-19-02에서 Confirm email ON 복귀)
- **연관 ADR**:
  - `docs/adr/0013-session-lifecycle.md` (refresh rotation)
  - `docs/adr/0022-multitenancy-foundation.md` (org 스코프)
  - `docs/adr/0024-tenant-isolation-enforcement.md` (RLS)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| 이메일 변경 중 계정 잠김 | 높음 | 이전 이메일로 로그인 유지 + 인증 토큰 만료 24h |
| org owner 탈퇴 시 조직 고아 | 높음 | owner 1명이면 탈퇴 거부 + 명확한 에러 메시지 |
| API Key 평문 노출 | 높음 | 발급 시 1회만 반환, 이후 hash만 저장 (SHA-256) |
| RBAC 누락 라우트 | 중간 | Guard 배선 후 전체 라우트 audit (e2e로 403 검증) |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC merge (base branch `phase-19-account-authz` → main)
- [ ] 통합 테스트 전 시나리오 PASS
- [ ] 성공 기준 7개 정량 달성
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
