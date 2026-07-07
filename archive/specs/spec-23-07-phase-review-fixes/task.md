# Task List: spec-23-07-phase-review-fixes

> One Task = One Commit. 회고 결함 수정 — 각 결함을 테스트로 가드.

---

## Task 0: 브랜치
- [x] `git checkout -b spec-23-07-phase-review-fixes` (완료)

---

## Task 1: C1 — AppErrorFilter 하드닝 (status 클램프 + 5xx 새니타이즈)
- [x] 필터: statusCode 400~599 외 → 500, 5xx 는 message="Internal error" + details 제거(4xx 유지)
- [x] `app-error.filter.test.ts`: statusCode 0→500, 5xx 새니타이즈, 4xx details 유지 케이스 추가
- [x] `pnpm vitest run apps/api/src/infra/app-error.filter.test.ts` 그린
- [x] Commit: `fix(spec-23-07): harden AppErrorFilter (status clamp + 5xx sanitize)`

---

## Task 2: C2 — route-inventory 에 @OrgRoles 메타 포함
- [x] `route-inventory.test.ts`: `ORG_ROLES_KEY` 메타를 라우트 시그니처에 포함, org/invite 기대값에 `[admin,owner]` 반영
- [x] `pnpm vitest run apps/api/src/auth/route-inventory.test.ts` 그린
- [x] Commit: `test(spec-23-07): assert @OrgRoles metadata in route inventory`

---

## Task 3: 테스트 무결성 보강 (JWKS 메모이즈 + MFA verifyMfa)
- [x] `jwt.service.test.ts`: `toJwks` spy → 반복 호출 시 1회만(메모이즈) 단언
- [x] `mfa.service.test.ts`: verifyMfa 유효challenge+잘못된TOTP·backup→reject, 유효backup→소모(updateEnabled) 
- [x] `pnpm vitest run apps/api/src/jwt/jwt.service.test.ts apps/api/src/auth/mfa.service.test.ts` 그린
- [x] Commit: `test(spec-23-07): verify JWKS memoization + MFA verify branches`

---

## Task 4: C3 — 장부 정합성
- [x] `queue.md`: 이월(A5/B2/D2-D6/F2) Icebox 승격 + 인벤토리 A1-A4/F1/F3/F4 완료표시 + 오류 날짜 정정
- [x] `phase-23.md`: 상태 Done, Done 체크박스, 검증 결과(통합 시나리오 CI green) + 성공기준 △ 정직 기록
- [x] Commit: `docs(spec-23-07): phase-23 ledger cleanup + honest success criteria`

---

## Task 5: Ship (필수)
### 🚦 Pre-Push Quality Gate
- [x] 영향 테스트 + `apps/api` typecheck 그린
### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-23-07): ship walkthrough and pr description`
### 🚀 Push & PR
- [x] `git push -u origin spec-23-07-phase-review-fixes`
- [x] PR 생성 (base main)
