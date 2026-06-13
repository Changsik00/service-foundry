# Implementation Plan: spec-19-04

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-04-openapi-swagger`
- 시작 지점: `phase-19-account-authz`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **스코프 확인**: `AuthController`, `AccountController`, `HealthController` 3개만 데코레이터 추가. MFA/Passkey/OAuth는 Out of Scope.
> - [ ] **production 게이팅**: `SWAGGER_ENABLED=true` env 필수. 미설정 시 SwaggerUI 라우트 미등록 (빌드에는 포함).

> [!WARNING]
> - [ ] `@nestjs/swagger`가 catalog에 없으므로 `apps/api/package.json`에 직접 버전 명시 필요. NestJS 11 호환 버전: `^11.x`.

## 🎯 핵심 전략

### 패키지 설치

```
@nestjs/swagger@^11.x    — NestJS 11 호환
swagger-ui-express@^5.x  — SwaggerUI 번들
```

`apps/api/package.json` dependencies에 추가 (runtime 사용이므로 devDeps 불가).

### settings.ts 확장

```typescript
SWAGGER_ENABLED: z.coerce.boolean().default(false),
```

### main.ts SwaggerModule 초기화 (env-gated)

```typescript
if (settings.SWAGGER_ENABLED) {
  const config = new DocumentBuilder()
    .setTitle("Service Foundry API")
    .setVersion("1.0")
    .addBearerAuth()
    .addCookieAuth("refresh_token")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);
}
```

### 컨트롤러 데코레이터 전략

최소한만 추가 — 런타임 동작 변경 없음:

| 컨트롤러 | @ApiTags | 엔드포인트별 추가 |
|---|---|---|
| `AuthController` | `auth` | `@ApiOperation`, `@ApiResponse(200/201/400/401)`, JWT 엔드포인트 `@ApiBearerAuth` |
| `AccountController` | `account` | 동일 패턴 |
| `HealthController` | `health` | `@ApiOperation`, `@ApiResponse(200)` |

CSRF 필요 엔드포인트: `@ApiHeader({ name: 'X-Csrf-Token', required: true })`

### 테스트 전략

Swagger 데코레이터는 메타데이터만 추가 — 기존 단위/e2e 테스트 영향 없음. `SWAGGER_ENABLED` env 제어 로직만 settings.test.ts에 케이스 추가.

## 📂 Proposed Changes

### [MODIFY] `apps/api/package.json`
```json
"@nestjs/swagger": "^11.2.0",
"swagger-ui-express": "^5.0.0"
```

### [MODIFY] `apps/api/src/settings.ts`
`SWAGGER_ENABLED: z.coerce.boolean().default(false)` 추가

### [MODIFY] `apps/api/src/main.ts`
SwaggerModule 초기화 (SWAGGER_ENABLED 게이팅)

### [MODIFY] `apps/api/src/auth/auth.controller.ts`
`@ApiTags('auth')` + 핵심 엔드포인트 `@ApiOperation` + `@ApiResponse`

### [MODIFY] `apps/api/src/auth/account.controller.ts`
`@ApiTags('account')` + 핵심 엔드포인트 `@ApiOperation` + `@ApiResponse`

### [MODIFY] `apps/api/src/health/health.controller.ts`
`@ApiTags('health')` + `@ApiOperation` + `@ApiResponse`

## 🧪 검증 계획

```bash
# 전체 테스트
pnpm --filter=@apps/api exec vitest run

# typecheck
pnpm turbo run typecheck

# 수동 확인 (서버 기동 후)
SWAGGER_ENABLED=true pnpm --filter=@apps/api run dev
# → GET http://localhost:3000/api-docs
```

## 🔁 Rollback Plan

- 코드 전용 변경 (신규 테이블 없음) — `git revert` 또는 spec 미머지
- `SWAGGER_ENABLED` 미설정 시 기본 OFF — rollback 없이 안전하게 disable 가능

## 📦 Deliverables 체크

- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
