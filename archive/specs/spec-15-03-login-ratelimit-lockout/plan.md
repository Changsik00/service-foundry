# Implementation Plan: spec-15-03

## 📋 Branch Strategy
- 신규 브랜치: `spec-15-03-login-ratelimit-lockout`
- 시작 지점: `phase-15-security-wiring` (phase base)
- PR base = `phase-15-security-wiring`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **차단 응답 = 429** (`HttpException` 429 TOO_MANY_REQUESTS). 비밀번호 오류(401)와 구분. lockout/rate-limit 은 표준상 429.
> - [ ] **accountKey = email, IP = `req.ip`**. signIn 시그니처에 ip 추가(`signIn(email, password, ip)`), 컨트롤러가 `getContext(req).ip` 전달.
> - [ ] **호출 순서**: isLocked → checkRateLimit → verifyPassword → (실패) recordFailure+evaluateLockout / (성공) recordSuccess. 임계값은 패키지 기본값(account 5회/5분, lockout threshold 5, base 15분 progressive).

> [!WARNING]
> - [ ] **DB 마이그레이션 생성**: appSchema 변경 → `pnpm db:generate` 산출 `drizzle/000X_*.sql` 을 PR 에 포함. CI verify 의 `db:migrate` 가 적용.
> - [ ] **e2e IP 한도 주의**: 모든 e2e 가 동일 테스트 IP → 실패 누적이 IP 한도(30/5분) 근접 시 다른 테스트 교란. lockout 테스트는 전용 계정·정확히 5회만.

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **스키마** | `failedLogins`/`lockouts` 를 appSchema + local.ts 에 import·포함 | DB 생성·마이그레이션 대상 포함 |
| **store** | `RATE_LIMIT_STORE` 토큰 + `drizzleRateLimitStore(db.db)` provider | 기존 SESSION_STORE 등과 동일 DI 패턴 |
| **검증 로직** | 패키지 함수 재사용, SigninService 는 호출+예외 변환만 | 보안 로직 중복 금지 |
| **차단 응답** | 429 | HTTP 표준, 비밀번호 오류(401)와 분리 |
| **순서** | isLocked→checkRateLimit→verify→record* | 잠긴 계정은 즉시 차단, 비용 큰 검증 회피 |

### 📑 ADR 후보
- [x] 없음 (ADR-0014 범위 내)

## 📂 Proposed Changes

#### [MODIFY] `apps/api/src/infra/schema/index.ts`, `local.ts`
- `import { failedLogins, lockouts } from "@repo/backend-auth-rate-limit"` → `appSchema` + local.ts export 에 추가.

#### [NEW] `apps/api/drizzle/000X_*.sql`
- `pnpm db:generate` 자동 생성 (CREATE TABLE failed_logins / lockouts + 인덱스).

#### [NEW] `apps/api/src/auth/rate-limit.stores.ts`
- `RATE_LIMIT_STORE` 심볼 + `InjectRateLimitStore()` + `createDrizzleRateLimitStore(db)` (타입 캐스팅 래퍼).

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
- `{ provide: RATE_LIMIT_STORE, inject:[DATABASE], useFactory: db => createDrizzleRateLimitStore(db.db) }`.

#### [MODIFY] `apps/api/src/auth/signin.service.ts`
- 생성자에 `@InjectRateLimitStore() store` 추가. `signIn(email, password, ip)` 로 시그니처 확장.
- 진입부 `isLocked`+`checkRateLimit` → 차단 시 429. 실패 분기 `recordFailure`+`evaluateLockout`, 성공 분기 `recordSuccess`.

#### [MODIFY] `apps/api/src/auth/auth.controller.ts`
- signin 핸들러: `this.signinService.signIn(email, password, ctx.ip)`.

#### [MODIFY] `apps/api/src/auth/signin.service.test.ts`
- `createFakeRateLimitStore()` 주입. 시나리오: 5회 실패→6회차 429(lock), 성공→recordSuccess(reset), 잠긴 계정→429.

#### [MODIFY] `apps/api/src/auth/auth.e2e.test.ts`
- "rate-limit/lockout" describe: 전용 계정 5회 오답(postCsrf 동반)→ 이후 429.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트
```bash
pnpm --filter @apps/api test                       # signin.service: lock/reset 시나리오
pnpm --filter @repo/backend-auth-rate-limit test   # 함수 회귀(불변)
```
### 통합 테스트 (yes)
```bash
# 로컬 Postgres(5434) + drizzle migrate 후
pnpm --filter @apps/api test    # auth.e2e: 5회 실패→429 + 기존 흐름 PASS
```
### 게이트
```bash
pnpm turbo run lint typecheck knip depcruise
```
### 수동 검증
1. 동일 계정 잘못된 비번 5회 → 각 401 → 6회차 429.
2. 정상 로그인 → 200(이전 실패 카운터 reset).

## 🔁 Rollback Plan
- store provider + signin 분기 추가가 주 → revert 안전.
- 마이그레이션은 신규 테이블 추가(기존 데이터 무영향). 롤백 시 테이블 drop 또는 미사용 방치.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
