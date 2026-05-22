# phase-09: 로그인 UI + 수직 통합 슬라이스

> phase-08에서 CoreAuthSDK 계약과 AuthProvider 연결이 완성됨. 본 phase는 사용자가 실제로 볼 수 있는 로그인 화면을 만들고, 프론트엔드 → NestJS 백엔드 → DB 전체 플로우를 연결하는 수직 통합 슬라이스를 완성한다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-09` |
| **상태** | In Progress |
| **시작일** | 2026-05-22 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-09-login-admin` |

## 🎯 배경 및 목표

### 현재 상황

- phase-06: NestJS 인증 API (`POST /auth/login`, `/auth/logout`, `/auth/me` 등) 동작
- phase-08: CoreAuthSDK 계약 + Firebase/Supabase/Mock 어댑터 + web-next AuthProvider 연결 (createMockAuthSDK)
- 미완: 로그인 UI 페이지 없음, web-next ↔ NestJS 실제 HTTP 연결 없음, ADR 2개 미작성

### 목표 (Goal)

브라우저에서 이메일/비밀번호로 로그인 → NestJS 백엔드 인증 → 성공 시 /로 리다이렉트. `src/lib/auth.ts` 한 줄 변경만으로 Mock ↔ HTTP ↔ Firebase SDK 교체 가능함을 실증.

### 성공 기준 (Success Criteria) — 정량 우선

1. `/login` 페이지 — LoginForm 렌더 + signIn() 호출 → 성공 시 / 리다이렉트, 실패 시 에러 메시지
2. `packages/frontend/auth-http` — NestJS auth API를 CoreAuthSDK로 래핑하는 패키지 존재 + 테스트 PASS
3. web-next `src/lib/auth.ts`에서 `createHttpAuthSDK()`로 교체 → typecheck PASS + 실제 로그인 동작
4. ADR `docs/decisions/ADR-0017-auth-provider-sdk-prop-contract.md` + `ADR-0018-auth-provider-package-location.md` 작성
5. `pnpm -r typecheck` 39+ packages PASS

## 🧩 작업 단위 (SPECs)

> 본 표는 phase 의 *작업 지도* 입니다.
> sdd 가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신하므로 마커는 그대로 두세요.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-09-01` | auth-adr | P? | Active | `specs/spec-09-01-auth-adr/` |
<!-- sdd:specs:end -->

### spec-09-01 — auth-adr

- **요점**: phase-08 이월 ADR 2개 작성 — `auth-provider-sdk-prop-contract` (convention) + `auth-provider-package-location` (decision)
- **방향성**: docs-only. ADR 템플릿에 따라 작성. Phase FF 대신 spec으로 처리해 PR 리뷰 가능하게.
- **참조**: `specs/spec-08-04-sdk-swap-validation/walkthrough.md` §이월 항목
- **연관 모듈**: `docs/decisions/`

### spec-09-02 — login-ui

- **요점**: web-next `/login` 라우트 + LoginForm 컴포넌트. AuthProvider signIn() 호출 + Loading/Error 상태 처리 + 성공 시 / 리다이렉트.
- **방향성**: TDD — LoginForm 단위 테스트 먼저. 현재 createMockAuthSDK 연결 상태에서 동작 확인.
- **연관 모듈**: `apps/web-next/src/app/login/`, `apps/web-next/src/components/`

### spec-09-03 — http-auth-sdk

- **요점**: `packages/frontend/auth-http` 신규 패키지 — NestJS auth REST API를 CoreAuthSDK로 래핑. web-next `src/lib/auth.ts`에서 `createHttpAuthSDK()` 사용.
- **방향성**: TDD. fetch 기반 구현. 실제 NestJS dev 서버 없이 msw 또는 vitest의 fetch mock으로 테스트.
- **연관 모듈**: `packages/frontend/auth-http/`, `apps/web-next/src/lib/auth.ts`

### spec-09-04 — admin-scaffold

- **요점**: apps/admin 별도 앱 vs web-next route 결정 + 기초 scaffold. 로그인 사용자 정보 표시 + 로그아웃 버튼 최소 구현.
- **방향성**: 진입 시 결정 (별도 앱 vs route). 우선 web-next route(`/admin`)가 유력 — 별도 앱은 phase-10.
- **연관 모듈**: `apps/web-next/src/app/admin/` 또는 `apps/admin/`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 기존 phase-09 scope (API extend/worker/edge-api) | 유지 / 로그인 UI로 교체 | 로그인 UI로 교체 | 사용자가 볼 수 있는 결과물 우선. 나머지는 phase-10으로 이월. |
| ADR 작성 위치 | walkthrough 주석 / 별도 ADR | ADR 파일 작성 | phase-08 완료 시 작성 약속. spec-09-01 docs PR로 처리. |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: 로그인 → / 리다이렉트
- **Given**: web-next dev 서버 + NestJS dev 서버 기동, 테스트 사용자 존재
- **When**: /login에서 이메일/비밀번호 입력 → 로그인 버튼 클릭
- **Then**: NestJS 200 응답 → / 리다이렉트 → 로그인 상태 유지
- **연관 SPEC**: spec-09-02, spec-09-03

### 시나리오 2: 잘못된 비밀번호 → 에러 메시지
- **Given**: web-next dev 서버 기동
- **When**: 존재하지 않는 계정으로 로그인 시도
- **Then**: 에러 메시지 표시 ("이메일 또는 비밀번호가 올바르지 않습니다"), 화면 유지
- **연관 SPEC**: spec-09-02

### 시나리오 3: SDK swap (HTTP → Mock)
- **Given**: src/lib/auth.ts에서 createMockAuthSDK()로 교체
- **When**: typecheck 실행
- **Then**: 39+ packages PASS — 교체가 타입 레벨에서 안전함
- **연관 SPEC**: spec-09-03

## 🔗 의존성

- **선행 phase**: phase-06 (NestJS auth API), phase-08 (CoreAuthSDK + AuthProvider)
- **외부 시스템**: NestJS dev 서버 (localhost), SQLite (개발용)
- **연관 ADR**: 0006 (Consistent Wrapped SDK), 0017~0018 (본 phase 작성 예정)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| HTTP auth SDK — cookie/token 처리 복잡도 | spec-09-03 scope 초과 | JWT Bearer token 방식으로 단순화. Cookie/session은 phase-10 이후 |
| apps/admin — 별도 앱 scaffold 비용 | spec-09-04 scope 초과 | web-next `/admin` route로 우선 결정. 별도 앱은 phase-10으로 이월 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-09-01 ~ spec-09-04) main에 merge
- [ ] 통합 테스트 3개 시나리오 PASS (시나리오 1·2는 수동 확인, 시나리오 3은 typecheck)
- [ ] 성공 기준 5개 충족
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
