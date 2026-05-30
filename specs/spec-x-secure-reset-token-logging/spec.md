# spec-x-secure-reset-token-logging: reset/verify 토큰 평문 로깅 차단

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-secure-reset-token-logging` |
| **타입** | Fix (security) |
| **Integration Test Required** | no (단위 회귀 테스트로 충분) |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`apps/api` 의 password-reset / email-verify 서비스가 dev 이메일 stub 으로서 발급 토큰을 stdout 에 로깅한다:
- `apps/api/src/auth/password-reset.service.ts:31` — `console.info(\`[password-reset] token=${token} ...\`)`
- `apps/api/src/auth/email-verify.service.ts:27` — 동일 패턴

### 문제점
**raw 리셋/인증 토큰이 평문으로 로그에 남는다.** 토큰은 DB 에는 SHA-256 해시로만 저장되는데(올바름), 로그로는 평문이 흘러 그 보안 설계를 무력화한다. staging/prod 로그가 수집·전송되면 계정 탈취 가능 토큰이 노출된다. 레포가 시크릿 마스킹 유틸(`@repo/backend-settings` `maskConfig`)까지 갖춘 점과 모순.

### 해결 방안 (요약)
**dev(`NODE_ENV==="development"`) 에서만** 토큰을 로깅하고, 그 외 환경에서는 토큰을 절대 출력하지 않는다 (userId 등 비-시크릿만). dev 편의(로컬에서 reset 플로우 완주)는 유지하되 누출 경로를 차단한다. 회귀 테스트로 "non-dev 에서 토큰 미출력"을 고정한다.

> 근본 해소(이메일 전송 어댑터로 교체)는 **phase-13 (notification 포트)**. 본 spec 은 누출 차단 핫픽스.

## 🎯 요구사항

### Functional Requirements
1. `NODE_ENV !== "development"` 일 때 password-reset / email-verify 의 로그에 **raw 토큰이 포함되지 않는다**.
2. `NODE_ENV === "development"` 에서는 dev 편의용 토큰 로깅을 유지할 수 있다 (명시적으로 `(dev)` 표기).
3. 두 서비스 모두 동일 정책.

### Non-Functional Requirements
1. 동작(토큰 발급/저장/검증)은 불변 — 로깅만 변경.
2. 회귀 테스트가 "non-dev 토큰 미출력"을 검증 (향후 재발 방지).

## 🚫 Out of Scope
- 이메일 전송 어댑터(notification 포트) → phase-13.
- `auth.guard` role re-decode footgun (JWT claims 계약 변경 필요) → phase-15.

## 📑 ADR 후보
- [ ] ADR 가치 있는 결정 있음
- [x] 없음 (dev-only 로깅 가드는 관례 — phase-13 에서 대체됨)

## ✅ Definition of Done
- [ ] 회귀 테스트 PASS (non-dev 토큰 미출력)
- [ ] 두 서비스 typecheck/lint 통과
- [ ] walkthrough / pr_description ship
- [ ] PR 생성 + 사용자 알림
