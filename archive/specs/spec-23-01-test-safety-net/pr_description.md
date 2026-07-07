test(spec-23-01): 보안 크리티컬 테스트 안전망

## 📋 Summary

### 배경 및 목적
phase-23(refactor-hardening) 첫 spec. 다음 spec(23-02 핫패스 수정)이 동작을 바꿀 모듈에 **회귀 안전망**을 먼저 깐다. 보안 크리티컬 무테스트 모듈도 함께 커버. **테스트 전용 — production 코드 변경 0.**

### 주요 변경 사항 (신규 테스트 4파일 / 17 케이스)
- [x] `account.stores.test.ts` — `isSoleOwnerOfAnyOrg` 4분기 (23-02 A1 N+1 수정 가드)
- [x] `jwt.service.test.ts` — `getJwks`/`getKeyStore` + 반복 호출 동일 kid (23-02 A3 메모이즈 가드)
- [x] `mfa.service.test.ts` — enroll/confirmEnroll(미등록·무효·유효)/isMfaEnabled/disable/잘못된 챌린지 토큰
- [x] `oauth.service.test.ts` — buildAuthorizationUrl(PKCE/client_id, 미지원 provider)/state 불일치 거부

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base) · **역할**: 23-02 핫패스 변경의 회귀 안전망(의존 선결)

## 🎯 Key Review Points
1. **characterization 테스트** — 현재 동작을 고정. 23-02 가 동작을 바꿔도(최적화) boolean/형태 결과가 같으면 그린 유지하도록 설계.
2. account.stores mock 은 `Object.assign(Promise, {limit})` 로 `where()`/`where().limit()` 두 호출형 모두 지원(biome noThenProperty 회피).
3. 정조준 범위 — 이미 테스트 있는 api-key·org-list·signin·passkey 제외.

## 🧪 Verification
```bash
pnpm vitest run apps/api/src/auth/account.stores.test.ts apps/api/src/jwt/jwt.service.test.ts \
  apps/api/src/auth/mfa.service.test.ts apps/api/src/auth/oauth.service.test.ts   # 17 passed
pnpm turbo run typecheck --filter=./apps/api                                       # green
git diff --stat main...HEAD -- ':!*.test.ts' ':!specs' ':!backlog'                 # empty (prod diff 0)
```

## 📦 Files Changed
### 🆕 New (test-only)
- `apps/api/src/auth/account.stores.test.ts`
- `apps/api/src/jwt/jwt.service.test.ts`
- `apps/api/src/auth/mfa.service.test.ts`
- `apps/api/src/auth/oauth.service.test.ts`
### 🛠 Planning
- `backlog/phase-23.md` (신규 phase 정의), `backlog/queue.md`, spec 산출물

## ✅ Definition of Done
- [x] 4개 모듈 단위 테스트 추가·통과 (17)
- [x] `apps/api` typecheck 그린
- [x] production 코드 변경 0
- [x] walkthrough/pr_description ship + push

## 🔗 관련 자료
- phase 정의: `backlog/phase-23.md` · 인벤토리: `backlog/queue.md` 🛠 (2026-06-18)
- 가드 대상: spec-23-02 (A 핫패스)
