fix(spec-24-02): resolve phase-23 retro defects Wa/We/Wf

## 📋 Summary

### 배경 및 목적
phase-23 회고에서 "이월" 결정된 잔여 Warning 중 작고 독립적인 3건을 묶어 처리한다.

### 주요 변경 사항
- [x] **Wa** — OAuth: known provider(google/kakao)인데 client id/secret env 가 비면 `?? ""` 대신 `AppError`(INTERNAL/500) **fail-fast**. (`requireEnv` 헬퍼)
- [x] **We** — `orgRole` claim 을 AuthGuard 에서 `OrgRole.safeParse` 로 **런타임 검증**(무효 → null 폴백, fail-closed). `AuthenticatedUser.orgRole` 타입 `string | null` → `OrgRole | null`, `org-roles.guard` 의 `as OrgRole` 캐스트 제거.
- [x] **Wf** — ADR-0027 에 AppErrorFilter 하드닝(statusCode 클램프 + 5xx 본문 message/details 억제) 명문화.

### Phase 컨텍스트
- **Phase**: `phase-24` — 회고 잔여 결함 정리 (spec-24-01 안전망 직후)

## 🎯 Key Review Points

1. **Wa fail-fast 범위**: known provider 의 env 누락만 throw. unknown provider 는 기존 404 유지. 빈 client_id 로 진행하던 e2e 는 client env 주입으로 정정(`auth.e2e.test.ts`).
2. **We fail-closed**: 위조/손상 orgRole → null. 인증은 유효하되 org 스코프 권한 박탈. 타입 변경이 apps/api typecheck 회귀 0.
3. **Wf 문서-코드 정합**: 필터 주석이 가리키던 ADR-0027 에 실제 하드닝 동작을 기술.

## 🧪 Verification

```bash
# 로컬 5434 DB 기동 후 (CI verify.yml 동일)
turbo run lint typecheck test
```
**결과**: ✅ 142/142 task. apps/api 340 tests(단위+e2e), nestjs-auth 28 tests, lint/typecheck 회귀 0.

- oauth.service env 누락 fail-fast: 2 cases ✅
- auth.guard orgRole 검증(null폴백/보존): 2 cases ✅

> 로컬 e2e 는 5434 테스트 DB 필요(`reference` recipe). 머지 전 CI verify 그린 필수.

## 📦 Files Changed

### 🛠 Modified Files
- `apps/api/src/auth/oauth.service.ts`: `requireEnv` fail-fast (Wa)
- `packages/nestjs/auth/src/auth.guard.ts`: orgRole 검증 + 타입 (We)
- `packages/nestjs/auth/src/org-roles.guard.ts`: 캐스트 제거 (We)
- `packages/nestjs/auth/src/verifier.ts`: 주석 (We)
- `docs/adr/0027-error-handling-layering.md`: 하드닝 문서화 (Wf)
- `apps/api/src/auth/oauth.service.test.ts`, `packages/nestjs/auth/src/auth.guard.test.ts`, `apps/api/src/auth/auth.e2e.test.ts`: 테스트

**Total**: 8 files changed

## ✅ Definition of Done

- [x] Wa fail-fast + 테스트 PASS
- [x] We 런타임 검증 + 타입 정정 + 캐스트 제거 + 테스트 PASS
- [x] Wf ADR-0027 보강
- [x] lint/typecheck PASS, e2e 회귀 0
- [x] walkthrough / pr_description ship commit

## 🔗 관련 자료

- Phase: `backlog/phase-24.md`
- ADR: `docs/adr/0027-error-handling-layering.md`
