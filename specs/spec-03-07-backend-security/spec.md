# spec-03-07: backend-security — `@repo/nestjs-security` (helmet + cors + rate-limit)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-03-07` |
| **Phase** | `phase-03` |
| **Branch** | `spec-03-07-backend-security` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (apps/api 미존재 — 본 spec scope 밖) |
| **작성일** | 2026-05-19 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- phase-03 의 4 인프라 어댑터 (`nestjs-settings/logger/http-client/database`) + 그 pure backend (`backend-settings/logger/http-client/database`) 완성 (PR #16 머지).
- `packages/nestjs/*` 어댑터 패턴 안정 — ADR-0016 표준 `@Module` decorator class.
- HTTP 보안 영역은 *공백* — helmet (HTTP security headers) / cors / rate-limit 일반 preset 미박힘.

### 문제점

- apps/api 진입 (spec-03-08 예정) 시 *security middleware 부재* → 운영 직전에 ad-hoc 박는 위험.
- helmet/cors/rate-limit 은 *common preset* — 한 곳에 박아 표준화하지 않으면 후속 app 마다 *중복 설정* 발생.
- 본 phase 의 마지막 인프라 패키지 — `apps/api` scaffold 가 본 어댑터 함께 사용해야 *통합 검증* 가능.

### 해결 방안 (요약)

`@repo/nestjs-security` 단일 어댑터 패키지 박음. helmet/cors 는 `applySecurity(app, opts)` helper (HTTP middleware 본질), rate-limit 은 `BackendThrottlerModule.forRoot()` (`@nestjs/throttler` wrap + `APP_GUARD` 자동 등록). 표준 NestJS 패턴 + 합리적 default preset.

## 📊 개념도

```mermaid
flowchart LR
    main[apps/api main.ts] -->|applySecurity| nestjsSecurity[@repo/nestjs-security]
    appModule[AppModule] -->|imports| BackendThrottlerModule
    BackendThrottlerModule -->|wraps| ThrottlerModule[@nestjs/throttler]
    BackendThrottlerModule -->|APP_GUARD| ThrottlerGuard

    nestjsSecurity -->|helmet| helmet[helmet npm]
    nestjsSecurity -->|enableCors| nestCors[NestJS built-in CORS]
```

## 🎯 요구사항

### Functional Requirements

1. **`applySecurity(app, opts)` helper export**:
   - signature: `(app: INestApplication, opts?: SecurityOptions) => void`
   - helmet wire-up: `app.use(helmet(opts.helmet))` (`opts.helmet === false` 시 skip)
   - cors wire-up: `app.enableCors(opts.cors)` (`opts.cors === false` 시 skip)
   - 둘 다 default enabled (opts 미전달 시 둘 다 활성).

2. **`BackendThrottlerModule.forRoot(opts)` export** (표준 `@Module` decorator class — ADR-0016):
   - `@nestjs/throttler` 의 `ThrottlerModule.forRoot([{ ttl, limit }])` wrap.
   - default: `ttl: 60_000` (60s), `limit: 100` req.
   - `APP_GUARD` provider 자동 등록 (`ThrottlerGuard`) — 모든 라우트 자동 적용. opt-out 은 `@SkipThrottle()` decorator (사용자 책임).
   - `global: true`.

3. **타입 export**: `SecurityOptions`, `BackendThrottlerOptions`.

4. **단위 테스트**: helper + Module 동작 검증.

### Non-Functional Requirements

1. ADR-0015 (framework adapter naming + layout) 준수 — `packages/nestjs/security` + `@repo/nestjs-security`.
2. ADR-0016 (NestJS standard `@Module`) 준수 — `BackendThrottlerModule` 표준 패턴.
3. ADR-0009 (AppError) — 본 spec 은 *middleware preset* — 자체 error 발생 영역 거의 없음. `ThrottlerException` (NestJS 기본) 그대로 통과.
4. depcruise 룰 위반 0.
5. catalog 갱신: `helmet`, `@nestjs/throttler` 추가.

## 🚫 Out of Scope

- **pure `packages/backend/security` 패키지**: 결정 — *불필요* (helmet/cors/throttler 자체가 HTTP/NestJS-specific, framework-agnostic logic 거의 없음). 단일 어댑터로 충분.
- **auth-specific rate-limit** (login attempt limit 등): phase-05+ `auth-security` 패키지.
- **CSRF protection**: NestJS 의 SPA + JWT 패턴은 일반적으로 *CSRF 불필요* (cookie-based session 만 영향). 본 spec 밖.
- **CSP (Content Security Policy) custom**: helmet default 제공 — custom CSP 는 app 별 결정 (opts 로 override 가능).
- **Throttler Redis storage**: default in-memory. 분산 환경 진입 시 `@nestjs/throttler` storage adapter 추가 (별 spec).
- **`apps/api` scaffold 통합**: spec-03-08 (예정) 영역.

## 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — 본 spec 의 결정은 모두 *기존 ADR (0015 / 0016) 적용* + *standard middleware preset*. ADR 격상 가치 없음.

## ✅ Definition of Done

- [ ] `@repo/nestjs-security` 패키지 작성 (`applySecurity` helper + `BackendThrottlerModule`)
- [ ] catalog 갱신 (`helmet` + `@nestjs/throttler`)
- [ ] 단위 테스트 PASS (helper 동작 + Module DynamicModule 구조)
- [ ] `pnpm lint` / `pnpm typecheck` 그린
- [ ] `pnpm exec depcruise` 0 violations
- [ ] `walkthrough.md` / `pr_description.md` 작성 및 ship commit
- [ ] `spec-03-07-backend-security` 브랜치 push 완료
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 검토 요청 알림 완료
