# spec-26-07: 누출 감사 스냅샷 (내부 uuid 노출 0 불변식)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-07` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-07-leak-audit-snapshot` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Test (불변식 안전망) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

26-02~06 으로 4개 root(users·organizations·sessions·api-keys)가 public_id 로 전환됐다. ADR-0028 §1 불변식("API 응답 body·URL 에 내부 uuid 0")이 개별 spec 에서 충족됐다고 *선언*됐으나, **전수 검증하는 자동 테스트가 없다** — 향후 신규 엔드포인트가 내부 uuid 를 노출하면 조용히 회귀한다.

### 문제점

불변식이 코드로 강제되지 않음 → 회귀 미탐지 위험.

### 해결 방안

주요 인증 엔드포인트 응답을 순회하며 **응답 body 에 내부 uuid(hex `8-4-4-4-12`) 패턴이 0건**임을 단언하는 e2e 스캔을 추가한다. 회귀 시 즉시 RED. (JWT `sub` 는 ADR-0028 §1 예외 — JWT payload 는 검사 대상 아님; base64 토큰 문자열은 hex-uuid 정규식에 매칭 안 됨.)

## 요구사항

1. **응답 스캔 e2e**: signup·signin·refresh·`/auth/me`·`/auth/orgs`·`/auth/org/members`·`/auth/api-keys`(create+list)·`/auth/sessions` 응답 body 를 `JSON.stringify` → **hex uuid 정규식 부재** 단언.
2. **positive sanity**: 각 식별자가 기대 prefix(`usr_`/`org_`/`key_`/`ses_`) 형식임도 함께 단언(스캔이 단순 "필드 없음"으로 통과하지 않게).
3. **admin 포함**(가능 시): DB 로 user role=admin 승격 후 `/admin/orgs`·`/admin/users` 응답 스캔. (admin cursor 는 base64 라 hex-uuid 미매칭 — 본 스캔의 한계로 명시.)
4. **회귀 0**: 신규 테스트 GREEN(모든 root 닫혀 누출 없음). 만약 RED 면 누출 발견 → 해당 응답 수정.

## Out of Scope

- 신규 식별자 전환(이미 26-02~06 완료) — 본 spec 은 *검증만*.
- JWT payload 내부 uuid(§1 예외), base64 cursor(불투명) — 스캔 비대상(명시).
- web/잠재 부채(refute #1) — 별도.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 스캔 범위: **응답 body 의 hex uuid** (JWT payload·base64 cursor 제외). 이것이 ADR-0028 §1 의 실제 강제 범위.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 누출 검증 | 응답 body uuid 정규식 스캔 e2e | 전수·회귀 가드 |
| positive | prefix 형식 단언 병행 | "필드 누락" 가짜 통과 방지 |

## Proposed Changes

#### [NEW] `apps/api/src/auth/public-id-leak-audit.e2e.test.ts`
- 헬퍼 `expectNoInternalUuid(body, label)` + 주요 엔드포인트 순회 스캔 + prefix sanity.

## 검증 계획

```bash
turbo run lint typecheck test   # fresh 5434 DB
```
1. 모든 대상 엔드포인트 응답에 hex uuid 0건 — 기대: PASS(누출 없음)
2. 각 식별자 prefix 형식 일치 — 기대: PASS
3. 만약 누출 발견 시 RED → 응답 수정 후 GREEN

## 롤백 계획

- `git revert`. 테스트 전용, 런타임 무영향.

## ADR 후보

- [x] ADR-0028 §1 시행 검증 — 추가 ADR 불요.

## ✅ Definition of Done

- [ ] 누출 스캔 e2e (응답 uuid 0 + prefix sanity) GREEN
- [ ] 발견된 누출 있으면 수정
- [ ] walkthrough/pr_description + push
