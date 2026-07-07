# Walkthrough: spec-24-02

> phase-23 회고 잔여 결함 3건(Wa/We/Wf) 묶음 처리.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Wa 빈 시크릿 처리 | `?? ""` 유지 / fail-fast throw | **fail-fast `AppError(INTERNAL/500)`** | 설정 누락은 빈값 진행보다 즉시 실패가 디버깅·안전성에 우월. 전역 필터가 HTTP 매핑(ADR-0027) |
| We 무효 orgRole 처리 | null 폴백 / 401 거부 | **null 폴백 (fail-closed)** | 인증 자체는 유효, org 스코프 권한만 박탈 → OrgRolesGuard 가 자연히 거부. 위조 claim 이 권한 못 얻음 |
| Wf | 신규 ADR / 기존 0027 보강 | **0027 보강** | 동일 주제(에러 레이어링) — 별도 ADR 불필요 |

## 💬 사용자 협의

- **주제**: 진행 방향(phase-24 → 24-02 회고결함 묶음)
  - **합의**: 추천대로 24-02 착수, We 는 null 폴백 채택.

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `turbo run lint typecheck test` (로컬 5434 DB 기동)
- **결과**: ✅ 142/142 task. apps/api **340 tests**(단위+e2e) PASS, nestjs-auth 28 PASS, lint/typecheck 회귀 0.
- oauth.service: env 누락 fail-fast 2 cases PASS. auth.guard: orgRole null폴백/보존 2 cases PASS.

### 수동 검증
1. GOOGLE_CLIENT_ID 미설정 + `buildAuthorizationUrl("google")` → `AppError` throw (빈 문자열 진행 아님).
2. 위조 orgRole("superadmin") claim → `req.user.orgRole = null` (org 스코프 거부).

## 🔍 발견 사항

- **Wa 가 기존 OAuth authorize e2e 를 깸**: `auth.e2e.test.ts` 의 google/kakao authorize 테스트가 client env 없이 302 를 기대(옛 `?? ""` 관대함 의존)했다. fail-fast 가 정상 동작해 500. → **테스트가 새 계약에 맞게 client env 를 주입하도록 정정**(테스트 자체가 빈 client_id 로 통과하던 것이 smell). 별도 커밋 `f3b2756`.
- **Wf 는 부분적으로 stale 했음**: ADR-0027 은 일반 5xx→statusCode 변경은 이미 문서화. 누락분은 23-07 의 필터 하드닝(클램프 + 5xx 본문 억제) → 이를 보강.

## 🚧 이월 항목

- Wb (account.stores 테스트 독립성), Wd (route-inventory 근본 개선) — phase-24 후속 또는 다음 phase. 본 spec 범위 밖(spec 에 명시).
