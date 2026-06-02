# fix(spec-14-03): auth.guard 가 검증된 claim 에서 role 읽기 (footgun 제거)

## 📋 Summary
### 배경
`AuthGuard` 가 `verifyAccessToken` 으로 검증한 뒤에도 **role 만은 `decodeJwt`(서명 미검증)에서 재취득**(`auth.guard.ts:55-56`). 권한 결정 claim 을 미검증 소스에서 읽는 footgun.
### 근본 원인
`narrowClaims`(auth-jwt/verify) 가 `JwtClaims` 에 표준 6개만 담고 **role 등 커스텀 claim 을 버려서** guard 가 우회했다.
### 주요 변경
- [x] **auth-jwt**: `JwtClaims` index signature + `narrowClaims` 가 검증된 커스텀 claim 보존.
- [x] **nestjs-auth**: `Role.safeParse(result.value.role)` + `decodeJwt` import/사용 제거.
- [x] 비파괴: 유효 토큰(role) 통과 / role 없음·무효 → 401.

### Phase 컨텍스트
- phase-14 성공 기준 2.

## 🎯 Key Review Points
1. role 은 이제 **서명 검증을 통과한 claim** 에서만 온다.
2. JwtClaims index signature 로 jwt 패키지는 generic 유지(role 하드코딩 안 함).
3. roles.guard 는 `req.user.role` 소비 — 자동으로 검증된 값 사용(추가 변경 없음).

## 🧪 Verification
```bash
pnpm --filter @repo/backend-auth-jwt test   # 26
pnpm --filter @repo/nestjs-auth test         # 10
```
+ 본 PR `verify` CI green.

## ✅ Definition of Done
- [x] verify 커스텀 claim 보존 + 단언
- [x] guard result.value.role + decodeJwt 제거
- [x] 단위 PASS + typecheck 0
- [ ] 본 PR CI green (관측)

## 🔗 관련
- 후속: P3 (NestJS ExceptionFilter)
