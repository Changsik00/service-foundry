feat(spec-26-01): add @repo/backend-id + 노출 root 감사 (phase-26 안전망 선결)

## 📋 Summary

### 배경 및 목적
ADR-0028 의 3-티어 ID 체계(내부 uuid v7 PK + 불투명 prefixed public_id + provider_uid 매핑)를 시행하기 위한 **공유 유틸과 범위 확정**을 먼저 마련한다. 후속 spec(26-02~05)이 제각각 생성 로직을 만들어 표류하는 것을 방지하는 안전망 선결(24-01 패턴).

### 주요 변경 사항
- [x] **[NEW] `@repo/backend-id`** (core, dep 0, `node:crypto`만)
  - `publicId(prefix)` → `<prefix>_<Crockford base32 26자/128bit>` (불투명·비순차)
  - `ID_PREFIX` 중앙 레지스트리 (`usr`/`org`/`ses`/`key`) + `IdPrefix` 타입
  - `uuidv7()` 앱-레이어 RFC 9562 생성기 (내부 PK용, PG 버전 비의존)
- [x] **노출 root 감사 확정**: users·organizations·sessions·api-keys (memberships/invitations 상속·불요)

### 타입
- **Feature (foundation)** · spec-26-01 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. public_id 는 **불투명 랜덤**(timestamp·순서 정보 無) — 정렬성은 내부 PK(uuidv7)에서만 취함(ADR-0028 의도). 불투명성 단위 테스트로 강제.
2. dep 0 — 기존 token 생성(`randomBytes`) 패턴과 일관, platform-agnostic core(ADR-0015).
3. 런타임 참조 0 (순수 신규 패키지) → 회귀 위험 무. 실제 적용은 26-02+.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- `@repo/backend-id` 단위 **10/10**.
- 전체 게이트: apps/api **341/341**, 회귀 0.

## 📦 Files Changed
- `packages/backend/id/{package.json,tsconfig.json,vitest.config.ts}`
- `packages/backend/id/src/{prefix,public-id,uuidv7,index}.ts` + `*.test.ts`

## ✅ Definition of Done
- [x] `@repo/backend-id` 유틸 + 단위 테스트 PASS
- [x] 감사 확정 root 표 고정 (후속 spec 범위 확정)
- [x] walkthrough/pr_description ship commit + 브랜치 push

## 🔗 관련
- ADR-0028 (ID 체계), phase-26, 후속 spec-26-02(users)~26-06(누출 스냅샷)
