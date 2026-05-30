# Implementation Plan: spec-x-secure-reset-token-logging

## 📋 Branch Strategy
- 신규 브랜치: `spec-x-secure-reset-token-logging` (from `main`)
- PR target: `main`
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] dev-only 토큰 로깅 가드 — non-dev 는 토큰 미출력 (핫픽스, 근본 해소는 phase-13).
> - [ ] guard footgun 은 본 spec 범위 아님 → phase-15.

## 🎯 핵심 전략

| 항목 | 전략 | 이유 |
|:---:|:---|:---|
| 가드 | `process.env.NODE_ENV === "development"` 일 때만 토큰 로깅 | 서비스에 settings DI 미주입 — 최소 변경. phase-13 에서 어댑터로 대체 |
| non-dev 로그 | userId 등 비-시크릿만 (토큰 제외) | 누출 차단 + 관측성 유지 |
| 테스트 | console.info spy + NODE_ENV 토글로 회귀 검증 | "non-dev 토큰 미출력" 고정 |

## 📂 Proposed Changes

#### [MODIFY] `apps/api/src/auth/password-reset.service.ts`
`request()` 의 토큰 로깅을 dev 가드로 감싼다. non-dev 는 토큰 없는 로그.

#### [MODIFY] `apps/api/src/auth/email-verify.service.ts`
동일 패턴 적용.

#### [NEW] 회귀 테스트
`apps/api/src/auth/secure-token-logging.test.ts` (또는 각 서비스 테스트 인접) — console.info spy, `NODE_ENV` 비-development 로 설정 후 `request()` 호출 → 어떤 로그 인자에도 raw 토큰 미포함 검증. dev 케이스는 토큰 포함 확인.

## 🧪 검증 계획
### 단위 (회귀)
```bash
pnpm --filter @apps/api test
```
non-dev: 토큰 미출력 / dev: 토큰 출력.

### 수동
1. `NODE_ENV=production` 부트 시뮬 → reset 요청 → 로그에 토큰 없음.

## 🔁 Rollback
- 로깅 라인 변경 + 테스트 추가뿐. 동작 무변경 → 라인 되돌리기로 롤백.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
