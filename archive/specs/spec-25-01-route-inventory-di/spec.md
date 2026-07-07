# spec-25-01: route-inventory Wd 근본 개선 (가드 순서 + DI 안전망)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-25-01` |
| **Phase** | `phase-25` |
| **Branch** | `spec-25-01-route-inventory-di` |
| **Base 브랜치** | `phase-25-refactor-hardening-3` |
| **상태** | Planning |
| **타입** | Refactor (테스트 강화) |
| **작성일** | 2026-06-24 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

phase-23 회고 §Wd 가 `route-inventory.test.ts` 의 두 한계를 지적:
1. **가드 순서 미검증** — `routesOf` 가 guard 이름을 `.sort()`(line 42)해 알파벳순으로 박제 → 선언 순서(예: `AuthGuard` 먼저 → `CsrfGuard`) 가 바뀌어도 스냅샷 불변 → 순서 회귀 미탐지.
2. **컨트롤러 미인스턴스화** — 순수 리플렉션이라 DI 그래프가 실제로 resolve 되는지 검증 안 함 → "서비스 이동으로 DI 깨짐"은 CI e2e(전체 부팅)에서만 잡힘(느림). phase-25 의 E3/E4(도메인 분리·패키지화)는 정확히 DI 그래프를 건드리므로, **빠른 DI 안전망**이 선결되어야 한다.

### 해결 방안

- **가드 순서 보존**: guard 이름의 `.sort()` 제거 → **선언 순서** 그대로 스냅샷. EXPECTED 갱신.
- **DI-compile smoke**: `Test.createTestingModule({ imports: [AppModule] }).compile()`(+ ProviderAuthModule) 로 전 컨트롤러/프로바이더 DI 그래프가 resolve 됨을 빠르게 검증(pg Pool 은 lazy — 무-DB compile 가능 여부 확인, 필요 시 5434 DB 게이트). E3/E4 이관의 회귀 안전망.

## 요구사항

1. route-inventory 가 guard 를 **선언 순서**로 검증(정렬 제거), EXPECTED 스냅샷 그에 맞춰 갱신.
2. AppModule(+ ProviderAuthModule) DI-compile smoke 테스트 — 컨트롤러/프로바이더 graph resolve 확인.
3. 기존 라우트/가드 계약 보존(스냅샷은 순서만 정밀화, 라우트 집합 불변).
4. 회귀 0, lint/typecheck/test PASS.

## Out of Scope

- EXPECTED 하드코딩 자체 제거(동적 생성) — brittle 비판의 근본해소는 과함. 순서 정밀화 + DI smoke 로 Wd 핵심만.
- body 검증(zod) 런타임 테스트 — 컨트롤러 단위테스트(24-01) 담당.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] DI smoke 가 무-DB compile 로 충분한지 vs 5434 DB 게이트 필요한지는 구현 중 확인(pool lazy 면 무-DB). DB 필요 시 e2e 와 동일 게이트.

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| `routesOf` | guard `.sort()` 제거 → 선언 순서 |
| EXPECTED_*_ROUTES | 선언 순서로 갱신 |
| 신규 DI smoke | AppModule/ProviderAuthModule `.compile()` |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/route-inventory.test.ts`
guard 정렬 제거(선언 순서) + EXPECTED 스냅샷 순서 갱신.

#### [NEW] `apps/api/src/auth/module-di.smoke.test.ts` (또는 route-inventory 내)
AppModule + ProviderAuthModule compile → DI resolve 검증.

## 검증 계획

```bash
npx vitest --root apps/api run route-inventory module-di
# 회귀(필요 시 5434 DB)
DATABASE_URL=... npx turbo run lint typecheck test
```

## 롤백 계획

- `git revert`. 테스트만 변경(가드 순서 정밀화 + smoke 추가).

## ADR 후보

- [x] 없음

## ✅ Definition of Done

- [ ] route-inventory guard 선언순서 검증 + EXPECTED 갱신
- [ ] AppModule/ProviderAuthModule DI-compile smoke PASS
- [ ] 회귀 0, lint/typecheck/test PASS
- [ ] walkthrough/pr_description ship + push
