# spec-18-04: Provider Mode Cleanup — Firebase/Supabase 외부 인증 배선

## 변경 내용

Firebase 및 Supabase 외부 인증 프로바이더를 `AUTH_MODE` 환경 변수 하나로 전환할 수 있도록 배선.
`AUTH_MODE=native`(기본값)는 기존 동작과 완전히 동일.

### DB 스키마
- `users.provider_uid TEXT UNIQUE` 컬럼 추가 (nullable — native 유저 영향 없음)
- 마이그레이션: `apps/api/drizzle/0015_provider_uid.sql`

### 인터페이스 변경
- `FirebaseProvisionPort.provisionFromProvider` 반환 타입에 `internalUserId: string` 추가
- `FirebaseVerifier`: Firebase UID 대신 `internalUserId`를 `sub`로 반환 (UUID 비-UUID 교체)

### 신규 구현
- `ProvisionService.provisionFromProvider(uid, email)` — `provider_uid` upsert + org 프로비저닝
- `ProviderAuthModule.forMode(mode, verifierModule)` — 컨트롤러 없는 provider 전용 모듈

### AppModule 조건부 배선
```
AUTH_MODE=native   → NestjsAuthModule.forRootAsync + AuthModule (기존 그대로)
AUTH_MODE=firebase → ProviderAuthModule.forMode("firebase", NestjsFirebaseAuthModule.forRoot(...))
AUTH_MODE=supabase → ProviderAuthModule.forMode("supabase", NestjsSupabaseAuthModule.forRoot(...))
```

## 검증

- `pnpm --filter @apps/api test -- provision` → 4/4 PASS
- `pnpm --filter @repo/nestjs-auth-firebase test` → 5/5 PASS
- `pnpm turbo run typecheck` → 48/48 PASS
- `pnpm depcruise` → 위반 없음

## 커밋 목록

- `test(spec-18-04)`: ProvisionService.provisionFromProvider 테스트 + DB 스키마 (Red)
- `feat(spec-18-04)`: ProvisionService.provisionFromProvider + FirebaseVerifier sub 교체
- `feat(spec-18-04)`: AUTH_MODE 조건부 배선 + ProviderAuthModule
