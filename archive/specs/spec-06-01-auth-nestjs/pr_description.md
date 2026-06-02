# PR: spec-06-01 — NestJS 인증 어댑터 (@repo/nestjs-auth)

## 요약

`packages/nestjs/auth/` 에 `@repo/nestjs-auth` 패키지를 신설한다. ADR-0015 (framework-adapter 네이밍) + ADR-0016 (표준 @Module class) 준수.

## 변경 내용

### 신규 패키지: `packages/nestjs/auth/` (`@repo/nestjs-auth`)

| 파일 | 내용 |
|---|---|
| `src/auth.guard.ts` | `AuthGuard` (CanActivate) — Bearer 추출 → `verifyAccessToken` → `decodeJwt` role 검증 → `req.user` 부착 |
| `src/roles.guard.ts` | `RolesGuard` (CanActivate) — `@Roles` 메타데이터 vs `user.role` |
| `src/decorators.ts` | `@Roles(...roles)` / `@CurrentUser()` |
| `src/module.ts` | `NestjsAuthModule.forRoot()` + `.forRootAsync()` DynamicModule |
| `src/index.ts` | 모든 public export |
| `src/auth.guard.test.ts` | AuthGuard 단위 테스트 5케이스 (real JWT sign) |
| `src/roles.guard.test.ts` | RolesGuard 단위 테스트 5케이스 |

### apps/api 연동

- `apps/api/package.json` — `@repo/nestjs-auth: workspace:*` 추가
- `apps/api/src/app.module.ts` — `NestjsAuthModule.forRootAsync` import (JwtService keyStore lazy 주입)
- `apps/api/src/settings.ts` — `JWT_ISSUER` / `JWT_AUDIENCE` 설정 추가 (default: `http://localhost:3000`)

### 인프라

- `biome.json` — `packages/nestjs/**/src/**` 경로에 `unsafeParameterDecoratorsEnabled: true` override 추가

## 테스트

```
Tests       10 passed (10)
Test Files  2 passed (2)
```

- `AuthGuard`: 유효 token+role / 만료 token / role 없는 token / 헤더 없음 / Symbol export (5케이스)
- `RolesGuard`: @Roles 없음 / role 일치 / role 불일치 / user 없음 / ROLES_KEY export (5케이스)

## 주요 결정

1. **role 추출 2단계**: `verifyAccessToken`(서명 검증) → `decodeJwt`(custom claim 읽기). `JwtClaims` 타입 건드리지 않음.
2. **keyStore lazy getter**: `() => jwtSvc.getKeyStore()` — DI 타이밍 이슈(onModuleInit vs factory) 해결.
3. **opt-in Guard**: 전역 APP_GUARD 아님. 컨트롤러에서 `@UseGuards(AuthGuard, RolesGuard)` 개별 적용.

## 체크리스트

- [x] 단위 테스트 PASS (10 tests)
- [x] `pnpm typecheck` PASS (25 packages)
- [x] `biome check src/` PASS
- [x] walkthrough.md 작성
- [x] pr_description.md 작성
