# spec-19-04: OpenAPI/Swagger

## 변경 사항

- `@nestjs/swagger ^11.2.0` + `swagger-ui-express ^5.0.0` 설치
- `pnpm-workspace.yaml` `@scarf/scarf allowBuilds: false` 설정
- `settings.ts` `SWAGGER_ENABLED: z.coerce.boolean().default(false)` 추가
- `main.ts` `SWAGGER_ENABLED=true` 게이팅 + `SwaggerModule.setup("api-docs")` 초기화
- `HealthController` / `AuthController` / `AccountController` `@ApiTags` + `@ApiOperation` + `@ApiResponse` 추가

## 테스트

- 전체 API 테스트 191개 PASS
- typecheck 47 tasks PASS

## 사용법

```bash
SWAGGER_ENABLED=true pnpm dev:api
# → http://localhost:3000/api-docs
```

## 주요 결정

| 결정 | 이유 |
|---|---|
| `SWAGGER_ENABLED` 기본 `false` | production 노출 방지 — 명시적 활성화 필요 |
| MFA/OAuth/Passkey 컨트롤러 데코레이터 생략 | 최소 스코프 — 추후 phase-FF로 점진 추가 |
| Bearer Auth + Cookie Auth 모두 등록 | refresh_token 흐름도 SwaggerUI에서 테스트 가능하도록 |
