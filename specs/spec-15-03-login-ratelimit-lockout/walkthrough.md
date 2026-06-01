# Walkthrough: spec-15-03

> 로그인 rate-limit + lockout 배선 (apps/api SigninService). 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 테이블 객체 import 경로 | 패키지 index / **`@repo/backend-auth-rate-limit/schema` 서브패스** | 서브패스 | index 는 타입만 re-export. 테이블 객체는 `./schema` exports 로 노출됨. |
| 차단 응답 | 401 / **429** | 429 (`HttpException`) | rate-limit/lockout 표준. 비밀번호 오류(401)와 구분. |
| accountKey | email / user_id | **email** | 로그인 식별자. 미가입 email 도 IP 기반으로 기록 가능. |
| 호출 순서 | verify 먼저 / **isLocked→checkRateLimit→verify** | 선검사 | 잠긴 계정은 비용 큰 비밀번호 검증 회피. |
| store 주입 | SigninService 내부 생성 / **DI provider** | `RATE_LIMIT_STORE` provider | 기존 SESSION_STORE 등과 일관, 테스트 fake store 주입 용이. |
| signIn 시그니처 | ip 전역 미들웨어 / **`signIn(email,password,ip)`** | 명시 인자 | 컨트롤러가 `getContext(req).ip` 전달, 순수 함수 유지. |

### ADR 승격 가이드
- [ ] ADR 승격 대상 있음
- [x] 없음 (ADR-0014 rate-limit/lockout 설계 범위 내 — 배선만)

## 💬 사용자 협의
- **주제**: 다음 spec 선택 → spec-15-03 (실행 순서대로). 차단 응답·임계값 등은 plan 검토 항목으로 제시, Plan Accept 로 승인.

## 🧪 검증 결과

### 1. 단위 테스트
- `signin.service.test.ts` (5): ✅ 성공/email없음/password틀림 + **5회 실패→6회차 429** + **성공→reset(누적 4 후에도 401 유지)**. `createFakeRateLimitStore` 주입.

### 2. 통합 테스트 (Integration Test Required = yes)
- 로컬 Postgres(5434/test) + drizzle migrate(0008) 후 `pnpm --filter @apps/api test` → ✅ **100/100** (auth.e2e 40 포함).
- e2e "로그인 rate-limit + lockout": 전용 계정 5회 오답(각 401) → 6회차 **429**.

### 3. 게이트
- `pnpm turbo run lint typecheck test knip depcruise` (DATABASE_URL=로컬) → (ship gate 결과 기록).

### 4. 마이그레이션
- `pnpm db:generate` → `drizzle/0008_sad_ogun.sql` (failed_logins 4col/2idx, lockouts 4col). 로컬 DB 적용 + 테이블 확인.

## 🔍 발견 사항
- **테이블 객체는 `/schema` 서브패스로만 노출** — 패키지 index 는 타입만 re-export(의도적). 다른 schema 통합 패키지(auth-session/audit)는 index 에서 테이블도 export 하는 것과 대비.
- **시크릿 가드 오탐 지속** — `password =`(e2e fixture)·spec 문서가 패턴에 걸려 일부 커밋 `HARNESS_HOOK_MODE_SECRETS=warn` 우회 (전부 false positive).
- **e2e IP 누적 주의** — 동일 테스트 IP 라 lockout 테스트의 실패가 IP 한도(30/5분)에 누적. 전용 계정·정확히 5회로 제한해 다른 signin 테스트(성공) 비간섭(5≪30). CI 는 fresh DB 라 무누적.

## 🚧 이월 항목
- refresh endpoint rate-limit, failed_logins cleanup cron — 후속/icebox.
- request-id(15-04), 생성기 tsconfig(15-05).

## 🔗 관련 문서 (Related)
- 관련 wiki: `docs/explainers/auth/auth-rate-limit-lockout.md`, `docs/review/2026-06-01-wiring-audit.md` §B
- 관련 ADR: ADR-0014

## 📅 메타
| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-01 |
| **최종 commit** | (ship 시 갱신) |
