# Walkthrough: spec-13-03 — data-foundations (번들)

> 소규모 3 항목(object storage · typed client · test factory)을 1 spec/PR 로 통합. outbox 는 13-04 분리.

## 📌 결정 기록
| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 잔여 spec 구성 | 4 개 개별 / 번들 | **3 번들 + outbox 분리** | 작은 항목 묶되 위험한 outbox 격리 |
| typed client | codegen / per-call schema / 선언적 바인딩 | **선언적 엔드포인트 바인딩** | 기존 per-call `schema` 와 중복 회피 + 정의 1 회 |
| storage 어댑터 | S3 포함 / 포트+memory | **포트 + memory 만** | 새 dep 없이 기준 충족, S3 후속 |
| factory 시퀀스 | 전역 / 인스턴스 | **인스턴스 클로저 + reset** | 테스트 격리 |

### ADR 승격
- [x] 없음 (ADR-0015 포트/어댑터 패턴 적용)

## 🧪 검증 결과
### 단위
- `@repo/backend-storage` ✅ 7 passed — put/get round-trip(바이트·UTF-8) · 미존재 null · del · exists · url 형식
- `@repo/frontend-http-client` ✅ 13 passed (신규 api-client 4 + 기존 9) — 엔드포인트 바인딩 · 스키마 검증 반환 · body/headers/path override · 검증 실패 throw
- `@repo/factory` ✅ 5 passed — 시퀀스 증가 · overrides · buildList · reset
- typecheck: turbo 전체 PASS (git pre-commit 게이트, 48 패키지)

## 🔍 발견 사항 (drift 재검증)
- **typedFetch 중복 발견**: `createHttpClient` 가 이미 `schema?: ZodType<T>` per-call 검증 보유(`index.ts:46,122`). 단순 fetch+parse 래퍼는 무가치 → **선언적 엔드포인트 맵 바인딩**(`createApiClient`)으로 재조정. 정의 1 회로 method/path/검증 스키마를 묶어 호출부 보일러플레이트 제거. silent-inter-spec-drift 회피.
- factory 가 seeding 의 핵심 primitive — 별도 seed 러너 불필요(빌드+insert 조합).

## 🚧 이월 항목
- S3/R2 실제 어댑터(AWS SDK) — 포트만 정의됨, 어댑터 후속.
- 마이그레이션 통합 러너(라이브 DB 검증 필요) — 후속. 성공 기준 6 은 factory 로 **부분 충족**.
- `createApiClient` path 파라미터 — 현재 `opts.path` 수동 override, 템플릿 치환은 후속.

## 🔗 관련
- 관련 phase: `backlog/phase-13.md` (성공 기준 3·4 충족, 6 부분)
- 의존: spec-13-01 (contracts), spec-04-02 (frontend http-client)
- 후속: spec-13-04 (outbox)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | docs 1 + test 3 + feat 3 + ship 1 |
