# Walkthrough: spec-06-01 — NestJS 인증 어댑터 (auth-nestjs)

## 증거 로그

### 전체 테스트 (10 tests PASS)

```
✓ src/auth.guard.test.ts   5 tests
✓ src/roles.guard.test.ts  5 tests

Test Files  2 passed (2)
Tests       10 passed (10)
Duration    274ms
```

### Typecheck & Biome

```
turbo typecheck: 25 successful, 25 total
biome check src/: Checked 7 files. No fixes applied.
```

### 커밋 목록

```
dd8d29f feat(spec-06-01): NestjsAuthModule + apps/api 연동
595b27b feat(spec-06-01): RolesGuard + @Roles + @CurrentUser 데코레이터
6f26506 feat(spec-06-01): AuthGuard — bearer 검증 + AuthenticatedUser 부착
c7905fc chore(spec-06-01): @repo/nestjs-auth 패키지 스캐폴드
```

---

## 설계 결정 기록

### 1. role 추출: `verifyAccessToken` + `decodeJwt` 2단계 조합

`verifyAccessToken` 은 서명/만료/iss/aud 검증만 하고 `JwtClaims = { sub, iss, aud, jti, iat, exp }` 를 반환한다. `role` custom claim 이 포함되지 않는다. 서명 검증 이후 `decodeJwt(token)` 로 full payload 를 읽어 `Role.safeParse(decoded.role)` 로 검증한다. `JwtClaims` 타입 확장 없이 처리 가능하다.

### 2. Guard 등록 방식: 전역 APP_GUARD 아님 — opt-in

`BackendThrottlerModule` 과 달리 전역 `APP_GUARD` 로 등록하지 않는다. `NestjsAuthModule.forRoot/forRootAsync` 는 `AuthGuard` / `RolesGuard` 를 provider 로 export 하고, 컨트롤러에서 `@UseGuards(AuthGuard, RolesGuard)` 로 개별 적용한다. 전역 등록 시 public endpoint 전체 차단 부작용 방지.

### 3. keyStore lazy getter 패턴

`NestjsAuthOptions.keyStore: KeyStore | (() => KeyStore)`. apps/api 에서 `JwtService.getKeyStore()` 를 호출 시점이 DI provider 팩토리 실행 중이면 `onModuleInit` 이 아직 미실행이라 `undefined` 를 반환할 수 있다. `() => jwtSvc.getKeyStore()` lazy getter 로 실제 request 처리 시점에 호출 → 항상 초기화된 keyStore 가 반환된다.

### 4. biome.json override 확장

`packages/nestjs/**/src/**` 경로를 `unsafeParameterDecoratorsEnabled: true` override 에 추가했다. apps/api 에만 설정되어 있던 것을 NestJS 어댑터 패키지 전체로 확장.

### 5. `Reflector` runtime import + biome-ignore

`RolesGuard` 의 `constructor(private readonly reflector: Reflector)` — NestJS DI 는 `emitDecoratorMetadata` 로 생성된 타입 메타데이터(= `Reflector` 클래스 참조)로 주입을 결정한다. `import type` 으로 변경하면 메타데이터에 `Object` 가 기록되어 DI 실패. `biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference` 주석 추가.

### 6. `NestjsAuthAsyncOptions.useFactory` 타입

`(...args: any[]) => ...` 로 정의. NestJS 의 `FactoryProvider` 패턴과 일치. `(...args: unknown[])` 은 호출자 쪽에서 `(jwtSvc: JwtService) => ...` 같이 구체 타입 인수를 쓸 때 TS 오류 발생.
