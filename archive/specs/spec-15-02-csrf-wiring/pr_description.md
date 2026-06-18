# feat(spec-15-02): wire CSRF double-submit into auth

## 📋 Summary

### 배경 및 목적
`@repo/backend-auth-rate-limit/csrf.ts` 의 double-submit CSRF 함수가 구현됐으나 `apps/api` 에 **미배선**이었다(`wiring-audit §A`). refresh 및 상태변경 endpoint 가 CSRF 검증 없이 동작 → cross-site 강제요청 취약. 본 spec 은 이를 실제 동작 경로에 배선해 phase-15 성공기준1 을 충족한다.

### 주요 변경 사항
- [x] `CsrfGuard` — `csrf_id` 쿠키 + `X-Csrf-Token` 헤더를 `verifyCsrfToken` 으로 검증, 실패 403
- [x] `GET /auth/csrf` 부트스트랩 + 8개 보호 POST(signin/signup/signout/refresh + password-reset(·confirm)/email-verify(·confirm))에 가드
- [x] signin/signup/refresh 성공 시 `csrf_id` rotate + 응답 body `csrfToken`
- [x] `CSRF_SECRET` settings + DI 토큰
- [x] web-next auth client: 부트스트랩·`X-Csrf-Token` 헤더 첨부·rotate 반영
- [x] e2e: CSRF 우회 차단(403) + happy path (로컬 Postgres 97/97)

### Phase 컨텍스트
- **Phase**: `phase-15` (security & wiring hardening)
- **역할**: 성공기준1(CSRF 배선) 충족. 미인증 endpoint 까지 보호.

## 🎯 Key Review Points

1. **바인딩 전략 (ADR 후보 `csrf-binding-strategy`)**: 토큰을 session 이 아닌 per-client `csrf_id` 쿠키에 바인딩 — 미인증 endpoint 보호 위함. session-revoke 자동 무효화는 포기(trade-off). `csrf.cookie.ts` 주석 참조.
2. **CsrfGuard 검증 로직**: `verifyCsrfToken` 재사용(보안 로직 신규 작성 0), 헤더/쿠키 부재·불일치 모두 403.
3. **rotate + 부트스트랩 흐름**: 보호된 signin 은 `GET /auth/csrf` 선행 필요. 프론트 `ensureCsrf()` 가 처리.
4. **e2e 전략**: 매 요청 fresh 부트스트랩으로 rotation 추적 없이 검증.

## 🧪 Verification

```bash
# 로컬 Postgres(5434/test) + drizzle migrate 후
pnpm turbo run lint typecheck test knip depcruise   # 136/136 ✅
```
- apps/api **97/97** (auth.e2e 39 포함), web-next **21/21**.
- CSRF 게이트: 헤더 누락/csrf_id 부재/위조 → **403**, GET /auth/csrf → 200.
- knip/depcruise exit 0.

## 📦 Files Changed

### 🆕 New
- `apps/api/src/auth/csrf.cookie.ts` (+test): csrf_id/csrf_token 발급·rotate·읽기
- `apps/api/src/auth/csrf.guard.ts` (+test): double-submit 검증 가드

### 🛠 Modified
- `apps/api/src/auth/auth.controller.ts`: GET /auth/csrf + @UseGuards + rotate
- `apps/api/src/auth/auth.module.ts`: CsrfGuard provider + CSRF_SECRET 토큰
- `apps/api/src/settings.ts`: CSRF_SECRET
- `apps/api/src/auth/auth.e2e.test.ts` / `auth.controller.test.ts`: CSRF 동반·provider
- `apps/web-next/src/lib/auth-api.ts` (+auth-sdk.test): X-Csrf-Token 헤더 첨부

## ✅ Definition of Done
- [x] 단위 테스트 PASS (guard/cookie)
- [x] 통합 e2e PASS — CSRF 우회 403 + happy path
- [x] walkthrough / pr_description ship
- [x] lint / typecheck / knip / depcruise PASS

## 🔗 관련 자료
- Phase: `backlog/phase-15.md`
- Walkthrough: `specs/spec-15-02-csrf-wiring/walkthrough.md`
- 관련: `docs/review/2026-06-01-wiring-audit.md` §A, ADR 후보 `csrf-binding-strategy`
