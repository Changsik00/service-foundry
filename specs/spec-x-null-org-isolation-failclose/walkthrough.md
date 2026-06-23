# Walkthrough: spec-x-null-org-isolation-failclose

> phase-24 회고 보안 패널이 발견한 cross-tenant 누수를 차단하는 hotfix.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 수정 위치 | interceptor(systemic) / 서비스별 WHERE(국소) | **interceptor fail-close** | 한 곳으로 org-scoped 모든 RLS-only 엔드포인트 동시 보호 |
| 인증-null 컨텍스트 | permissive 유지 / 불가능 컨텍스트 | **nil-uuid(fail-closed)** | NULL=퍼미시브가 누수 근원. nil-uuid 는 어떤 org 와도 불일치 → 전 행 차단 |
| 미인증 경로 | 동일 fail-close / permissive 유지 | **permissive 유지** | signup·csrf 등 bootstrap 은 org 컨텍스트 전이라 NULL 퍼미시브 필요 |

## 💬 사용자 협의

- 진행 모드: governed→auto 전환(사용자 `/hk-auto`). 보안 fix 라 **ship 전 `/hk-refute`(검증 2단계)** 를 명시 수행.

## 🧪 검증 결과

### 누수 재현 (수정 전)
- 로컬 5434, app_runtime, SET LOCAL 없음: `memberships` 78행 / **66 org** 전부 가시. → 인증-null 토큰이 이 경로로 빠짐.

### 자동 테스트
- 단위(`@repo/nestjs-tenant`) 3분기: 미인증→permissive, 인증+null→nil tx(fail-closed), 인증+org→org tx. TDD Red→Green.
- e2e(`tenant-isolation.http.e2e`): 앱 keystore 로 **activeOrgId 없는 인증 토큰**(OAuth 동형) 서명 → `GET /auth/org/members` → **0건**(a·b 어느 org 도 안 보임). 수정 전이면 전 org 노출.
- 전체 게이트: `turbo run lint typecheck test` **151/151**, 회귀 0.

### 검증 2단계 (/hk-refute, Opus 독립 적대검증)
- **권고: Go (반증 실패=견고)**. nil-uuid org DB 부재→전면차단 실측, runWithSystemTenant 윈도우 정상(정당 흐름 회귀 0), e2e 토큰=OAuth 동형 확인.
- 잔여 표면 S1/S2(raw `pool.query` 경로: org-switch·api-key)는 **명시 `WHERE org_id` 보유로 누수 없음** + spec Out of Scope(defense-in-depth 후속) 정합. S3(단위테스트가 의도 아닌 구현 박제)는 e2e 가 실 RLS 로 의도 증명 → non-blocking.

## 🔍 발견 사항

- 근원: interceptor 가 "미인증"과 "인증+org없음"을 동일 NULL-퍼미시브로 처리. RLS 정책은 정상 — 앱의 컨텍스트 주입이 문제.
- phase-24 회귀 아님(standing 결함). phase-24 가 바로 이 코드를 이관(spec-24-05)하고도 못 잡은 이유: 격리 e2e 가 orgId 있는 토큰만 검증 → 이번에 null-org e2e 추가로 갭 보강.

## 🚧 이월 항목

- S1/S2 raw pool 경로 defense-in-depth(서비스 WHERE 보강) — 누수는 없으나 단일 방어선. 후속 후보.
- OAuth 사용자 personal org 자동 provisioning — 제품 결정, 별도.
