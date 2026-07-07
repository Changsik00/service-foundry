refactor(spec-23-02): 핫패스 correctness/scaling 수정

## 📋 Summary

### 배경 및 목적
phase-23 두 번째 spec. spec-23-01 안전망 위에서 핫패스 4건을 최적화한다. **모두 동작 보존** — 단위 테스트 기대값 불변.

### 주요 변경 사항
- [x] **A1** `account.stores.isSoleOwnerOfAnyOrg` — owner org당 2쿼리 **N+1**(2N+1) → ownerOrgs 1쿼리 + `inArray` 다른멤버 일괄 1쿼리 = **총 2쿼리**
- [x] **A2** `api-key.service.verifyKey` — `last_used_at` UPDATE 를 **fire-and-forget**(인증 핫패스 동기쓰기 제거, 실패는 `Logger.warn`)
- [x] **A3** `jwt.service.getJwks` — **메모이즈**(요청당 `exportJWK` 재계산 제거; rotation 없으므로 안전, 무효화 주석)
- [x] **A4** `signin.service` — `createSession`·`orgClaims` **`Promise.all` 병렬화**

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base) · 가드: spec-23-01 단위 테스트

## 🎯 Key Review Points
1. **동작 보존** — A1 은 2쿼리+JS 그룹핑으로 결과 boolean 불변(테스트 4 case 동일), A2/A3/A4 는 타이밍/순서만 변경.
2. A2 fire-and-forget 은 실패를 삼키지 않고 로깅(`.catch`).
3. A3 캐시는 현재 정적 keyStore 전제 — rotation 도입 시 무효화 필요(주석 명시).

## 🧪 Verification
```bash
pnpm vitest run apps/api/src/auth/account.stores.test.ts apps/api/src/jwt/jwt.service.test.ts \
  apps/api/src/auth/api-key.service.test.ts apps/api/src/auth/signin.service.test.ts   # 20 passed
pnpm turbo run typecheck --filter=./apps/api                                            # green
```
- ✅ 20/20 그린, typecheck 그린, 변경 4파일 LSP 진단 0.
- ⚠️ 기존 biome 경고(api-key:66·signin:82, 미접촉 라인)는 본 PR 무관.

## 📦 Files Changed
- `apps/api/src/auth/account.stores.ts` (+test): N+1 → 2쿼리
- `apps/api/src/auth/api-key.service.ts`: fire-and-forget + Logger
- `apps/api/src/jwt/jwt.service.ts`: getJwks 캐시
- `apps/api/src/auth/signin.service.ts`: Promise.all

## ✅ Definition of Done
- [x] A1~A4 적용 + 단위 테스트 그린(동작 보존)
- [x] `apps/api` typecheck 그린
- [x] walkthrough/pr_description ship + push

## 🔗 관련 자료
- phase: `backlog/phase-23.md` · 가드: spec-23-01 · 인벤토리 A
