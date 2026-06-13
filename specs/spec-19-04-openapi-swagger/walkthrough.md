# Walkthrough: spec-19-04 OpenAPI/Swagger

## 구현 요약

| 커밋 | 내용 |
|---|---|
| `feat(spec-19-04): @nestjs/swagger 설치 + SwaggerUI /api-docs (SWAGGER_ENABLED 게이팅)` | 전체 구현 |

---

## 변경 사항

### 패키지 설치

`apps/api/package.json`에 추가:
- `@nestjs/swagger ^11.2.0` — NestJS 11 호환 Swagger 통합
- `swagger-ui-express ^5.0.0` — SwaggerUI HTML 번들

`pnpm-workspace.yaml`에서 `@scarf/scarf` (swagger-ui-express 의존) 빌드를 `false`로 명시 — 분석 코드 실행 차단.

### settings.ts

```typescript
SWAGGER_ENABLED: z.coerce.boolean().default(false),
```

`SWAGGER_ENABLED=true` 환경변수로 SwaggerUI 활성화. 기본값 `false` — production 안전.

### main.ts SwaggerModule 초기화

```typescript
if (settings.SWAGGER_ENABLED) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Service Foundry API")
    .setDescription("Service Foundry 백엔드 API")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .addCookieAuth("refresh_token")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);
}
```

`SWAGGER_ENABLED=false`(기본)이면 라우트 자체가 등록되지 않음.

### 컨트롤러 데코레이터

| 컨트롤러 | 적용 항목 |
|---|---|
| `HealthController` | `@ApiTags("health")` + `@ApiOperation` / `@ApiResponse` 3개 엔드포인트 |
| `AuthController` | `@ApiTags("auth")` + `@ApiOperation` / `@ApiResponse` + `@ApiBearerAuth` / `@ApiHeader` |
| `AccountController` | `@ApiTags("account")` + 동일 패턴 |

**원칙**: 데코레이터는 메타데이터 추가만 — 런타임 동작 변경 없음.

---

## 사용법

```bash
# 개발 서버에서 SwaggerUI 활성화
SWAGGER_ENABLED=true pnpm dev:api

# 브라우저에서 확인
open http://localhost:3000/api-docs

# OpenAPI JSON 다운로드
curl http://localhost:3000/api-docs-json
```

---

## 검증

```bash
pnpm --filter=@apps/api exec vitest run   # 191 passed
pnpm turbo run typecheck                  # 47 tasks passed
```
