# Walkthrough: spec-x-secure-reset-token-logging

> 보안 핫픽스 — password-reset / email-verify 의 raw 토큰 평문 로깅 차단.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 로깅 처리 | 완전 제거 / dev 가드 | **dev 가드** | non-dev 누출 차단 + 로컬 reset 플로우 편의 유지 |
| NODE_ENV 접근 | settings DI 주입 / `process.env` | **`process.env.NODE_ENV`** | 서비스에 settings 미주입 — 최소 변경. 어차피 phase-13 어댑터로 대체 |
| guard footgun 포함? | A 에 포함 / phase-15 | **phase-15** | JWT claims 계약(auth-jwt) 변경 필요 + 현재 익스플로잇 불가(방어심층) → 핫픽스 부적합 |

### ADR 승격
- [ ] 있음
- [x] 없음 (dev-only 로깅 가드는 임시 — phase-13 notification 포트가 대체)

## 💬 사용자 협의
- 코드 품질 평가 중 발견된 결함. 사용자가 "A(결함 수정) 진행" 지시. guard footgun 은 phase-15 로 분리(JWT 계약 변경 사유) 합의.

## 🧪 검증 결과

### 단위 (회귀)
- **명령**: `pnpm --filter @apps/api exec vitest run src/auth/secure-token-logging.test.ts`
- **결과**: ✅ 3 passed
  - non-dev(production): password-reset / email-verify 모두 sentinel 토큰 미출력
  - dev: 토큰 로깅 유지
- **회귀 없음**: 기존 password-reset/email-verify service 테스트 포함 9/9 passed

### Red→Green 증거
- Red: non-dev 2건 실패(현재 항상 로깅) / dev 1건 통과
- Green: dev 가드 적용 후 3/3

## 🔍 발견 사항
- 이 결함의 근본 원인은 "이메일 전송 stub" 부재 — `console.info(token)` 으로 임시 대체한 흔적. **phase-13 notification 포트**가 정식 해소.
- `auth.guard.ts` role re-decode footgun 은 `verifyAccessToken` 결과(`narrowClaims`)가 role 을 안 담아 발생 — JWT claims 계약 확장이 필요해 phase-15 로 분리.

## 🚧 이월 항목
- 이메일 전송 어댑터(notification 포트) → phase-13
- guard role from verified claims → phase-15

## 🔗 관련
- 관련 phase: phase-13 (notification), phase-15 (quality hardening)
- 수정 파일: `apps/api/src/auth/password-reset.service.ts`, `email-verify.service.ts`

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-30 |
| 최종 commit | ship 시 갱신 |
