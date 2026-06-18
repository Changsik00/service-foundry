refactor(spec-23-05): 타입 설계 강화 (role enum + OAuthUserInfo union)

## 📋 Summary

### 배경 및 목적
phase-23 F 의 **타입설계**(F3/F4). 순수 타입 리팩토링 — 런타임 동작 불변, typecheck 가 SoT. 컨트롤러 분할(F1/F2)은 미테스트 컨트롤러+로컬 e2e 부재로 23-06 분리.

### 주요 변경 사항
- [x] **F3** `role: string` → `OrgRole`/`Role`(`@repo/auth-contracts`): org-list·org-members(OrgRole)·admin(platform Role)·org-switch(query 결과) + 프론트 `MemberTable`(+불필요 `as keyof` 제거). 프론트는 쿼리 zod 스키마를 `OrgRole` enum 으로(단일 소스).
- [x] **F4** `OAuthUserInfo` → provider 판별 discriminated union(`google` name 선택 / `kakao` 없음). 소비자는 공통 필드만 사용해 cascade 없음.

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base).

## 🎯 Key Review Points
1. **순수 타입** — 런타임 불변, typecheck 검증.
2. F3 프론트: 상태가 아니라 **쿼리 응답 zod 스키마**(`OrgRole`)를 교정해 데이터 소스부터 일치.
3. F4: 소비자(`findOrCreateOAuthUser`)가 `providerAccountId`/`email` 만 써 union 도입에도 무영향.

## 🧪 Verification
```bash
pnpm turbo run typecheck --filter=./apps/api --filter=./apps/web --filter=@repo/backend-auth-oauth  # green
pnpm vitest run packages/backend/auth-oauth apps/api/src/auth/oauth.service.test.ts                  # 22 passed
(cd apps/web && pnpm vitest run src/features/orgs/MemberTable.test.tsx)                              # 6 passed
grep -rn "role: string" apps/api/src apps/web/src | grep -v ".test"                                  # 0
```

## 📦 Files Changed
- `apps/api/src/auth/{org-list,org-members,org-switch}.service.ts`, `apps/api/src/admin/admin.service.ts`: role 타입
- `apps/web/src/features/orgs/{MemberTable.tsx,queries.ts}`: OrgRole + zod
- `packages/backend/auth-oauth/src/token.ts` (+account.test): OAuthUserInfo union

## ✅ Definition of Done
- [x] F3/F4 적용 + typecheck/기존 테스트 그린
- [x] 의도 외 `role: string` 0
- [x] ship + push

## 🔗 관련 자료
- `@repo/auth-contracts` `OrgRole`/`Role` · phase-23 · 후속: 23-06 컨트롤러 분할(F1/F2)
