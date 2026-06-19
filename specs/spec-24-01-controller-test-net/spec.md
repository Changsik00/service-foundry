# spec-24-01: 컨트롤러 테스트 안전망

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-24-01` |
| **Phase** | `phase-24` |
| **Branch** | `spec-24-01-controller-test-net` |
| **Base 브랜치** | `phase-24-refactor-hardening-2` |
| **상태** | Planning |
| **타입** | Refactor (테스트 추가) |
| **작성일** | 2026-06-19 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

`apps/api/src/auth/` 의 NestJS 컨트롤러 8개가 **단위 테스트 없이** 운영 중이다. phase-23 7차원 감사 §G 가 "테스트 부채"로 지목했고, phase-24 는 이를 이후 분할(F2, spec-24-03)·패키지 이관(E1/E2, spec-24-04/05)의 **회귀 안전망**으로 선결한다.

사전 조사로 범위를 정정했다:
- 감사가 지목한 **서비스(mfa.service·oauth.service 등)는 이미 모두 테스트 존재**(19/19).
- `jwt.service` 는 `@repo/backend-auth-jwt` 패키지로 이관되어 본 spec 범위 밖.
- 실제 무테스트는 **컨트롤러 8개뿐**.

무테스트 컨트롤러 (LOC):

| 컨트롤러 | LOC | 비고 |
|---|---:|---|
| `account.controller.ts` | 277 | 최대. spec-24-03 에서 분할 예정 → 분할 전 안전망 필수 |
| `session.controller.ts` | 138 | |
| `provider-org.controller.ts` | 101 | provider 모드 org |
| `org.controller.ts` | 91 | org 관리 + @OrgRoles 가드 |
| `passkey.controller.ts` | 88 | |
| `oauth.controller.ts` | 70 | |
| `mfa.controller.ts` | 63 | |
| `provider-me.controller.ts` | 24 | 최소 |

### 문제점

- 컨트롤러 레벨에 가드(`reflect` 메타)·서비스 위임·검증 분기를 보존하는 가드가 없어, 이후 분할/이관 시 회귀(라우트 누락, 가드 탈락, 위임 인자 변경)를 조기에 잡을 수 없다.
- phase-23 회고 교훈: 테스트가 가드 대상 코드의 "거울"이 되면 독립성을 잃어 거짓 GREEN 을 낸다(Wb), route-inventory 가 컨트롤러를 인스턴스화하지 않아 DI 회귀를 못 잡는다(Wd).

### 해결 방안

8개 컨트롤러에 **동작 가드형 단위 테스트**를 추가한다. 신구현 거울이 아니라 "이 라우트는 이 서비스 메서드를 이 인자로 호출한다 / 이 가드가 붙어있다 / 이 검증이 거부한다"를 검증한다. 기존 패턴(`api-key.controller.test.ts` 직접 인스턴스화, 복잡 가드는 `Test.createTestingModule`)을 재사용하고, route-inventory 스냅샷에 누락된 컨트롤러가 있으면 보강한다.

## 요구사항

1. 무테스트 컨트롤러 8개 각각에 단위 테스트 파일을 추가한다 (`*.controller.test.ts`).
2. 각 테스트는 **공개 라우트 메서드마다 최소**: ① 정상 경로에서 올바른 서비스 메서드를 올바른 인자로 호출/반환, ② 검증/에러 분기가 있으면 거부 동작을 검증.
3. 가드가 붙은 컨트롤러(org 등 @OrgRoles, AuthGuard/CsrfGuard)는 메타데이터 보존을 검증한다 — `route-inventory.test.ts` 패턴 활용 또는 개별 reflect 검증.
4. 테스트는 **기존 코드 변경 없이** 통과(characterization). 코드 결함을 발견하면 수정은 본 spec 밖으로 분리하고 보고한다.
5. 신규 테스트는 기존 패턴/러너(vitest)를 따르며, `turbo run test` 회귀 0.

## Out of Scope

- 컨트롤러 분할(F2) — spec-24-03.
- 서비스 테스트 추가 — 이미 존재.
- `jwt.service` (패키지 이관됨), e2e 신규 작성(기존 e2e 회귀만 확인).
- 발견된 코드 결함의 *수정* (별도 보고 → 24-02 또는 phase-FF).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 8개 전부를 한 spec 으로 묶는다 (안전망은 일괄 완비가 목적). 분량이 크면 P1(account/session/org)만 본 spec, 나머지는 phase-FF 로 분리하는 대안도 가능.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **단순 컨트롤러** (provider-me, mfa, oauth, passkey) | 직접 인스턴스화 + 서비스 mock (`new C(mock)`) | DI 부트스트랩 비용 없이 위임 가드 충분 (`api-key.controller.test.ts` 패턴) |
| **가드 보유 컨트롤러** (org, provider-org, session, account) | reflect 메타 검증 + 위임 검증 (필요 시 `Test.createTestingModule`) | @OrgRoles/AuthGuard/CsrfGuard 보존이 분할 회귀의 핵심 |
| **route-inventory** | 누락 컨트롤러 스냅샷 보강 (인스턴스화 가드 포함 검토) | 분할(24-03) 전 라우트+가드 전수 스냅샷 확보 (Wd 교훈) |

## Proposed Changes

#### [NEW] `apps/api/src/auth/account.controller.test.ts`
account 라우트(이름/아바타/비번/이메일변경/탈퇴 등) 위임 + 검증 분기 가드.

#### [NEW] `apps/api/src/auth/session.controller.test.ts`
세션 목록/취소/전체 로그아웃 위임 + AuthGuard/CsrfGuard 메타.

#### [NEW] `apps/api/src/auth/org.controller.test.ts`
org 관리 라우트 위임 + @OrgRoles(admin/owner) 메타 보존.

#### [NEW] `apps/api/src/auth/provider-org.controller.test.ts`
provider 모드 org 라우트 위임 + 가드 메타.

#### [NEW] `apps/api/src/auth/passkey.controller.test.ts`
passkey 등록/인증 옵션·검증 라우트 위임.

#### [NEW] `apps/api/src/auth/oauth.controller.test.ts`
oauth authorize/callback 위임 + 가드.

#### [NEW] `apps/api/src/auth/mfa.controller.test.ts`
mfa enroll/verify/disable 위임.

#### [NEW] `apps/api/src/auth/provider-me.controller.test.ts`
provider me 라우트 위임.

#### [MODIFY] `apps/api/src/auth/route-inventory.test.ts` (필요 시)
누락 컨트롤러를 EXPECTED 스냅샷에 보강.

## 검증 계획

```bash
cd apps/api && npm run test          # 신규 단위 테스트 포함 전체 PASS
turbo run test lint typecheck        # 모노레포 회귀 0
```

수동 검증 시나리오:
1. 신규 테스트 파일 단독 실행 → 전부 PASS (기존 코드 무변경).
2. route-inventory 스냅샷 → 8개 컨트롤러 라우트+가드 전수 포함.

## 롤백 계획

- 테스트 추가뿐이라 `git revert` 로 무위험 롤백. state/마이그레이션/외부 부수효과 없음.

## ADR 후보

- [x] 없음 (테스트 추가, 아키텍처 결정 없음)

## ✅ Definition of Done

- [ ] 무테스트 컨트롤러 8개 단위 테스트 추가, 전부 PASS
- [ ] route-inventory 스냅샷 보강(누락 시) 및 PASS
- [ ] `turbo run test lint typecheck` 회귀 0
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-24-01-controller-test-net` 브랜치 push 완료
