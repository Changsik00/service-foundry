# Walkthrough: spec-16-03

> web-next CSRF 403 자가복구. 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 403 식별 | @repo/errors import / statusCode 덕타이핑 | 덕타이핑 | http-client 계약(AppError.statusCode)만 활용, 결합 최소 |
| 재시도 횟수 | 무제한(recursion) / 1회 | **1회(boolean 가드)** | 무한 재발급 방지 — 재시도도 403 이면 throw |
| 적용 범위 | 전 메서드 / 보호 POST | 보호 POST(signin/signup/signout/refresh) | csrf 동반 대상만 |
| MFA/passkey·web-vite/SDK 헤더 | 포함 / 제외 | **제외(Icebox)** | web-next 에 해당 클라이언트 메서드 부재(의도적 미배선) — 메서드 추가 시 csrfOpts 자동 동반 |

### ADR 승격 가이드
- [x] 없음

## 🧪 검증 결과

### 1. 단위 테스트 (Integration Test Required = no)
- **명령**: `pnpm --filter @apps/web-next test`
- **결과**: ✅ **24/24 PASS** (+3: 403 자가복구)
- 케이스: ① 403→csrf 재발급(get 2회)→재시도 성공(post 2회) ② 계속 403→throw + post 2회(무한루프 없음) ③ 401→재시도 없이 즉시 throw(post 1회).

#### TDD Red→Green
- Red: 래퍼 전 첫 403 에 즉시 throw → ①② Fail.
- Green: `withCsrfRetry` 적용 후 403 1회 재시도, 비-403 즉시 throw.

### 2. 게이트
- `pnpm turbo run lint typecheck test knip depcruise` → **136/136 successful**.

## 🔍 발견 사항
- `csrfOpts` 가 `run()` 실행 시점에 평가되므로, 재발급(`fetchCsrf`)이 캐시 토큰을 갱신한 뒤 재시도 run 이 최신 토큰을 자동으로 읽는다 — 별도 토큰 전달 불요.
- web-next 는 MFA/passkey/web-vite/SDK CSRF 클라이언트가 없어(보일러플레이트 의도적 미배선) W6 의 해당 부분은 N/A → Icebox 유지.

## 🚧 이월 항목
- web-next MFA/passkey 클라이언트 메서드 추가 시 헤더 동반 (메서드 부재로 현재 N/A) → Icebox.
- web-vite / `packages/frontend/auth-*` SDK CSRF → Icebox.

## 🔗 관련 문서 (Related)
- 관련 ADR: [[ADR-0021]]
- 관련: phase-15 회고 W6, spec-15-02(web-next CSRF 클라이언트 도입)

## 📅 메타
| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-02 |
| **최종 commit** | `f99cc27` |
