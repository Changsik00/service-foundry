# Task List: spec-23-02-hotpath-fixes

> One Task = One Commit. 모두 동작 보존 — 23-01/기존 테스트 그린 유지로 검증.

---

## Task 0: 브랜치
- [x] `git checkout -b spec-23-02-hotpath-fixes` (완료)

---

## Task 1: A1 — account.stores sole-owner 단일 쿼리
- [ ] `isSoleOwnerOfAnyOrg` 루프 → 단일 집계쿼리 (NOT EXISTS 다른 owner + EXISTS 다른 member)
- [ ] `account.stores.test.ts` mock 을 단일 쿼리형으로 갱신 (boolean 기대 4 case 동일)
- [ ] `pnpm vitest run apps/api/src/auth/account.stores.test.ts` 그린
- [ ] Commit: `refactor(spec-23-02): single-query sole-owner check (drop N+1)`

---

## Task 2: A2 — api-key last_used_at fire-and-forget
- [ ] `verifyKey` 의 UPDATE await 제거 + `.catch` 로깅
- [ ] `pnpm vitest run apps/api/src/auth/api-key.service.test.ts` 그린
- [ ] Commit: `refactor(spec-23-02): non-blocking api-key last_used_at write`

---

## Task 3: A3 — jwt.service getJwks 메모이즈
- [ ] `getJwks` 결과 캐시 + rotation 무효화 주석
- [ ] `pnpm vitest run apps/api/src/jwt/jwt.service.test.ts` 그린
- [ ] Commit: `refactor(spec-23-02): memoize JWKS export`

---

## Task 4: A4 — signin 독립 작업 병렬화
- [ ] `createSession` + `orgClaims` `Promise.all`
- [ ] `pnpm vitest run apps/api/src/auth/signin.service.test.ts` 그린
- [ ] Commit: `refactor(spec-23-02): parallelize independent signin work`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] 영향 단위 테스트 + `apps/api` typecheck/lint 그린

### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-23-02): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-23-02-hotpath-fixes`
- [ ] PR 생성 (base main)
