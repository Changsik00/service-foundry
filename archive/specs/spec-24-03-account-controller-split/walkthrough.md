# Walkthrough: spec-24-03

> account.controller(277 LOC) 를 서비스 의존 경계로 2분할 (F2).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 분할 단위 | 라우트별 다분할 / 서비스 의존 경계 2분할 | **서비스 경계 2분할** | AccountService(account) ↔ EmailChangeService(email-change) 자연 seam, dual-service 제거 |
| avatar 위치 | 별도 컨트롤러 / account 잔류 | **account 잔류** | AccountService 의존 + 단일 라우트, account LOC 188(<200) 달성으로 분리 불필요 |
| F2 + B2 결합 여부 | 한 spec / 분리 | **분리** (B2 → spec-24-04) | 건드리는 파일 비중복(account+모듈 vs provider-org/mfa/passkey), PR 단일 관심사 |

## 💬 사용자 협의

- **주제**: 24-03 scope (F2+B2 결합 vs 분리)
  - **합의**: B2 를 별도 spec-24-04 로 분리. phase.md 로드맵 재조정(`ca81d3d`).

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `turbo run lint typecheck test` (로컬 5434 DB)
- **결과**: ✅ 142/142 task. apps/api **340 tests / 61 files**(단위+e2e), 회귀 0.
- route-inventory: account 6 라우트(분할 후 2 컨트롤러에 분산)+가드 스냅샷 **불변** PASS.
- account.controller.test(5) + email-change.controller.test(2 신규) PASS.

### 수동 검증
1. `wc -l account.controller.ts` → **188** (< 200, 성공기준 #3 충족).
2. account/email-change e2e 회귀 0 (URL prefix 동일 보존).

## 🔍 발견 사항

- account.controller 가 `auth.module` + `provider-auth.module` **양쪽 등록** — 양쪽 controllers 배열에 EmailChangeController 추가. 두 모듈 모두 EmailChangeService 를 이미 provider 로 보유해 DI 추가 불필요.
- URL prefix(`auth/account`)를 EmailChangeController 에도 동일 적용 → route-inventory EXPECTED 문자열 **무변경**(분할이 URL 계약을 안 깬다는 증거).

## 🚧 이월 항목

- **B2** (zod 패턴 통일) → spec-24-04.
- account.controller 의 `body as` 캐스트(zod 부재)는 B2 범위 — 별도 판단.
