# spec-24-03: account.controller 분할 (F2)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-24-03` |
| **Phase** | `phase-24` |
| **Branch** | `spec-24-03-account-controller-split` |
| **Base 브랜치** | `phase-24-refactor-hardening-2` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-22 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

`apps/api/src/auth/account.controller.ts`(277 LOC)는 **두 서비스**(AccountService + EmailChangeService)에 의존하며 6개 라우트를 한 컨트롤러에 담고 있다. phase-23 감사 §F2 가 분할을 지목했다. spec-24-01 이 account.controller 단위 테스트 + route-inventory 스냅샷(account 6 라우트)을 깔아둬 분할 회귀 가드가 확보됐다.

라우트 / 의존:
- AccountService: `PATCH password`, `PATCH profile`, `DELETE`(탈퇴), `POST avatar`
- EmailChangeService: `POST email/change-request`, `POST email/change-confirm`

### 문제점

- 단일 컨트롤러가 두 도메인(계정 본체 vs 이메일 변경)을 섞어 책임이 흐리고 277 LOC 로 비대.
- `auth.module` + `provider-auth.module` 양쪽에 등록돼 있어 분할 시 양쪽 갱신 필요.

### 해결 방안

**서비스 의존 경계**로 2분할한다 (F1 auth.controller 3분할, spec-23-06 패턴 재사용):
- **AccountController**: password/profile/delete/avatar (AccountService) — prefix `auth/account` 유지.
- **EmailChangeController**(신규): email/change-request·email/change-confirm (EmailChangeService) — prefix `auth/account` 유지.

URL·가드는 **완전 보존**(prefix 동일) — route-inventory 스냅샷이 이를 검증. 양 모듈의 controllers 배열에 EmailChangeController 추가.

## 요구사항

1. EmailChangeController 추출 — 이메일 변경 2 라우트를 EmailChangeService 와 함께 이동.
2. AccountController 는 AccountService 만 의존, LOC 200 이하 (성공기준 #3).
3. URL·가드·응답 동작 **완전 보존** — route-inventory 스냅샷 PASS, 기존 e2e(account/email-change) 회귀 0.
4. `auth.module` + `provider-auth.module` 양쪽에 EmailChangeController 등록.
5. 테스트 재배치: account.controller.test 의 이메일 케이스를 email-change.controller.test 로 이동, route-inventory 에 EmailChangeController 반영.

## Out of Scope

- zod 패턴 통일(B2) — spec-24-04.
- avatar 별도 컨트롤러 분리 (AccountService 의존이라 account 에 잔류 — LOC 목표 달성 시 불필요).
- 서비스/스토어 로직 변경, 신규 기능.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 분할 단위: **서비스 의존 경계 2분할**(Account / EmailChange) 채택. avatar 는 AccountService 라 account 에 잔류.

> [!WARNING]
> - [ ] URL prefix 동일 유지가 핵심 — 분할로 경로가 바뀌면 클라이언트 breaking. route-inventory 스냅샷이 가드.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **EmailChangeController** | 신규 추출, prefix `auth/account` 유지 | 서비스 의존 분리 + URL 보존 |
| **AccountController** | EmailChangeService 의존 제거 | 단일 서비스, LOC 감축 |
| **양 모듈** | controllers 에 EmailChangeController 추가 | auth/provider 양 모드 등록 |
| **route-inventory** | EmailChangeController 추가, 스냅샷 동일 유지 | 분할 회귀(URL/가드) 가드 |

## Proposed Changes

#### [NEW] `apps/api/src/auth/email-change.controller.ts`
이메일 변경 request/confirm 라우트 + EmailChangeService 의존.

#### [MODIFY] `apps/api/src/auth/account.controller.ts`
이메일 변경 라우트·EmailChangeService 의존 제거 (password/profile/delete/avatar 만 잔류).

#### [MODIFY] `apps/api/src/auth/auth.module.ts` · `provider-auth.module.ts`
controllers 배열에 EmailChangeController 추가.

#### [NEW] `apps/api/src/auth/email-change.controller.test.ts`
이메일 변경 위임 테스트 (account.controller.test 에서 이동).

#### [MODIFY] `apps/api/src/auth/account.controller.test.ts`
이메일 변경 케이스 제거 (잔류 라우트만).

#### [MODIFY] `apps/api/src/auth/route-inventory.test.ts`
OTHER_CONTROLLERS 에 EmailChangeController 추가 (EXPECTED 스냅샷 문자열 불변).

## 검증 계획

```bash
cd apps/api && npx vitest run --exclude '**/*.e2e.test.ts'
# 회귀(로컬 5434 DB): account.e2e / email-change.e2e 포함 (reference_local_e2e_db_recipe)
DATABASE_URL=... npx vitest run account.e2e email-change e2e.test
npx turbo run lint typecheck
```

수동 검증:
1. route-inventory 스냅샷 → account 6 라우트(분할 후에도) 동일.
2. account.controller LOC < 200.

## 롤백 계획

- `git revert`. 라우트/가드 보존이라 동작 영향 없음. state/마이그레이션 없음.

## ADR 후보

- [x] 없음 (F1 선례 패턴 재사용, 신규 결정 없음)

## ✅ Definition of Done

- [ ] EmailChangeController 추출 + 양 모듈 등록
- [ ] account.controller LOC < 200, AccountService 만 의존
- [ ] route-inventory 스냅샷 PASS (URL/가드 보존), 테스트 재배치 PASS
- [ ] e2e(account/email-change) 회귀 0, lint/typecheck PASS
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-24-03-account-controller-split` 브랜치 push 완료
