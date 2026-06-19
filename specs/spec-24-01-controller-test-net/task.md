# Task List: spec-24-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> **주의**: 본 spec 은 기존 코드에 대한 characterization(동작 가드) 테스트 추가다. TDD Red 단계 없음 — 테스트는 기존 코드에 대해 즉시 PASS 해야 한다. PASS 하지 않으면 테스트의 기대값을 코드 실동작에 맞추거나(거짓 GREEN 금지), 진짜 결함이면 STOP 후 보고한다.

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-24-01-controller-test-net` (base: `phase-24-refactor-hardening-2`)

---

## Task 2: account.controller 테스트

- [x] 작성: `apps/api/src/auth/account.controller.test.ts` — 라우트별 서비스 위임 인자 + 검증/에러 분기 가드 (7 tests)
- [x] 실행 → PASS (`cd apps/api && npm run test -- account.controller`)
- [x] Commit: `test(spec-24-01): add account.controller unit tests` (bb7a4af)

---

## Task 3: session.controller 테스트

- [x] 작성: `apps/api/src/auth/session.controller.test.ts` — issueCsrf/세션 목록/취소/전체 로그아웃 위임 (5 tests)
- [x] 실행 → PASS
- [x] Commit: `test(spec-24-01): add session.controller unit tests`

---

## Task 4: org + provider-org 컨트롤러 테스트

- [x] 작성: `apps/api/src/auth/org.controller.test.ts` — org 라우트 위임 + no-org 거부 (6 tests). @OrgRoles 메타는 route-inventory(T7) 에 위임
- [x] 작성: `apps/api/src/auth/provider-org.controller.test.ts` — provider 모드 org 위임 + no-org 거부 (6 tests)
- [x] 실행 → PASS
- [x] Commit: `test(spec-24-01): add org/provider-org controller unit tests`

---

## Task 5: passkey + mfa 컨트롤러 테스트

- [x] 작성: `apps/api/src/auth/passkey.controller.test.ts` — 등록/인증 옵션·검증 위임 + zod 거부 (6 tests)
- [x] 작성: `apps/api/src/auth/mfa.controller.test.ts` — enroll/verify/disable 위임 + code 거부 (5 tests)
- [x] 실행 → PASS
- [x] Commit: `test(spec-24-01): add passkey/mfa controller unit tests`

---

## Task 6: oauth + provider-me 컨트롤러 테스트

- [x] 작성: `apps/api/src/auth/oauth.controller.test.ts` — authorize/callback 위임 + 쿠키 처리 (3 tests)
- [x] 작성: `apps/api/src/auth/provider-me.controller.test.ts` — provider me 위임 + null 폴백 (2 tests)
- [x] 실행 → PASS
- [x] Commit: `test(spec-24-01): add oauth/provider-me controller unit tests`

---

## Task 7: route-inventory 스냅샷 보강 (필요 시)

- [x] `apps/api/src/auth/route-inventory.test.ts` 확인 — 기존엔 Auth/Session/Org 만 커버, 나머지 6개 누락 확인
- [x] 누락분 EXPECTED_OTHER_ROUTES 스냅샷 보강 (account/passkey/mfa/oauth/provider-org/provider-me 22 라우트+가드)
- [x] 실행 → PASS
- [x] Commit: `test(spec-24-01): extend route-inventory snapshot for untested controllers`

---

## Task 8: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 검증**: `turbo run test lint typecheck` → 모두 PASS (회귀 0)

### 📝 산출물 작성

- [ ] **walkthrough.md 작성** (발견 사항·결함 보고·carry-over 포함)
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-24-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-24-01-controller-test-net`
- [ ] PR 생성 (base: `phase-24-refactor-hardening-2`, `/hk-pr-gh`)
