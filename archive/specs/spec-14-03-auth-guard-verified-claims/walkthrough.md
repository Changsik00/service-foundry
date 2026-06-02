# Walkthrough: spec-14-03 — auth.guard 검증 claim 사용

> 권한 결정 claim(role)을 미검증 `decodeJwt` 대신 검증된 `result.value` 에서 읽도록 수정. footgun 제거.

## 📌 결정 기록
| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| role 출처 | decodeJwt(미검증) / result.value(검증) | **result.value** | 권한 상승 footgun 제거 |
| 근본 원인 | guard 만 / verify 도 | **verify 가 커스텀 claim 보존** | guard 우회의 원인이 narrowClaims 의 claim 손실 |
| JwtClaims | role 하드코딩 / index signature | **index signature** | jwt 패키지 generic 유지 |

### ADR 승격
- [x] 없음 (ADR-0013 보강)

## 🧪 검증 결과
- `@repo/backend-auth-jwt` 26/26 (신규: verified result 의 role 보존 단언)
- `@repo/nestjs-auth` 10/10 (guard 가 verified role 사용, decodeJwt 제거)
- typecheck: 양 패키지 clean
- 통합: 본 PR `verify` CI (전체) green 확인.

## 🔍 발견 사항
- footgun 의 **근본 원인은 guard 가 아니라 verify**: `narrowClaims` 가 6개 표준 claim 만 남기고 role 을 버려, guard 가 어쩔 수 없이 `decodeJwt` 로 우회. verify 가 검증된 커스텀 claim 을 보존하니 guard 가 정공법으로 돌아옴.

## 🚧 이월 항목
- P3 (NestJS ExceptionFilter 로 AppError→HTTP 자동 매핑) — 후속.

## 🔗 관련
- ADR-0013(JWT), ADR-0008(Result), ADR-0020(에러 규약)
- phase-14 성공 기준 2.

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | feat 1 + fix 1 + ship 1 |
