# spec-x-refactor-tidy: 매직 리터럴 중앙화 + 즉시 중복/drift 제거

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-refactor-tidy` |
| **Phase** | `phase-x` |
| **Branch** | `spec-x-refactor-tidy` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
7차원 리팩토링 감사(2026-06-18, queue.md Icebox)에서 다수 대상이 식별됐다. 본 spec 은 그중 **behavior-preserving·고확신·저위험** 항목만 묶는 첫 퀵윈이다. 핫패스(A)·패키지 이관(E)·컨트롤러 분할(F)·테스트 부채(G)는 Phase 로 분리한다.

### 문제점 (모두 실측 확인됨)
- **C1**: `apps/api/src/auth/signup.service.ts:36` 가 JWT claim 을 `activeOrgId:`/`orgRole:` **평문 키**로 작성 — signin.service 는 `[ACTIVE_ORG_CLAIM]`/`[ORG_ROLE_CLAIM]` 상수 사용. 동일 클레임의 키 표기 drift (spec-17-08 와 같은 클래스, 상수 존재하는데 미사용).
- **C3**: `apps/api/src/auth/org-invite.service.ts:47` 가 `["owner","admin"].includes(membership.role)` 하드코딩 — 이는 `@repo/backend-authz` 의 `canInviteMember(orgRole)` 와 정확히 동일 로직(이미 존재).
- **C2**: 30일 세션 TTL 이 `packages/backend/auth-session/src/session.ts`(ms)와 `apps/api/src/auth/cookie.helper.ts`(sec×1000) **두 곳에 독립 정의** — 한쪽만 바꾸면 쿠키 만료와 세션 만료가 어긋나는 drift 위험.
- **D1**: `packages/backend/http-client/src/index.ts:41` 가 `sleep()` 를 재구현 — `@repo/utils` 가 동일 export 보유.
- **B4**: `apps/worker/src/main.ts` 가 `console.info` 2곳 사용 — 레포 규약(ARCHITECTURE §0: bash/console 글루 최소, 구조화 로깅) 위반.

### 해결 방안
각 리터럴/중복을 단일 출처(기존 상수·기존 패키지 함수)로 교체한다. **모두 동작 보존**이며, 보안 관련(C1 claim 키·C3 authz)은 회귀 안전망으로 테스트를 먼저 보강한 뒤 교체한다.

## 요구사항

1. signup 토큰 claim 키를 `ACTIVE_ORG_CLAIM`/`ORG_ROLE_CLAIM` 상수로 — 결과 키는 동일("activeOrgId"/"orgRole") 검증.
2. org-invite 권한 체크를 `canInviteMember()` 로 — 하드코딩 배열 제거.
3. 세션 30일 TTL 단일 출처화 — `@repo/backend-auth-session` 가 TTL 상수를 export, `cookie.helper` 가 import.
4. `backend/http-client` 의 로컬 `sleep` 제거 → `@repo/utils` import.
5. worker `console.info` → 주입 logger (또는 `@repo/backend-logger`).

## Out of Scope

- **A(핫패스: N+1·JWKS·Promise.all)**, **E(패키지 이관)**, **F(컨트롤러 분할)**, **G(테스트 부채 일괄)** — Phase 후보.
- **B1(throw→AppError)/B2(zod parse)** — 건별 의도 판단 필요, 별도 검토.
- **H(데드코드)** — knip 재검증 필요, 후속 spec-x.
- **C4(이메일 TTL·페이지네이션·Bearer 등 잔여 리터럴)** — 본 PR 범위 외, 후속(과도한 잡탕 방지).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 퀵윈 spec-x 분리 + 나머지 Phase/Icebox (사용자 승인 완료)

## 핵심 전략

| 항목 | 전략 | 이유 |
|:---:|:---|:---|
| C1 | 기존 상수 computed key | 결과 동일, drift 제거 |
| C3 | 기존 `canInviteMember` 재사용 | 중복 제거 + 권한 로직 단일화 |
| C2 | TTL 상수 export/import | 30일 단일 출처 |
| D1 | `@repo/utils` import | 자명한 중복 |
| B4 | logger 사용 | 규약 준수 |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/signup.service.ts`
claim 객체를 `{ sub, role, [ACTIVE_ORG_CLAIM]: orgId, [ORG_ROLE_CLAIM]: orgRole }` 로.

#### [MODIFY] `apps/api/src/auth/org-invite.service.ts`
`["owner","admin"].includes(...)` → `canInviteMember(membership.role)` (`@repo/backend-authz`).

#### [MODIFY] `packages/backend/auth-session/src/session.ts` + `apps/api/src/auth/cookie.helper.ts`
TTL 상수(`SESSION_TTL_MS`) export 후 cookie.helper 가 import (sec 환산 1회).

#### [MODIFY] `packages/backend/http-client/src/index.ts`
로컬 `sleep` 삭제 → `import { sleep } from "@repo/utils"`.

#### [MODIFY] `apps/worker/src/main.ts`
`console.info` → logger.

## 검증 계획

```bash
# 동작 보존 — 영향 패키지 테스트 + 타입 + 린트 그린
pnpm turbo run typecheck lint --filter=@repo/backend-http-client --filter=@repo/backend-auth-session
pnpm turbo run test --filter=./apps/api --filter=@repo/backend-auth-session --filter=@repo/backend-authz
# C1/C3 회귀: signup 토큰 claim 키 + invite 권한 거부 테스트 통과
# 잔여 하드코딩 0 확인
grep -n 'activeOrgId:' apps/api/src/auth/signup.service.ts        # → 0 (상수 치환 후)
grep -n '\["owner", "admin"\]' apps/api/src/auth/org-invite.service.ts  # → 0
grep -n 'const sleep' packages/backend/http-client/src/index.ts   # → 0
```

수동 검증 시나리오:
1. signup → 발급 토큰 디코드 시 `activeOrgId`/`orgRole` 클레임 동일 존재.
2. member(비-owner/admin) invite 시 거부 유지.

## ADR 후보
- [x] 없음 — 기존 결정/상수 준수일 뿐 신규 결정 아님.

## ✅ Definition of Done

- [ ] 영향 패키지 typecheck/lint/test 그린
- [ ] C1/C3 회귀 테스트 추가·통과
- [ ] 잔여 하드코딩 grep 0
- [ ] `walkthrough.md`/`pr_description.md` ship commit + 브랜치 push
