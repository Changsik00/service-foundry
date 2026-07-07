# Walkthrough: spec-24-01

> phase-24 첫 spec. 무테스트 컨트롤러 8개에 회귀 안전망(단위 테스트) 추가.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| spec 범위 (감사 §G는 "~11 모듈 무테스트") | 지목대로 / 실측 재정정 | **실측 재정정** | 사전 조사 결과 서비스는 이미 전부 테스트됨, jwt.service 는 패키지 이관됨 → 실제 무테스트는 컨트롤러 8개뿐 |
| 가드/@OrgRoles 메타 검증 위치 | 컨트롤러별 reflect / route-inventory | **route-inventory 확장** | 메타 키 추측 회피 + 분할(24-03) 회귀 가드를 한 곳에 집약 (Wd 교훈) |
| `DELETE /auth/account//` 이중 슬래시 | 정정 / 그대로 스냅샷 | **그대로 고정 + 주석** | `@Delete()` 빈 경로의 실제 리플렉션 산물(라우팅 시 collapse). 계약 문자열로 박아 드리프트 감지 |
| 테스트 방식 | TDD Red / characterization | **characterization** | 기존 코드 회귀 안전망이 목적 — 신규 동작 없음. 코드 거울(Wb) 회피 위해 "위임 인자/거부 분기" 위주 |

## 💬 사용자 협의

- **주제**: e2e signup 500 의 원인이 Supabase 시나리오 미성립인지
  - **합의**: 직접 검증. e2e 의 signup/signin 은 **native auth(Postgres)** 경로이며 Supabase 무관. 500 은 로컬 5434 DB 부재 때문이었고, CI 동일 DB 기동 후 e2e 95/95 PASS 로 확정.

## 🧪 검증 결과

### 자동화 테스트 (단위)
- **명령**: `cd apps/api && npx vitest run --exclude '**/*.e2e.test.ts'`
- **결과**: ✅ Passed — 243 tests / 48 files (신규 컨트롤러 8 + route-inventory 2 포함)

### 통합 테스트 (e2e, 로컬 DB 기동)
- **명령**: CI 동일 — postgres:16 @5434 + `app_runtime` role + `db:migrate` 후 `npx vitest run e2e.test`
- **결과**: ✅ Passed — 95 tests / 12 files (회귀 0)

### 모노레포 게이트
- `npx turbo run test lint typecheck` — apps/api e2e 외 전부 통과(141/142). e2e 는 위 DB 기동으로 별도 그린.

## 🔍 발견 사항

- **route-inventory 가 일부 컨트롤러만 커버**했음(Auth/Session/Org). 나머지 6개(account/passkey/mfa/oauth/provider-org/provider-me, 22 라우트)를 `EXPECTED_OTHER_ROUTES` 로 보강.
- **로컬 e2e DB 셋업 공백 재확인** — `pnpm infra:up`(5432 dev)과 e2e DB(5434/test/app_runtime)는 별개. CI 만 자동 제공. 본 spec 에서 수동 recipe 로 통과 확인.
- 컨트롤러 코드 결함은 발견되지 않음(전부 기존 코드 무변경으로 그린).

## 🚧 이월 항목

- **로컬 e2e DB 자동화** — 이미 `backlog/queue.md` 에 등재된 항목. 본 spec 에서 수동 recipe(postgres@5434 + app_runtime + migrate) 확인. 향후 spec-x 후보.
- phase-23 회고 **Wd**(route-inventory 컨트롤러 미인스턴스화 + 가드 순서 미검증 + 하드코딩 brittle)는 본 spec 범위 밖 — 스냅샷 커버리지만 확장. 근본 개선은 후속.
