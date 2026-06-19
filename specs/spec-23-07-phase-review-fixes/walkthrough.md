# Walkthrough: spec-23-07-phase-review-fixes

> `/hk-phase-review` 독립 4-패널이 phase-23 종료 전 발견한 결함을 닫는 remediation. NO-GO → 수정 후 phase-ship.

## 📌 결정 기록

| 이슈 | 결정 | 이유 |
|---|---|---|
| C1 5xx 응답 | message 일반화 + details 제거(4xx 는 유지) | 도메인 AppError 의 내부 message/details 노출 차단(정보 노출). status 0/비정상 → 500 클램프 |
| C2 fail-open 가드 | route-inventory 에 `@OrgRoles` 메타 단언 추가 | OrgRolesGuard 는 메타 없으면 fail-open → 클래스 스냅샷만으론 권한 라우트 회귀 못 잡음. 메타까지 스냅샷 |
| JWKS 메모이즈 검증 | `toJwks` spy 호출횟수 | 기존 "동일 kid" 는 캐시 없이도 통과 → 의미 없는 가드였음 |
| 회고 신뢰 | agent 주장 **직접 검증 후** 수정 | C1(statusCode:0)·C2(fail-open) 코드 실측 확인. agent 가 말한 "queue.md completed 2026-06-13 오류"는 **실재 안 함**(맹신 안 함) |

## 💬 사용자 협의
- /hk-phase-review 결과 NO-GO("결함 모두 해결하고 가자") → C1/C2/C3 + 테스트 무결성 전부 수정.

## 🧪 검증 결과
- 영향 4 테스트 17 케이스 green: app-error.filter(4, +status0/+5xx새니타이즈), route-inventory(@OrgRoles 포함 17), jwt.service(메모이즈 spy), mfa.service(9, +verifyMfa reject/backup).
- `apps/api` typecheck green.

## 🔍 발견 사항 (회고 → 검증 → 수정)
- **C1**: `res.status(exception.statusCode)` 가드 부재 — http-client NETWORK `statusCode:0` 도달 시 `res.status(0)` 크래시. 실측 확인 후 클램프+새니타이즈.
- **C2**: `OrgRolesGuard` fail-open(`!roles → return true`) + route-inventory 가 `__guards__`(클래스)만 봄 → `org/invite` 의 `@OrgRoles` 누락 회귀를 그린으로 통과시킴. 실측 확인 후 메타 단언.
- **메인 세션 self-review 가 둘 다 놓침** — 독립 패널의 가치.

## 🚧 이월 항목 (queue.md 🧊 인벤토리 승격 완료)
- A5·B2·D2/3/4/6·E(phase-24)·F2·G 컨트롤러 테스트·로컬 e2e DB·Serena 일관 — 다음 phase/후속.
- 다음: phase-23 `/hk-phase-ship`(go/no-go → `sdd phase done`).
