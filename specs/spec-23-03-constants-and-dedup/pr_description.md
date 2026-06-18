refactor(spec-23-03): 잔여 상수 중앙화 + 페이지네이션 타입 dedup

## 📋 Summary

### 배경 및 목적
phase-23 §11.3 재구성 후 **저위험 behavior-preserving** cleanup. (B 에러컨벤션은 23-04 로 이동 — 미테스트 컨트롤러 안전망 선행 필요.)

### 주요 변경 사항
- [x] **C4a** 이메일 토큰 24h TTL 3곳(email-change·email-verify `TOKEN_TTL_MS` + org-invite 인라인) → 공유 `EMAIL_TOKEN_TTL_MS`
- [x] **C4b** 페이지네이션 default(20)/max(100) 매직넘버 → `PAGINATION_DEFAULT_LIMIT`/`PAGINATION_MAX_LIMIT` (`@repo/contracts`)
- [x] **D5** 커서 페이지네이션 **Params** 중복(org-members·admin org/user 4곳) → `@repo/contracts` `CursorPaginationParams`

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base). 모두 동작 보존.

## 🎯 Key Review Points
1. **동작 보존** — 상수 값(24h·20·100) 불변, 타입은 Params alias(필드 동일).
2. **Result 키 유지** — `members`/`orgs`/`users` 를 `items` 로 통일하지 **않음**(API 응답 키 변경=breaking). Params 만 통일.
3. typecheck 가 타입 안전성의 SoT (순수 타입 리팩토링).

## 🧪 Verification
```bash
pnpm turbo run typecheck --filter=@repo/contracts --filter=./apps/api   # green
pnpm vitest run packages/shared/contracts                                # 14 passed
grep -rn "24 \* 60 \* 60 \* 1000" apps/api/src | grep -v ".test.ts"      # 상수 정의 외 0
```

## 📦 Files Changed
### 🆕 New
- `apps/api/src/auth/token-ttl.constants.ts`
### 🛠 Modified
- `apps/api/src/auth/{email-change,email-verify,org-invite}.service.ts`: EMAIL_TOKEN_TTL_MS
- `packages/shared/contracts/src/pagination.ts`: 상수 + CursorPaginationParams
- `apps/api/src/admin/admin.service.ts`, `apps/api/src/auth/org-members.service.ts`: Params 타입 통일

## ✅ Definition of Done
- [x] C4a/C4b/D5 적용 + typecheck/기존 테스트 그린
- [x] 24h 인라인 리터럴 0
- [x] walkthrough/pr_description ship + push

## 🔗 관련 자료
- phase: `backlog/phase-23.md` (§11.3 재구성 결정 기록) · 다음: 23-04(B)
