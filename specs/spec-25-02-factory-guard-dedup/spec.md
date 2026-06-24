# spec-25-02: verifier 공통 + roles guard 제네릭 (D2/D6, D4 드롭)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-25-02` |
| **Phase** | `phase-25` |
| **Branch** | `spec-25-02-factory-guard-dedup` |
| **Base 브랜치** | `phase-25-refactor-hardening-3` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-24 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (§11.3 건별 감사)

감사 §D 의 중복 후보를 착수 전 건별 검증:
- **D2 (verifier 공통)**: `FirebaseVerifier`·`SupabaseVerifier` 가 **"orgId claim 없으면 `provisionFromProvider` → orgId/sub 구성 → VerifiedIdentity 반환"** 로직을 공유. 차이는 (a) 토큰 디코딩(firebase SDK vs jose), (b) firebase 만 `setCustomUserClaims` 라이트백. → **공통 헬퍼 추출**(provider-specific seam 은 콜백).
- **D6 (roles guard 제네릭)**: `RolesGuard`·`OrgRolesGuard` 가 구조 동일(메타 읽기 → 빈 배열 통과 → req.user 의 role 검사 → Forbidden). 차이는 메타 키 + role 필드(`user.role` vs `user.orgRole`). → **제네릭 팩토리**로 수렴.
- **D4 (forRoot 팩토리)**: **드롭** — 8 모듈의 `forRoot` 는 옵션/프로바이더가 모듈마다 bespoke. 공통 팩토리는 과도추상화로 가독성↓ (phase 위험표 "억지 묶기 금지"). 비채택.

### 해결 방안

D2·D6 만 공통화(D4 드롭). 안전망: spec-25-01 DI smoke + route-inventory(가드 보존) + 기존 verifier/guard 단위 테스트.

## 요구사항

1. **D2**: verifier 의 provision-fallback + identity 구성 공통 헬퍼 추출. firebase 의 claim 라이트백은 콜백/옵션으로 보존. 두 verifier 동작 불변.
2. **D6**: `RolesGuard`·`OrgRolesGuard` 를 제네릭 팩토리(메타키 + role 추출 함수)로 수렴. fail-open(메타 없음→통과)·Forbidden 동작 + 기존 export(`ROLES_KEY`/`ORG_ROLES_KEY`/guard 클래스) 보존.
3. 기존 verifier·guard 단위 테스트 전부 통과(동작 불변), DI smoke + 격리 e2e 회귀 0.

## Out of Scope

- **D4** forRoot 공통화 (드롭, 위 사유).
- **D3** frontend auth 어댑터 (frontend — 별 판단).
- verifier 토큰 디코딩 통합(provider 본질 차이라 분리 유지).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **D4 드롭** 동의 — bespoke forRoot 공통화는 과도추상화. D2/D6 만 진행.

> [!WARNING]
> - [ ] guard 제네릭 팩토리가 NestJS DI(Reflector 주입)·`@Injectable` 클래스 계약을 유지해야 함 — 팩토리가 클래스를 반환하는 패턴.

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| verifier (D2) | 공통 `resolveProviderIdentity({uid,email,role,orgIdClaim,provision,onProvisioned?})` 헬퍼 → 두 verifier 가 디코딩 후 호출 |
| guards (D6) | `createRolesGuard(metaKey, pickRole)` 팩토리 → RolesGuard/OrgRolesGuard 가 이를 사용(기존 클래스명/export 유지) |
| D4 | 변경 없음(드롭) |

## Proposed Changes

#### [NEW] verifier 공통 헬퍼 (`@repo/nestjs-auth` 또는 공유 위치)
provision-fallback + VerifiedIdentity 구성. firebase 라이트백 콜백 옵션.

#### [MODIFY] `firebase-verifier.ts` · `supabase-verifier.ts`
디코딩 후 공통 헬퍼 호출로 수렴.

#### [MODIFY] `packages/nestjs/auth/src/roles.guard.ts` · `org-roles.guard.ts`
제네릭 팩토리로 내부 구현 수렴(export/동작 보존).

## 검증 계획

```bash
npx vitest --root apps/api run module-di.smoke   # DI 안전망
npx turbo run test typecheck --filter=@repo/nestjs-auth --filter=@repo/nestjs-auth-firebase --filter=@repo/nestjs-auth-supabase
# 회귀(fresh 5434 DB): rbac/격리 e2e
DATABASE_URL=... npx turbo run lint typecheck test
```

## 롤백 계획

- `git revert`. 내부 구현 수렴(공개 계약 불변)이라 안전.

## ADR 후보

- [x] 없음 (기존 패턴 내 dedup)

## ✅ Definition of Done

- [ ] D2 verifier 공통 헬퍼 + 두 verifier 수렴, 동작 불변
- [ ] D6 roles guard 제네릭 팩토리, export/동작 보존
- [ ] D4 드롭 명문화, 기존 테스트 + DI smoke + e2e 회귀 0
- [ ] walkthrough/pr_description ship + push
