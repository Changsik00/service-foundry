# Task List: spec-23-01-test-safety-net

> 모든 task 는 한 commit 에 대응 (One Task = One Commit).
> 테스트 전용 spec — production 코드 변경 0. 각 테스트는 현재 동작 고정(characterization).

---

## Task 0: 브랜치 + phase 셋업
- [x] `git checkout -b spec-23-01-test-safety-net` (완료)
- [ ] phase-23.md / queue.md(active marker) / spec 산출물 첫 커밋에 포함
- [ ] Commit: `docs(spec-23-01): add phase-23 plan + spec/task`

---

## Task 1: account.stores 단위 테스트 (23-02 A1 가드)
- [ ] `account.stores.test.ts` — `isSoleOwnerOfAnyOrg` 분기(sole owner true / 다른 owner / 다른 member / 멤버십 없음)
- [ ] `pnpm vitest run apps/api/src/auth/account.stores.test.ts` 그린
- [ ] Commit: `test(spec-23-01): cover account.stores sole-owner logic`

---

## Task 2: jwt.service 단위 테스트 (23-02 A3 가드)
- [ ] `jwt.service.test.ts` — `toJwks`/`getJwks` (kid 포함 JWKS, 빈 keystore)
- [ ] `pnpm vitest run apps/api/src/jwt/jwt.service.test.ts` 그린
- [ ] Commit: `test(spec-23-01): cover jwt.service JWKS export`

---

## Task 3: mfa.service 단위 테스트
- [ ] `mfa.service.test.ts` — TOTP enroll/verify(유효·무효)/backup code 소비
- [ ] `pnpm vitest run apps/api/src/auth/mfa.service.test.ts` 그린
- [ ] Commit: `test(spec-23-01): cover mfa.service totp + backup`

---

## Task 4: oauth.service 단위 테스트
- [ ] `oauth.service.test.ts` — provider clientId/userInfo 매핑 + 미지원 provider 에러
- [ ] `pnpm vitest run apps/api/src/auth/oauth.service.test.ts` 그린
- [ ] Commit: `test(spec-23-01): cover oauth.service provider mapping`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] 신규 4 테스트 + `apps/api` typecheck 그린 (production diff 0 확인)

### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-23-01): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-23-01-test-safety-net`
- [ ] PR 생성 (base main)
