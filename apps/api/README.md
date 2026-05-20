# @apps/api

phase-03 의 *health-check 스켈레톤* NestJS app. 5 어댑터 (`nestjs-settings/logger/http-client/database/security`) 통합 wire-up + `GET /health` 1개.

> **scope 제한**: 본 app 은 *통합 검증용 스켈레톤*. 실 도메인 (User / Tenant 등) 과 Repository 패턴 실 구현은 phase-04+ 영역.

## 부트 방법

```bash
# 1. env 파일 준비
cp apps/api/env.example apps/api/.env

# 2. dev 부트 (tsx watch)
pnpm --filter @apps/api start
```

부트 후 `http://localhost:2026/health` 호출 시 200 응답:

```json
{ "status": "ok", "uptime": 1.234, "version": "0.0.0" }
```

> ⚠️ `.env.example` 이 아닌 `env.example` 로 commit 되어있습니다 (도구 권한 제약). 로컬 사용 시 `.env` 로 rename 또는 복사.

## env 변수

| 변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `NODE_ENV` | `development` \| `test` \| `staging` \| `production` | (필수) | 환경 구분 |
| `PORT` | number (1~65535) | `2026` | listen 포트 |
| `LOG_LEVEL` | pino level | `info` | logger level |
| `DATABASE_URL` | string | (필수) | PostgreSQL connection URL |
| `HTTP_CLIENT_BASE_URL` | URL | (필수) | 외부 API base URL |

## 어댑터 wire-up 구조

```ts
@Module({
  imports: [
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level }),
    HttpClientModule.forRoot({ baseUrl }),
    DatabaseModule.forRoot({ connectionUrl, schema: {} }),
    BackendThrottlerModule.forRoot(),  // APP_GUARD 자동 — 100req/60s default
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- `BackendThrottlerModule` 가 `APP_GUARD` 자동 등록 — 모든 라우트 자동 rate-limit
- `HealthController` 는 `@SkipThrottle()` 박혀 k8s probe 빈도 제한 안 받음
- `DatabaseModule.forRoot({ schema: {} })` — 빈 schema. 실 schema 정의는 phase-04+
- `pg.Pool` 은 lazy connection — 부트 시점 실 DB 검증 안 함

## Repository 패턴 가이드 (phase-04+ 예고)

실 도메인 진입 시 *Persistence Ignorance* 컨벤션 따름. application/domain layer 는 *Repository interface* 만 의존, infra layer 만 Drizzle (or 향후 다른 ORM) 직접 사용:

```text
apps/api/src/
  domain/<entity>/
    entity.ts                 # 도메인 POJO (ORM 모름)
    repository.ts             # interface SomeRepository
  infra/persistence/
    drizzle/
      schema/                 # Drizzle table defs
      <entity>-repository.ts  # class DrizzleSomeRepository implements SomeRepository
  application/
    <use-case>.ts             # @Inject(SomeRepository) — ORM 모름
```

`DATABASE` symbol (from `@repo/nestjs-database`) 은 *infra layer 안에서만* 사용. application/domain layer 는 repository interface 만 의존 → 향후 ORM 교체 시 *infra layer 만 변경*.

## 테스트

```bash
pnpm --filter @apps/api test    # E2E supertest GET /health
```
