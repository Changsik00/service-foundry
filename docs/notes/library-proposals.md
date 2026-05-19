# 라이브러리 & 패키지 제안 노트

> 작성일: 2026-05-19  
> 목적: service-foundry 모노레포에 추가를 검토할 라이브러리/패키지 목록.  
> Phase 진입 시 해당 구간 제안을 spec backlog로 승격하기 위한 참고 문서.

---

## 0. 전제

**이미 확정된 스택 (추가 검토 불필요)**

| 영역 | 확정 |
|---|---|
| Monorepo | pnpm 11 catalogs + Turborepo |
| Lint/Format | Biome 2.x |
| TypeScript | 6.x, strict, NodeNext |
| Test | Vitest 4.x |
| Bundle | tsup 8.x |
| Dead code | Knip |
| Boundary | dependency-cruiser |
| Git hooks | lefthook |
| Versioning | changesets |
| Schema | Zod v4 |
| Backend framework | NestJS + Drizzle + PostgreSQL (ADR-0005) |
| Logger core | pino |
| Observability | OpenTelemetry SDK |
| Cache/Queue | ioredis + BullMQ |
| JWT | jose |
| Password | argon2 |
| Env/Settings | **@env-kit/node-settings** (자체 제작, 아래 §1 참조) |

---

## 1. @env-kit/node-settings — 자체 제작 라이브러리 (확정)

> **결론: 외부 대안 불필요. service-foundry ADR-0005 요구사항과 1:1 대응.**

`packages/backend/settings`의 구현 기반. npm 배포 완료 (`@env-kit/node-settings@1.1.0`).

### 왜 `@t3-oss/env-core` 같은 외부 라이브러리가 아닌가

| 기능 | node-settings | @t3-oss/env-core |
|---|:---:|:---:|
| Zod 스키마 기반 env 검증 | ✅ | ✅ |
| `.env.example` 자동 생성 | ✅ | ❌ |
| K8s ConfigMap + Secret 자동 생성 | ✅ | ❌ |
| Markdown 문서 자동 생성 | ✅ | ❌ |
| per-env 설정 파일 cascade | ✅ | ❌ |
| 런타임 JSON override (`APP_CONFIG_JSON`) | ✅ | ❌ |
| 모노레포 `extends` 지원 | ✅ | ❌ |
| CLI (CI/CD drift gate) | ✅ | ❌ |
| Vite / Next / esbuild adapter | ✅ | ❌ |
| Zod v4 지원 | ✅ (v1.1.0, 2026-05-18) | 확인 필요 |

ADR-0005에서 명시한 "`.env.example` 자동 생성 + K8s manifest drift 검출"이 node-settings의 핵심 기능과 정확히 일치한다.

### catalog 등록 방법 (Phase 3 spec-03-01 에서 처리)

```yaml
# pnpm-workspace.yaml catalog
catalog:
  "@env-kit/node-settings": ^1.1.0
```

```jsonc
// packages/backend/settings/package.json
"dependencies": {
  "@env-kit/node-settings": "catalog:"
}
```

---

## 2. 즉시 도입 검토 — Monorepo Tooling

Phase 구분 없이 root devDependencies에 추가 가능.

### 2.1 sherif

- **목적**: zero-config monorepo integrity linter. `package.json` 간 버전 불일치, exports 누락, 알파벳 정렬 강제.
- **왜**: pnpm catalog가 버전 pin을 담당하지만, catalog 미등록 dep이 `packages/*`에 직접 박히는 경우를 sherif가 잡아준다. Rust 기반으로 빠름.
- **적용 시점**: 지금 바로 root에 추가 가능. `turbo run lint`에 포함하거나 lefthook pre-push에 추가.

```bash
pnpm add -Dw sherif
# package.json scripts
"lint:repo": "sherif"
```

### 2.2 publint

- **목적**: 패키지 `exports` / `main` / `types` 필드 유효성 검증.
- **왜**: Phase 3부터 `packages/backend/*`가 compiled 패키지(`dist/` 기반 exports)로 바뀐다. exports 필드 오류는 타입 체크나 빌드에서 잡히지 않고 downstream에서 silent하게 깨진다.
- **적용 시점**: Phase 3 첫 spec(spec-03-01) 전후로 추가. `turbo run publint` 태스크로 등록.

```bash
pnpm add -Dw publint
```

### 2.3 @turbo/gen

- **목적**: `pnpm turbo gen <generator>` 명령으로 새 패키지/서비스/모듈 scaffold 자동화.
- **왜**: Phase 3 이후 `packages/nestjs/*`, `packages/backend/*` 패키지가 늘어날수록 반복 boilerplate(package.json / tsconfig / vitest.config / index.ts)를 generator로 추상화하면 spec 작업 속도가 오른다.
- **적용 시점**: Phase 5 (tooling/generators)가 정식 scope이나, Phase 3 진입 전에 간단한 `add-package` generator 하나만 먼저 만들어도 효과 큼.
- **비교**: plop(standalone) / hygen(standalone)보다 turbo 내장이 monorepo 경로 해석·워크스페이스 연동에서 유리.

---

## 3. Phase 3 (Backend Foundation) — NestJS 실무 패키지

`packages/nestjs/*` 어댑터 패키지들의 구현에 필요한 라이브러리.

### 3.1 nestjs-cls ⭐ (높은 우선도)

- **목적**: AsyncLocalStorage 기반 request-scoped context. traceId / userId / correlationId를 Controller → Service → Repository 레이어 전체에 명시적 인수 전달 없이 흘려보냄.
- **왜**: `packages/backend/logger`(pino)의 request-id 미들웨어, `packages/backend/observability`(OTel trace)가 request context에 의존한다. nestjs-cls 없이 구현하면 모든 service 메서드 시그니처에 `ctx: RequestContext`를 강제로 넣어야 한다.
- **연관**: ADR-0016 (NestJS adapter 표준 모듈 패턴) — `ClsModule`을 `packages/nestjs/logger`에 wire-up.
- **패키지**: `nestjs-cls` + `@nestjs/platform-fastify` 조합 시 Fastify adapter 주의사항 있음 (README 참조).

### 3.2 nestjs-zod

- **목적**: Zod 스키마 → NestJS DTO 자동 변환. `createZodDto(schema)`로 class DTO 없이 pipe/swagger 연동.
- **왜**: `@repo/contracts` / `@repo/validation`의 Zod 스키마를 NestJS ValidationPipe에서 그대로 재사용. DTO class를 별도로 만들지 않아도 되어 이중 정의 제거.
- **주의**: `nestjs-zod`는 Zod v4 지원 여부를 spec 진입 전에 확인 필요 (2026-05 기준 zod v4 대응 PR 진행 중일 수 있음).

### 3.3 @nestjs/swagger

- **목적**: OpenAPI 3.0 문서 자동 생성.
- **왜**: `nestjs-zod`와 묶으면 Zod schema → DTO → Swagger 문서가 단일 진실 공급원(schema)에서 파생된다. `apps/api`의 `/api-docs` 엔드포인트 자동 제공.
- **적용 시점**: Phase 3 `apps/api` scaffold spec에서 함께 wire-up.

### 3.4 @nestjs/throttler

- **목적**: rate limiting 공식 모듈. Redis 스토어 연동으로 분산 환경(다중 인스턴스) 지원.
- **왜**: `packages/backend/security` (ADR-0005)의 helmet/cors와 함께 security preset에 포함. Redis 이미 locked stack(`ioredis`)이라 `@nestjs-throttler-storage-redis` 연동이 자연스럽다.
- **위치**: `packages/nestjs/security` 어댑터 내부.

---

## 4. Phase 3 Testing — fixture/factory 생태계

`packages/testing/testing` 패키지에 포함.

### 4.1 @faker-js/faker

- **목적**: 현실적인 테스트 데이터 생성 (이름, 이메일, UUID, 날짜 등). locale 지원.
- **왜**: testcontainers로 실제 PostgreSQL을 띄워도 데이터가 없으면 의미 없다. faker로 seed 데이터를 만들어야 통합 테스트가 현실적인 경로를 커버한다.

### 4.2 fishery

- **목적**: TypeScript-first fixture factory 라이브러리. 관계형 데이터(`User → Session → Role`)를 팩토리 패턴으로 구성.
- **왜**: faker는 단순 데이터 생성, fishery는 **관계를 가진 도메인 객체**를 조합한다. auth 도메인(User/Session/Role/Permission)처럼 복잡한 관계 데이터가 Phase 5~6부터 본격 등장한다. 미리 `packages/testing/testing`에 factory 패턴을 잡아두면 중복 fixture 정의를 막을 수 있다.
- **대안**: `rosie`(JS, 타입 약함) — fishery가 TypeScript-first라 이 프로젝트에 더 맞음.

### 4.3 vitest-mock-extended (선택)

- **목적**: interface/class에 대한 딥 타입 목 생성. `jest-mock-extended`의 vitest 대응판.
- **왜**: NestJS service 단위 테스트에서 repository나 external service를 목킹할 때 `vi.fn()`으로는 타입 안전성이 부족하다.
- **주의**: ADR-0005 §6.4에서 "통합 테스트 우선" 원칙을 채택했으므로, 목 기반 단위 테스트는 순수 도메인 로직에 한정. 남용 방지 가이드를 `packages/testing/testing`에 함께 문서화 권장.

---

## 5. Phase 4 (Frontend Foundation) — shadcn 생태계

### 5.1 nuqs

- **목적**: URL search params를 React state처럼 타입 안전하게 관리.
- **왜**: Next.js App Router에서 필터 / 페이지네이션 / 정렬 상태를 URL에 동기화하는 표준 패턴. `useSearchParams`의 타입-unsafe 문제를 해결.
- **위치**: `apps/web-next` / `apps/web-vite` 앱 레벨 dep.

### 5.2 react-hook-form + @hookform/resolvers

- **목적**: 성능 최적화 폼 상태 관리 + zod resolver.
- **왜**: shadcn Form 컴포넌트의 공식 권장 조합. `@repo/validation`의 zod schema를 폼에서 직접 재사용 → 클라이언트/서버 검증 단일 schema.
- **위치**: `packages/frontend/ui`에 Form 컴포넌트와 함께 포함 또는 앱 레벨.

### 5.3 zustand

- **목적**: 최소 보일러플레이트 전역 클라이언트 상태.
- **왜**: 2025 State of React 1위. `@tanstack/react-query`가 서버 상태를 담당하면, 클라이언트 UI 상태(모달 open/close, 선택 항목 등)는 zustand가 담당하는 역할 분리가 명확하다.
- **대안**: jotai — atom 단위 분리가 필요한 복잡한 UI에 강점. 규모가 커지면 재검토.

### 5.4 sonner

- **목적**: toast 알림 컴포넌트.
- **왜**: shadcn 생태계 공식 toast 라이브러리. `<Toaster />` 1줄 추가로 연동. `packages/frontend/ui`의 기본 컴포넌트 목록에 포함.

---

## 6. 도메인 로직 정교화 — ts-pattern

- **목적**: 타입-safe 패턴 매칭. `match(...).with(...).exhaustive()`.
- **왜**: ADR-0006의 `AuthResult` union (`session` / `mfa_required` / `email_verification_required`)처럼 discriminated union을 분기할 때 `switch`보다 exhaustiveness check가 강력하다. ADR-0008의 자체 `Result<T,E>` 타입과 충돌 없이 **그 위에** 올라탄다.
- **주간 다운로드**: ~230만 (2025 기준).
- **적용 시점**: Phase 5 (Auth Core) 진입 시 `packages/shared/utils`에 추가 검토.

```ts
// 예시: AuthResult 처리
import { match } from 'ts-pattern';

const result = await auth.signIn(input);
return match(result)
  .with({ kind: 'session' }, ({ session }) => redirect('/dashboard'))
  .with({ kind: 'mfa_required' }, ({ challengeId }) => redirect(`/mfa?id=${challengeId}`))
  .with({ kind: 'email_verification_required' }, () => redirect('/verify-email'))
  .exhaustive();
```

---

## 7. 도입 판단 보류 항목

| 라이브러리 | 이유 |
|---|---|
| `Effect` (effect-ts) | 학습 비용 높음. FP 팀 역량 필요. 자체 Result + ts-pattern 조합이 이 프로젝트에 더 현실적 |
| `neverthrow` | 유지보수 소극적 (PR 방치 보고 多). ADR-0008에서 자체 구현 예정이라 중복 |
| `syncpack` | pnpm catalog가 이미 버전 pin 담당. 중복 |
| `msw` | Phase 4 frontend 테스트에서 재검토. 현재 scope 외 |
| `@sentry/node` | ops/observability 결정 후 Phase 10에서 검토 |

---

## 8. 우선순위 요약

```
즉시 (현 시점):
  sherif              monorepo integrity linter — root devDep
  publint             exports 검증 — Phase 3 진입 전

Phase 3 시작 시:
  @env-kit/node-settings  catalog 등록 (pnpm-workspace.yaml)
  nestjs-cls              request context — packages/nestjs/logger와 bundle
  nestjs-zod              DTO 이중 정의 제거
  @nestjs/swagger         OpenAPI 자동화 — apps/api spec
  @nestjs/throttler       rate limiting — packages/nestjs/security

Phase 3 testing:
  @faker-js/faker + fishery  packages/testing/testing에 factory 패턴

Phase 4 시작 시:
  nuqs + react-hook-form + zustand + sonner

Phase 5 이후:
  ts-pattern              AuthResult / Result union 분기
  @turbo/gen              scaffold generator (Phase 5 tooling scope)
```
