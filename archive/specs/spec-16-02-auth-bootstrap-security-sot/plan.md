# Implementation Plan: spec-16-02

## 📋 Branch Strategy
- 신규 브랜치: `spec-16-02-auth-bootstrap-security-sot`
- 시작 지점: `phase-16-security-hardening` (phase base)
- PR base = `phase-16-security-hardening`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **configureApp 시그니처 변경**: `configureApp(app)` → `configureApp(app, opts?: { corsOrigin?: string })`. main.ts 가 `settings.CORS_ORIGIN` 주입. e2e 는 opts 생략(cors origin undefined = 테스트 허용).
> - [ ] **배선 순서**: requestId → cookieParser → applySecurity. 기존 main.ts 는 applySecurity 가 useLogger 뒤였으나, helmet/cors 는 요청 미들웨어라 logger 설정과 무관 — configureApp(생성 직후)로 이동 안전.

> [!WARNING]
> - [ ] helmet/CORS 동작값은 불변(`{ origin, credentials: true }`). e2e 가 헤더 존재로 고정.

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 배선 위치 | `configureApp` 에 흡수 | C1 SoT 패턴 확장 — prod·e2e 단일 경로 |
| cors origin | `opts.corsOrigin` 파라미터 | settings 의존을 app.setup 비침습으로 주입 |
| 회귀 검증 | e2e helmet 헤더 단언 | 제거 시 FAIL = 배선 회귀 차단(성공기준2) |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

#### [MODIFY] `apps/api/src/app.setup.ts`
- `configureApp(app, opts: { corsOrigin?: string } = {})` 로 시그니처 확장.
- 본문에 `applySecurity(app, { cors: { origin: opts.corsOrigin, credentials: true } })` 추가 (requestId·cookieParser 뒤).
```text
export function configureApp(app, opts = {}) {
  app.use(requestIdMiddleware());
  app.use(cookieParser());
  applySecurity(app, { cors: { origin: opts.corsOrigin, credentials: true } });
}
```

#### [MODIFY] `apps/api/src/main.ts`
- 인라인 `applySecurity(app, { cors: ... })` 제거.
- `configureApp(app)` → `configureApp(app, { corsOrigin: settings.CORS_ORIGIN })`.
- 미사용 `applySecurity` import 제거.

#### [MODIFY] `apps/api/src/auth/auth.e2e.test.ts`
- "보안 헤더(helmet)" describe 신규: `GET /auth/csrf` 응답에 `x-content-type-options: nosniff` 존재 단언.
- (beforeAll 은 그대로 `configureApp(app)` — 이제 helmet 포함.)

## 🧪 검증 계획 (Verification Plan)

### 통합 테스트 (필수, Integration Test Required = yes)
```bash
DATABASE_URL=postgres://postgres:test@localhost:5434/test pnpm --filter @apps/api test
```
- 신규 helmet 헤더 e2e PASS + 기존 104 회귀 GREEN.

### 부정 검증 (대조)
- `configureApp` 에서 `applySecurity` 제거 → helmet e2e FAIL 확인 후 원복.

### 게이트
```bash
pnpm turbo run lint typecheck test knip depcruise
```

## 🔁 Rollback Plan
- configureApp 시그니처 + 1줄 추가, main.ts 호출 변경 → revert 안전. helmet/cors 동작값 무변경.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
