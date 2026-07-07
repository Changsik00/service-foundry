# spec-24-04: 컨트롤러 zod 검증 패턴 통일 (B2)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-24-04` |
| **Phase** | `phase-24` |
| **Branch** | `spec-24-04-zod-validation-unify` |
| **Base 브랜치** | `phase-24-refactor-hardening-2` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-22 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

auth 컨트롤러군의 zod body 검증이 **3가지 패턴**으로 산재한다 (감사 §B2):
1. **`zodPipe(Schema).transform(body)`** — 표준(공유 헬퍼 `auth-controller.shared.ts`). auth.controller(7), org.controller(3) 사용. ZodError → `BadRequestException(err.issues)`.
2. **`parseOr400(Schema, body)`** — provider-org.controller 의 **로컬 헬퍼**(zodPipe 와 동작 동일하나 중복 구현). 3 사용.
3. **raw `Schema.parse(body)`** — mfa.controller(3, **try/catch 없음** → ZodError 누출), passkey.controller(2, try/catch 로 BadRequest 변환).

### 문제점

- 동일 목적(body 검증 → 실패 시 400)에 3가지 표기 — 일관성·가독성 저하, 헬퍼 중복(`parseOr400` = `zodPipe`).
- mfa 의 raw `.parse()` 는 try/catch 가 없어 ZodError 가 전역 처리되지 않으면 **500** 으로 누출(검증 실패는 400 이어야 함).

### 해결 방안

세 패턴을 표준 **`zodPipe`** 로 수렴한다:
- provider-org: `parseOr400` 로컬 헬퍼 제거 → `zodPipe` 사용.
- mfa: raw `.parse()` → `zodPipe().transform()` (덤으로 검증실패 400 일관화).
- passkey: try/catch + `.parse()` → `zodPipe().transform()` (try/catch 제거).

동작 계약: 검증 실패 = `BadRequestException(zodError.issues)` 로 통일. 안전망은 spec-24-01 의 provider-org/mfa/passkey 단위 테스트 + 기존 e2e.

## 요구사항

1. provider-org/mfa/passkey 의 zod 검증을 `zodPipe` 로 통일.
2. `parseOr400` 로컬 헬퍼 및 불필요해진 import(ZodError 등) 제거.
3. 검증 실패 응답은 **400 (BadRequest)** 으로 일관 — mfa 포함.
4. 기존 단위 테스트(24-01) + e2e 회귀 0, lint/typecheck PASS.

## Out of Scope

- account.controller 의 `body as` 캐스트(zod 부재) — 본 spec 은 *기존 zod 패턴 통일*. account 에 zod 신규 도입은 별도 판단.
- zodPipe 자체 시그니처 변경, 검증 스키마 내용 변경.
- 패키지 이관(E) — spec-24-05/06.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] mfa 의 검증 실패가 raw ZodError(누출) → **400 BadRequest** 로 바뀐다 (의도적 개선). 기존 e2e 가 특정 상태를 기대하면 조정 — 게이트로 확인.

## 핵심 전략

| 대상 | 변경 | 이유 |
|:---:|:---|:---|
| provider-org | `parseOr400` 제거 → `zodPipe` | 중복 헬퍼 제거 |
| mfa | `.parse()` → `zodPipe().transform()` | 검증실패 400 일관화 |
| passkey | try/catch+`.parse()` → `zodPipe().transform()` | 보일러플레이트 제거 |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/provider-org.controller.ts`
`parseOr400` 함수 + `ZodError`/`z` import 제거, `zodPipe` import 후 3 콜사이트 치환.

#### [MODIFY] `apps/api/src/auth/mfa.controller.ts`
3 콜사이트 `Schema.parse(body)` → `zodPipe(Schema).transform(body)`.

#### [MODIFY] `apps/api/src/auth/passkey.controller.ts`
2 콜사이트 try/catch 제거 → `zodPipe`. 불필요해진 `BadRequestException`/`ZodError` import 정리.

## 검증 계획

```bash
cd apps/api && npx vitest run provider-org mfa passkey
npx turbo run lint typecheck
# 회귀(로컬 5434 DB): auth.e2e (mfa/passkey/oauth 흐름) (reference_local_e2e_db_recipe)
DATABASE_URL=... npx vitest run e2e.test
```

수동 검증:
1. mfa enroll/confirm 에 너무 짧은 code → 400 BadRequest (500 아님).
2. provider-org switch 에 무효 orgId → 400.

## 롤백 계획

- `git revert`. 동작 계약 보존(검증실패 400). state/마이그레이션 없음.

## ADR 후보

- [x] 없음 (기존 표준 패턴으로 수렴, 신규 결정 없음)

## ✅ Definition of Done

- [ ] provider-org/mfa/passkey zod 검증이 `zodPipe` 로 통일
- [ ] `parseOr400` + 불필요 import 제거
- [ ] 단위(24-01) + e2e 회귀 0, lint/typecheck PASS
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-24-04-zod-validation-unify` 브랜치 push 완료
