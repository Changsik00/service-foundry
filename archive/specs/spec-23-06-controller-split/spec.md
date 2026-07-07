# spec-23-06: auth.controller 분할 (F1) + 라우트 보존 안전망

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-06` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-06-controller-split` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-19 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
`apps/api/src/auth/auth.controller.ts` 가 **639 LOC / 17 라우트** 로 비대 — auth 코어 + 세션 + org 책임이 한 클래스에 혼재. 컨트롤러는 단위 테스트가 없고 로컬 e2e 는 DB 부재로 못 돈다.

### 문제점
- 단일 컨트롤러가 3개 관심사(인증 코어 / 세션 / org)를 담아 인지부하·테스트 격리 어려움.
- **분할 시 라우트 회귀 위험** — 로컬 e2e 부재로 검증 공백.

### 해결 방안
1. **DB-free 라우트 메타 스냅샷 테스트** 를 먼저 추가 (NestJS `PATH_METADATA`/`METHOD_METADATA` 리플렉션으로 현재 17 라우트 고정) → 분할 후에도 동일 라우트셋 보장.
2. `auth.controller` 를 관심사별 3 컨트롤러로 분할(모두 `@Controller("auth")` prefix 유지 → URL 불변):
   - **SessionController**: `csrf`, `sessions`(GET·DELETE·DELETE :id) — deps `CSRF_SECRET`, `SessionManagementService`.
   - **OrgController**: `org/switch`·`org/invite`·`org/invite/accept`·`org/members` — deps `OrgSwitchService`/`OrgInviteService`/`OrgMembersService`(+핸들러 확인).
   - **AuthController**(잔여 9): signin/signup/signout/refresh/me/password×2/email×2.
3. 핸들러 본문·데코레이터(@Api*/@UseGuards/@Post 등) **verbatim 이동**, 각 컨트롤러는 자기 핸들러가 쓰는 서비스만 주입. `auth.module` 에 3 컨트롤러 등록.

### 검증 전략 (로컬 e2e 부재 보완)
- **라우트 메타 테스트**: 3 컨트롤러의 (method, path) 합집합 === 스냅샷 17개.
- **typecheck**: 핸들러가 참조하는 서비스가 해당 컨트롤러에 주입됐는지 정적 보장(미주입 시 컴파일 에러).
- CI e2e(auth.e2e)가 PR 에서 런타임 회귀 포착.

## 요구사항
1. `apps/api/src/auth/__route-inventory.test.ts`(가칭) — 분할 후 컨트롤러들의 라우트셋 == 17 스냅샷.
2. SessionController / OrgController 추출 + AuthController 잔여 정리. URL·데코레이터·가드 불변.
3. `auth.module` 에 신규 컨트롤러 등록(기존 AuthController 1개 → 3개).

## Out of Scope
- **F2 account.controller(277LOC) 분할** → 23-07(후속).
- 핸들러 로직 변경 — 순수 이동(동작 보존).
- B2, D2/3/4/6.

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 컨트롤러 분할은 라우트/DI 재배선 — 로컬은 typecheck + 라우트 메타 테스트로 검증, 런타임 회귀는 CI e2e 의존. (사용자 option 2 선택)

## 핵심 전략
| 컨트롤러 | 라우트 | 주입 |
|:---:|:---|:---|
| SessionController | csrf, sessions×3 | CSRF_SECRET, SessionManagementService |
| OrgController | org/switch·invite·accept·members | Org{Switch,Invite,Members}Service |
| AuthController | signin/signup/signout/refresh/me/password×2/email×2 | 잔여 deps |

## Proposed Changes
#### [NEW] `apps/api/src/auth/route-inventory.test.ts`
3 컨트롤러 라우트셋 == 17 스냅샷 (리플렉션, DB-free).
#### [NEW] `apps/api/src/auth/session.controller.ts` · `org.controller.ts`
auth.controller 에서 해당 핸들러 verbatim 이동.
#### [MODIFY] `apps/api/src/auth/auth.controller.ts`
세션·org 핸들러 제거 후 코어 9개만 + 생성자 deps 정리.
#### [MODIFY] `apps/api/src/auth/auth.module.ts`
SessionController·OrgController 등록.

## 검증 계획
```bash
pnpm vitest run apps/api/src/auth/route-inventory.test.ts   # 라우트셋 == 17
pnpm turbo run typecheck lint --filter=./apps/api           # DI/이동 정합
grep -cE "@(Get|Post|Put|Patch|Delete)\(" apps/api/src/auth/{auth,session,org}.controller.ts  # 합 17
```

## ADR 후보
- [x] 없음 — 구조 분할(동작 보존).

## ✅ Definition of Done
- [ ] 라우트 메타 테스트 그린(17 보존)
- [ ] 3 컨트롤러 분할 + 모듈 등록, typecheck/lint 그린
- [ ] walkthrough/pr_description ship + push
