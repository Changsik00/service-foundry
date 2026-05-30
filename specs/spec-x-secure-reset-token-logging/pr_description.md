# fix(spec-x-secure-reset-token-logging): reset/verify 토큰 평문 로깅 차단

## 📋 Summary

### 배경 및 목적
`apps/api` 의 password-reset / email-verify dev 이메일 stub 이 **raw 토큰을 stdout 에 평문 로깅**하고 있었다. 토큰은 DB 에 SHA-256 해시로만 저장되는데(올바름) 로그로 평문이 새어 그 보안 설계를 무력화한다. staging/prod 로그 수집 시 계정 탈취 가능 토큰 노출. (코드 품질 감사에서 발견)

### 주요 변경
- [x] password-reset / email-verify 의 토큰 로깅을 `NODE_ENV==="development"` 가드로 — **non-dev 는 raw 토큰 미출력**(userId 등 비-시크릿만)
- [x] dev 는 로컬 reset 플로우 편의를 위해 토큰 로깅 유지
- [x] 회귀 테스트로 "non-dev 토큰 미출력" 고정

### 범위
- spec-x (Phase 비소속, 보안 핫픽스). 동작(발급/저장/검증) 불변 — 로깅만 변경.

## 🎯 Key Review Points
1. `process.env.NODE_ENV` 가드 — 서비스에 settings DI 가 없어 최소 변경 선택. 근본 해소(이메일 전송 어댑터)는 **phase-13 notification 포트**.
2. 회귀 테스트가 `generateRefreshToken` 을 sentinel 로 mock → 로그에 그 값이 새는지 결정론적 검증.

## 🧪 Verification
```bash
pnpm --filter @apps/api exec vitest run src/auth/secure-token-logging.test.ts
```
- ✅ 3 passed (non-dev: pw-reset/email-verify 토큰 미출력 / dev: 유지)
- ✅ 회귀 없음 — 기존 service 테스트 포함 9/9

## 📦 Files Changed
- `apps/api/src/auth/secure-token-logging.test.ts` (신규 회귀 테스트)
- `apps/api/src/auth/password-reset.service.ts` (로깅 가드)
- `apps/api/src/auth/email-verify.service.ts` (로깅 가드)

## ✅ Definition of Done
- [x] 회귀 테스트 PASS
- [x] typecheck / lint 통과
- [x] walkthrough / pr_description ship
- [ ] PR 머지 후 `sdd specx done`

## 🔗 관련
- 후속: phase-13 (notification 포트 — 근본 해소), phase-15 (guard role footgun)
