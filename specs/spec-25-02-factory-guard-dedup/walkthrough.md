# Walkthrough: spec-25-02

> 감사 §D 중복 제거 — **D6 채택, D2·D4 per-item 검증 후 드롭**.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| D6 구현 | 클래스 팩토리 / 공유 함수 | **공유 함수 `checkRoles`** | 각 Guard 를 명명 클래스로 유지 → DI 메타데이터(Reflector 주입)·클래스명(route-inventory 스냅샷) 보존. 팩토리+상속은 DI 메타/이름 깨질 위험 |
| D2 (verifier) | 공유 / 드롭 | **드롭** | 공통 ~5줄뿐, seam(디코딩·sub 교체·라이트백·port 타입) provider별 상이 → 공유 시 어댑터 결합(ADR-0015 위반)·타입 손실. 이득<비용 |
| D4 (forRoot) | 공유 / 드롭 | **드롭** | 8 모듈 bespoke — 과도추상화 |

## 💬 사용자 협의

- D4 드롭(spec 작성 시) + **D2 드롭(실행 중 supabase verifier 정독 후 발견 → 보고 → 승인)**. "건별 검증 → 묶음의 substance 없으면 드롭" 원칙(phase 위험표) 적용.

## 🧪 검증 결과

- D6: `roles-guard.util.ts` 의 `checkRoles` 로 RolesGuard/OrgRolesGuard 수렴. 기존 guard 단위 테스트(roles/org-roles) 동작 불변 PASS.
- 전체 게이트(fresh 5434 DB): `turbo run lint typecheck test` **151/151**, DI smoke + rbac/격리 e2e 회귀 0.

## 🔧 변경

- `roles-guard.util.ts`(신규): `checkRoles(ctx, reflector, metaKey, pick, message)`.
- `roles.guard.ts`·`org-roles.guard.ts`: canActivate → `checkRoles` 호출 (export/동작/클래스명 보존).

## 🔍 발견 사항

- D2 는 "shape-level 중복"(동일 흐름)이지만 "substance-level"(실제 코드)이 provider별로 달라 dedup 부적합 — 무리한 공유는 ADR-0015(어댑터 독립) 훼손. 드롭이 옳은 결정.

## 🚧 이월

- D2/D4 재추진 가치 낮아 Icebox 미이월. D3(frontend 어댑터)는 별도.
- phase-25 다음: 25-03 E3(provision·org 도메인 분리).
