# feat(spec-15-03): wire login rate-limit + lockout

## 📋 Summary

### 배경 및 목적
`@repo/backend-auth-rate-limit` 의 rate-limit/lockout/store/schema 가 완비됐으나 `apps/api` SigninService 가 호출하지 않고 `failed_logins`/`lockouts` 가 appSchema 에 누락(`wiring-audit §B`) → 로그인 brute-force 무방비. 본 spec 은 이를 배선해 phase-15 성공기준2 를 충족한다.

### 주요 변경 사항
- [x] `failed_logins`/`lockouts` 를 appSchema + local.ts 에 포함 + 마이그레이션 `0008`
- [x] `RATE_LIMIT_STORE` drizzle provider + SigninService 주입
- [x] `signIn(email,password,ip)`: isLocked→checkRateLimit→verify→(실패)recordFailure+evaluateLockout/(성공)recordSuccess
- [x] 차단 응답 **429**, 비밀번호 오류는 기존 **401** 유지
- [x] 단위(5회 실패→429, 성공→reset) + e2e(전용 계정 5회→429)

### Phase 컨텍스트
- **Phase**: `phase-15` — 성공기준2(rate-limit/lockout) 충족.

## 🎯 Key Review Points
1. **호출 순서·예외 변환** (`signin.service.ts`): 선검사(isLocked/checkRateLimit) → 429, 검증 실패 → recordFailure+evaluateLockout → 401, 성공 → recordSuccess. 보안 로직은 패키지 함수 재사용.
2. **스키마 통합/마이그레이션**: 테이블 객체는 `@repo/backend-auth-rate-limit/schema` 서브패스 import. `0008_sad_ogun.sql` 검토.
3. **e2e IP 누적 안전성**: lockout 테스트 전용 계정·정확히 5회(5≪30 IP 한도) → 다른 signin 테스트 비간섭. CI fresh DB.

## 🧪 Verification
```bash
# 로컬 Postgres(5434/test) + drizzle migrate(0008) 후
pnpm turbo run lint typecheck test knip depcruise   # 136/136 ✅
```
- apps/api **100/100** (auth.e2e 40), signin.service 5/5(lockout/reset), knip/depcruise exit 0.

## 📦 Files Changed
### 🆕 New
- `apps/api/src/auth/rate-limit.stores.ts`: RATE_LIMIT_STORE DI + drizzle store factory
- `apps/api/drizzle/0008_sad_ogun.sql` (+meta): failed_logins/lockouts 마이그레이션

### 🛠 Modified
- `apps/api/src/infra/schema/{index,local}.ts`: failed_logins/lockouts 포함
- `apps/api/src/auth/signin.service.ts`: rate-limit/lockout 배선 + signIn(…,ip)
- `apps/api/src/auth/auth.module.ts`: RATE_LIMIT_STORE provider
- `apps/api/src/auth/auth.controller.ts`: signIn 에 ctx.ip 전달
- `apps/api/src/auth/{signin.service,auth.e2e}.test.ts`: lockout 시나리오

## ✅ Definition of Done
- [x] appSchema + 마이그레이션
- [x] provider + SigninService 주입
- [x] signIn 배선 (isLocked/checkRateLimit/record*)
- [x] 단위 + e2e (5회 실패→429) PASS
- [x] walkthrough / pr_description ship
- [x] lint/typecheck/knip/depcruise PASS

## 🔗 관련 자료
- Phase: `backlog/phase-15.md` · Walkthrough: `specs/spec-15-03-login-ratelimit-lockout/walkthrough.md`
- 관련: `wiring-audit §B`, ADR-0014
