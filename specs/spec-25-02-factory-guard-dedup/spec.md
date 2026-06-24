# spec-25-02: roles guard 중복 제거 (D6; D2·D4 per-item 검증 후 드롭)

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
- **D6 (roles guard) — 채택**: `RolesGuard`·`OrgRolesGuard` 가 구조 동일(메타 읽기 → 빈 배열 통과 → req.user 의 role 검사 → Forbidden). 차이는 메타 키 + role 필드(`user.role` vs `user.orgRole`)뿐. → 공유 함수 `checkRoles` 로 수렴.
- **D2 (verifier 공통) — 드롭**: firebase/supabase verifier 의 공통 표면이 ~5줄(`if(!orgId&&provision){…}` + 동일 return)뿐. seam 이 큼 — 디코딩(SDK vs jose)·sub 교체(firebase internalUserId)·라이트백(firebase setCustomUserClaims)·provision port 타입(서로 다른 인터페이스). 공유 헬퍼는 두 독립 어댑터를 결합(ADR-0015 위반 소지)+타입 손실 → 이득<비용. 비채택.
- **D4 (forRoot 팩토리) — 드롭**: 8 모듈 `forRoot` 는 옵션/프로바이더가 bespoke. 공통화는 과도추상화(phase 위험표 "억지 묶기 금지"). 비채택.

### 해결 방안

**D6 만 공통화**(D2·D4 는 per-item 검증 후 드롭 — 묶음의 substance 부재). 안전망: spec-25-01 DI smoke + route-inventory(가드 보존) + 기존 guard 단위 테스트.

## 요구사항

1. **D6**: `RolesGuard`·`OrgRolesGuard` 의 canActivate 로직을 공유 함수(`checkRoles(ctx, reflector, metaKey, pick, message)`)로 수렴. fail-open(메타 없음→통과)·Forbidden 동작 + 기존 export(`ROLES_KEY`/`ORG_ROLES_KEY`/guard 클래스명) 보존.
2. 기존 guard 단위 테스트 전부 통과(동작 불변), DI smoke + 격리/rbac e2e 회귀 0.

## Out of Scope

- **D2** verifier 공통 (per-item 검증 후 드롭 — 어댑터 결합·타입 손실).
- **D4** forRoot 공통화 (드롭 — bespoke).
- **D3** frontend auth 어댑터 (frontend — 별 판단).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] **D2·D4 드롭** 동의 (사용자 2026-06-24) — 둘 다 substance 부재/과도추상화. D6 만 진행.

> [!NOTE]
> - D6 은 클래스 팩토리 대신 **공유 함수(`checkRoles`)** 채택 — 각 Guard 를 명명 클래스로 유지해 DI 메타데이터(Reflector 주입)와 클래스명(route-inventory 가드 스냅샷)을 보존.

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| guards (D6) | 공유 함수 `checkRoles(ctx, reflector, metaKey, pick, message)` → RolesGuard/OrgRolesGuard 가 호출(클래스명/export/동작 보존) |
| D2/D4 | 변경 없음(드롭) |

## Proposed Changes

#### [NEW] `packages/nestjs/auth/src/roles-guard.util.ts`
`checkRoles` 공유 함수 — 메타 읽기·fail-open·role 검사·Forbidden.

#### [MODIFY] `packages/nestjs/auth/src/roles.guard.ts` · `org-roles.guard.ts`
canActivate 를 `checkRoles` 호출로 수렴(export/동작/클래스명 보존).

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

- [ ] D6 `checkRoles` 공유 함수, export/동작/클래스명 보존
- [ ] D2·D4 드롭 명문화(per-item 검증 근거), 기존 테스트 + DI smoke + e2e 회귀 0
- [ ] walkthrough/pr_description ship + push
