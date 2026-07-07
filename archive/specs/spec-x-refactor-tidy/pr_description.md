refactor(spec-x-refactor-tidy): 매직 리터럴 중앙화 + 즉시 중복/drift 제거

## 📋 Summary

### 배경 및 목적
7차원 리팩토링 감사(2026-06-18)의 첫 퀵윈. **behavior-preserving·고확신·저위험** 항목만 묶어 매직 리터럴/중복을 단일 출처로 정리한다. 핫패스·패키지 이관·컨트롤러 분할·테스트 부채는 Phase 로 분리(queue.md Icebox).

### 주요 변경 사항
- [x] **C1** signup 토큰 claim 키 → `ACTIVE_ORG_CLAIM`/`ORG_ROLE_CLAIM` 상수 (signin과 표기 일치, claim 키 회귀 테스트 추가)
- [x] **C3** invite 권한 체크 `["owner","admin"].includes()` → 기존 `@repo/backend-authz` `canInviteMember()` 재사용 (중복 제거)
- [x] **C2** 세션 30일 TTL 단일 출처화 — `@repo/backend-auth-session` 가 `SESSION_TTL_MS` export, `cookie.helper` 가 import (ms·sec 이중 정의 제거)
- [x] **D1** `@repo/backend-http-client` 의 중복 `sleep` 제거 → `@repo/utils`
- [x] **B4** worker `console.info` → `@repo/backend-logger`

### 컨텍스트
- **Mode**: SDD-x (Phase 비소속, refactor, base `main`)
- 코드 인텔리전스: Serena LSP 로 참조 추적(`find_referencing_symbols`)·타입 진단(`get_diagnostics_for_file`) 수행.

## 🎯 Key Review Points
1. **모두 동작 보존** — claim 키(C1)는 상수값이 기존 문자열과 동일, TTL(C2)은 30일 그대로, authz(C3)는 owner/admin 동일 판정.
2. **회귀 안전망 추가** — signup claim 키 가드 + invite admin 케이스.
3. C3 는 단순 상수화가 아니라 **이미 존재하던 패키지 함수 재사용**(authz 미활용 해소).

## 🧪 Verification

```bash
pnpm turbo run typecheck --filter=./apps/api --filter=./apps/worker \
  --filter=@repo/backend-auth-session --filter=@repo/backend-http-client   # green
pnpm vitest run apps/api/src/auth/signup.service.test.ts \
  apps/api/src/auth/org-invite.service.test.ts \
  packages/backend/auth-session packages/backend/http-client                # green
pnpm exec biome check <변경 7파일>                                          # clean
```
- ✅ 변경분 typecheck/단위테스트/lint 그린, Serena LSP 진단 0.

### ⚠️ 기존 환경 잡음 (본 PR 무관 — CI 영향 확인 필요)
- 로컬 `apps/api` e2e 는 DB 미마이그레이션으로 500 (main 에서도 동일 재현). CI 의 compose 스택에서 검증됨.
- `turbo run lint` 의 기존 hint 는 미접촉 파일(`oauth.service`·`admin.*`·`api-key.*`). 본 PR 변경 파일은 clean.

## 📦 Files Changed

### 🛠 Modified
- `apps/api/src/auth/signup.service.ts` (+test): claim 상수
- `apps/api/src/auth/org-invite.service.ts` (+test, +authz dep): canInviteMember
- `apps/api/src/auth/cookie.helper.ts`: SESSION_TTL_MS import
- `packages/backend/auth-session/src/{session,index}.ts`: SESSION_TTL_MS export
- `packages/backend/http-client/src/index.ts` (+utils dep): sleep dedup
- `apps/worker/src/main.ts` (+logger dep): logger

## ✅ Definition of Done
- [x] 영향 패키지 typecheck/lint/test 그린 (변경분)
- [x] C1/C3 회귀 테스트 추가·통과
- [x] walkthrough/pr_description ship + 브랜치 push
- [x] 회귀 0 (기존 e2e/lint 잡음은 main 동일 재현으로 무관 확인)

## 🔗 관련 자료
- 감사 인벤토리: `backlog/queue.md` 🛠 리팩토링 감사 (2026-06-18)
- 재사용: `@repo/backend-authz` `canInviteMember`, `@repo/utils` `sleep`
