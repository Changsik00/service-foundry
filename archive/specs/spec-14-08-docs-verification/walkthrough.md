# Walkthrough: spec-14-08

> spec-14-07 지식베이스 문서를 실제 소스와 대조해 환각을 검증·수정한 작업 기록.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 검증 신뢰 | 서브에이전트만 / Opus 재검증 | **Opus grep 스포트체크** | 사용자 AI 의존 우려 — 서브에이전트 허위검증 차단 |
| CSRF 결함 발견 | 본 spec 서 수정 / 멈추고 보고 | **Icebox 기록, 코드 미수정** | docs spec 범위 외(코드 변경). 별도 fix spec 후보 |
| 문서-소스 불일치 | 소스 수정 / 문서 수정 | **문서를 소스에 맞춤** | 소스가 정답, 문서가 따라감 |

### ADR 승격 가이드
- [ ] ADR 승격 대상 있음
- [x] 없음 (검증 작업)

## 💬 사용자 협의
- **주제**: phase-ship 전 문서 환각 검증
  - **사용자 의견**: "AI 의존이 우려된다 — 전수 검증, 서브에이전트 + 내 스포트체크"
  - **합의**: Sonnet ×3 도메인 대조 + Opus grep 스포트체크. phase-ship 보다 먼저.
- **주제**: CSRF 결함 / Ship 시점
  - **합의**: 지금 Ship + PR. CSRF 는 Icebox 유지(별도 spec-x 후보).

## 🧪 검증 결과

### docs-lint (구조 회귀)
- **명령**: `bash tooling/scripts/docs-lint.sh`
- **결과**: ✅ PASS — 깨진 wikilink 0 / frontmatter 0 / fence 0 (docs md 120)

### 내용 정확성 (소스 대조)
- reference 48 + 앱4 + arch + stack: 11 수정
- explainer auth 12 + backend 11: 10 수정
- README 52: 6 수정
- **합계 27 환각/불일치 수정**

### Opus 스포트체크 (서브에이전트 재검증)
표본 11건 grep 재검증 — **전부 일치, 허위검증 0**:
cookie-strategy CSRF 부재 · mfa `enabled` · oauth `randomBytes(32)` · audit `SIGNED_IN`/`on,off` · drizzle `src/infra/schema`/`OnModuleDestroy` · nestjs-auth `keyStore` · cache `getOrSet` · jwt `FakeKeyStore` · `useSession` 반환.

## 🔍 발견 사항

- **🔒 CSRF 미배선 (실제 코드 결함)**: `auth-rate-limit/src/csrf.ts` 구현됐으나 `apps/api` refresh endpoint 미배선. SameSite=Lax 단독 → 서브도메인 공격 시 CSRF 노출. cookie-strategy explainer 가 배선된 듯 과장 → 수정. **Icebox 등록, 코드 미수정.**
- **대표 환각**: mfa `pending`(없는 컬럼)·`verifyMfaChallengeToken`(없는 함수), audit 이벤트명 전부 틀림(`LOGIN_SUCCESS`→`SIGNED_IN`), oauth `randomBytes(16→32)`, reset/verify `DELETE`→`markUsed`, nestjs-auth `secret`→`keyStore`. LLM 대량 저술 문서의 전형적 환각 — **검증 없이 main 승격은 위험했음을 실증**.
- **Opus 스포트체크 가치**: 서브에이전트가 "확인함"이라 한 것을 메인이 grep 재검증 → 이번엔 허위 0이었으나, 이 단계가 신뢰의 근거.

## 🚧 이월 항목

- 🔒 CSRF 배선 fix → `backlog/queue.md` Icebox 등록 (별도 spec-x-csrf-wiring 후보).
- RCA-002(check-secrets 오탐) — 본 spec 커밋도 warn 우회 재적용.

## 🔗 관련 문서
- 관련 spec: spec-14-07 (검증 대상)
- 리포트: `specs/spec-14-08-docs-verification/verification-report.md`
- 관련 RCA: `docs/rca/RCA-002-check-secrets-false-positive.md`

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성 기간 | 2026-06-01 |
| 최종 commit | (ship 시 갱신) |
