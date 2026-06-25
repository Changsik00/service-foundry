# Walkthrough: spec-x-native-list-orgs

> native 모드 `GET /auth/orgs` 추가 — provider 와 parity (Icebox 모드 부정합 해소).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| native 목록 키 | providerUid 재사용 / userId 신규 | **`listForUserId(userId)` 신규** | native sub=내부 userId(`users.id`), provider 는 providerUid — 키가 다름 |
| 쿼리 형태 | users join / 직접 | **memberships.userId 직접**(users join 불필요) | userId 가 곧 memberships FK |
| 응답 계약 | 신규 / provider 동일 | **provider 동일** `{ orgs: OrgSummary[] }` | 클라가 모드 무관 동일 계약 |

## 💬 사용자 협의

- 사용자: "/auth/orgs native 갭 처리하자." → native OrgController 에 list-my-orgs 추가(웹은 provider 전용이라 미변경; native API parity 완성).

## 🧪 검증 결과

- 단위: `listForUserId` (userId 스코프+limit), `OrgController.orgs` 위임. route-inventory EXPECTED 에 `GET /auth/orgs [AuthGuard]` 추가(Red→Green). DI smoke = native AppModule 에 OrgListService 주입 resolve.
- **native e2e 실증**(실 DB): signup → `GET /auth/orgs` → 개인 org 포함 목록 200 (이전 404).
- 전체 게이트(fresh 5434 DB): `turbo run lint typecheck test` **151/151**, 회귀 0.

## 🔧 변경

- `org-list.service.ts`: `listForUserId(userId)` (memberships.userId 키, runWithSystemTenant+정렬+limit).
- `org.controller.ts`: OrgListService 주입 + `@Get("orgs")`.
- `auth.module.ts`: OrgListService provider.
- route-inventory + 단위 + e2e.

## 🚧 이월

- 웹의 native 모드 지원(env optional + 모드 분기 + native 토큰 소스)은 별도 큰 작업. 본 spec 은 API parity 만.
- password/MFA/passkey native UI provider 적절성 점검은 별도(Icebox).
