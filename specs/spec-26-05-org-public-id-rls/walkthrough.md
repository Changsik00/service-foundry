# Walkthrough: spec-26-05

> organizations.public_id 도입 + 외부 표면 전환. JWT active_org·SET LOCAL·RLS 는 내부 uuid 유지(격리 SoT 불변).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| org 식별자 운반 | public 일원화 / **내부=RLS, 외부=public** | 내부 uuid SoT 유지 | RLS 술어·JWT active_org 불변 → 격리 회귀 0 |
| switch 입력 | 내부 uuid / **public_id** | public_id → 해석+멤버십 검증 | 클라 내부 uuid 제거, ADR-0029 게이트 |
| members userId | 내부 / **user public_id 상속** | 상속 | member table 내부 uuid 노출 제거 (커서는 내부 id 유지) |
| admin cursor | public / **내부(불투명 base64)** | 내부 유지 | 외부 의미 없는 인코딩 — 가시필드만 public, cursor 는 26-07 점검 |
| web | 수정 / **no-op** | 코드 변경 불요 | web 이 식별자를 format-agnostic(z.string)으로 다뤄 투명 호환 |

## 💬 사용자 협의

- switch 입력 public_id + admin cursor 내부 유지 2결정 → "1"(승인).

## 🔍 검증 2단계 (`/hk-refute`) 결과 — **Go (조건부)**

독립 Opus 반증: 격리 SoT 불변(내부 uuid)·switch 멤버십 게이트(실 e2e, 동어반복 아님)·노출 전환·커서 왕복 모두 견고, 테넌트 격리 회귀 시나리오 **발견 못함**. 유일 지적:
- **#1 (web no-op)**: `apps/web` diff 0 — DoD "web 반영"이 코드가 아닌 *format-agnostic 코드의 우연 호환*으로 충족. 런타임 무해하나, 향후 web 이 uuid 포맷을 가정하면 조용히 깨질 잠재 부채 → 본 walkthrough 에 명시(반영 완료).

## 🧪 검증 결과

- 단위/e2e: org public_id 컬럼·`/auth/orgs` org_ 형식·members userId=usr_·switch(멤버 200 / 비멤버 403 / 미존재 403)·admin/org-members/provider mock 정합.
- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, tenant-isolation 회귀 0.

## 🔧 변경

- `organizations.ts` publicId + 마이그레이션 0022(VOLATILE default 백필).
- 응답: org-list/org-members(+userId 상속)/auth.me/provider-me/admin → public_id. account.stores `findOrgPublicId`.
- switch 입력: `OrgSwitchInput` public_id, org-switch/provider-org-switch public→내부 해석+멤버십 게이트. provider invite/accept·switch 응답 public_id echo.
- 테스트 blast-radius: members userId·switch 입력 public 전환에 맞춰 tenant-isolation·rbac·api-key·admin·org-members 단위/e2e 갱신(내부 id 는 DB 해석으로 시드).

## 🚧 이월

- 나머지 root(api-keys·sessions) public_id → 26-06.
- 누출 감사 스냅샷(전 응답·admin cursor 내부 uuid 0 검증) → 26-07.
- web 의 uuid-가정 잠재 부채(refute #1) — 26-07 또는 web 작업 시 점검.
