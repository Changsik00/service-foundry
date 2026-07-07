# spec-24-02: 회고 잔여 결함 묶음 (Wa/We/Wf)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-24-02` |
| **Phase** | `phase-24` |
| **Branch** | `spec-24-02-retro-defects` |
| **Base 브랜치** | `phase-24-refactor-hardening-2` |
| **상태** | Planning |
| **타입** | Fix (+ docs) |
| **작성일** | 2026-06-19 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

phase-23 회고(/hk-phase-review)에서 식별돼 "이월" 결정된 잔여 Warning 중, 작고 독립적인 3건(Wa/We/Wf)을 한 spec 으로 묶어 처리한다. (Wb/Wd 는 테스트 독립성·route-inventory 근본 개선으로 범위가 커서 별도.)

### 문제점

- **Wa — OAuth 빈 시크릿 silent pass**: `oauth.service.getClientId/getClientSecret` 가 known provider(google/kakao)인데 해당 env 가 없으면 `?? ""` 로 **빈 문자열을 조용히 반환**한다. 빈 client_id/secret 으로 authorize URL 생성·code 교환이 진행돼, provider 측에서 모호한 오류가 나거나 디버깅이 어렵다. 설정 누락은 fail-fast 가 옳다.
- **We — orgRole 런타임 검증 부재**: `AuthGuard` 는 `role` 을 `Role.safeParse` 로 검증하지만 `orgRole` 은 **검증 없이 raw string** 으로 `AuthenticatedUser.orgRole: string | null` 에 담는다. `org-roles.guard` 의 `orgRole as OrgRole` 는 컴파일타임 캐스트일 뿐 런타임 보장이 없다. 위조/손상된 orgRole claim 이 타입상 유효한 OrgRole 로 취급될 여지.
- **Wf — ADR-0027 문서 누락**: spec-23-07 의 `AppErrorFilter` 하드닝(① 비정상 statusCode 를 500 으로 **클램프**, ② **5xx 응답의 internal message/details 억제**)이 코드 주석은 "ADR-0027" 을 가리키지만 ADR 본문엔 해당 동작이 기술돼 있지 않다. (일반 5xx→statusCode 변경만 문서화됨.)

### 해결 방안

- Wa: known provider 의 env 누락 시 `AppError`(fail-fast, 5xx 설정오류)로 throw. unknown provider 의 기존 404 분기는 유지.
- We: `AuthGuard` 에서 `orgRole` 을 `OrgRole.safeParse` 로 검증 — null 이면 그대로 null, 비-null 인데 무효면 **null 로 폴백(fail-closed, org 스코프 거부)**. `AuthenticatedUser.orgRole` 타입을 `OrgRole | null` 로 좁히고 `org-roles.guard` 의 `as OrgRole` 캐스트 제거.
- Wf: ADR-0027 의 Decision/Consequences 에 필터 하드닝 2동작을 명문화.

## 요구사항

1. OAuth: known provider 의 client id/secret env 누락 시 빈 문자열 대신 명확한 오류로 fail-fast.
2. orgRole 은 인증 경계(AuthGuard)에서 OrgRole enum 으로 런타임 검증되어야 한다.
3. `AuthenticatedUser.orgRole` 타입이 `OrgRole | null` 로 정확해야 하고, 하위 가드의 비검증 캐스트가 제거되어야 한다.
4. ADR-0027 이 AppErrorFilter 의 클램프 + 5xx 본문 억제 동작을 문서화한다.
5. 신규/변경 동작은 단위 테스트로 가드, 기존 e2e 회귀 0.

## Out of Scope

- Wb (account.stores 테스트 독립성 재작성), Wd (route-inventory 컨트롤러 인스턴스화/가드 순서/하드코딩) — 별도.
- OAuth provider 추가, orgRole 정책 변경, 에러 처리 레이어링 재설계.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] We 의 무효 orgRole 처리: **null 폴백(fail-closed, 추천)** vs **401 거부**. 추천은 null 폴백 — 인증 자체는 유효하되 org 스코프 권한만 박탈(OrgRolesGuard 가 자연히 거부).

> [!WARNING]
> - [ ] `AuthenticatedUser.orgRole` 타입 변경(`string | null` → `OrgRole | null`)은 소비처 타입에 영향 가능 — typecheck 로 회귀 확인.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **oauth.service** (Wa) | env 누락 → `AppError`(설정오류) throw, 빈 문자열 금지 | fail-fast, 디버깅성. 전역 필터가 HTTP 매핑(ADR-0027) |
| **auth.guard / verifier** (We) | `OrgRole.safeParse` 검증 + 타입 `OrgRole | null` | role 과 동일한 경계 검증 일관성, fail-closed |
| **org-roles.guard** (We) | `as OrgRole` 캐스트 제거 | 타입이 정확해져 캐스트 불필요 |
| **ADR-0027** (Wf) | 필터 하드닝 2동작 문서화 | 코드-문서 정합 |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/oauth.service.ts`
`getClientId`/`getClientSecret`: known provider env 누락 시 `?? ""` → `AppError` throw.

#### [MODIFY] `packages/nestjs/auth/src/auth.guard.ts`
`AuthenticatedUser.orgRole: OrgRole | null` 로 타입 변경 + AuthGuard 에서 `OrgRole.safeParse` 검증(무효 → null 폴백).

#### [MODIFY] `packages/nestjs/auth/src/verifier.ts`
주석 갱신(orgRole 도 호출자 검증 대상임을 명시).

#### [MODIFY] `packages/nestjs/auth/src/org-roles.guard.ts`
`orgRole as OrgRole` 캐스트 제거.

#### [MODIFY] `docs/adr/0027-error-handling-layering.md`
필터 하드닝(클램프 + 5xx 본문 억제) 동작 명문화.

#### [NEW/MODIFY] 테스트
oauth.service env 누락 throw, auth.guard orgRole 검증, (해당 시) org-roles.guard 동작.

## 검증 계획

```bash
cd apps/api && npx vitest run oauth.service
pnpm --filter @repo/nestjs-auth test    # 또는 turbo run test --filter
npx turbo run lint typecheck
# 회귀: 로컬 5434 DB 기동 후 e2e (reference_local_e2e_db_recipe)
```

수동 검증:
1. GOOGLE_CLIENT_ID 미설정 + google authorize → 명확한 설정오류(빈 문자열 진행 아님).
2. 위조 orgRole claim → org 스코프 엔드포인트 거부(fail-closed).

## 롤백 계획

- `git revert`. state/마이그레이션/외부 부수효과 없음. (orgRole 폴백은 fail-closed 라 보안상 안전한 방향)

## ADR 후보

- [x] 기존 ADR-0027 보강(신규 ADR 아님) — Wf

## ✅ Definition of Done

- [ ] Wa: oauth env 누락 fail-fast + 테스트 PASS
- [ ] We: orgRole 런타임 검증 + 타입 정정 + 캐스트 제거 + 테스트 PASS
- [ ] Wf: ADR-0027 보강
- [ ] lint/typecheck PASS, 기존 테스트 회귀 0
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-24-02-retro-defects` 브랜치 push 완료
