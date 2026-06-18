# Walkthrough: spec-17-08

> 테넌트 격리를 실 요청 경로에서 작동시키고 회귀를 차단한다. 회고 C-1~C-5 해소.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 클레임 매핑(C-1) | 가드만 수정 / 공유 상수 | **공유 상수 `ACTIVE_ORG_CLAIM`** | 표류가 결함 원인 — 서명·검증 한 곳 고정 |
| RLS 범위(C-3) | 전 테이블 백필 / **도메인 한정** | **도메인 3테이블만** | auth 인프라는 org-스코프 아님, 세션 회귀 차단 |
| cross-org 조회(C-4) | base pool / **시스템 컨텍스트 toggle** | **runWithSystemTenant** | 같은 tx 유지(원자성) + 토큰 인가 |
| ALS 공유(DI) | 모듈별 provider / **@Global TenantModule** | **Global 단일 인스턴스** | proxy·interceptor·org 서비스가 동일 ALS 필요 |
| 검증 | raw SQL / **실 HTTP** | **실 HTTP 통합** | 거짓 GREEN 재발 차단([[feedback_isolation_test_real_path]]) |

### ADR 승격
- [x] 작성됨: `docs/adr/0024-tenant-isolation-enforcement.md` (type: invariant)

## 💬 사용자 협의

- **주제**: 회고 NO-GO 후속
  - **합의**: 1번(spec-17-08 로 C-1~C-5 + 실 HTTP 테스트 배선) 진행
- **주제**: CI 이슈
  - **사용자 지적**: "ci 이슈도 있어, 마지막에 확인 잘 해서 올려줘"
  - **확인**: 최신 phase-17 CI 실패(`e637286`)는 GitHub 러너의 **일시적 Docker 레지스트리 pull 타임아웃**(Postgres 서비스 이미지 못 받음) — 코드/테스트 무관 infra flake. ship 시 PR CI 끝까지 확인, transient flake 면 re-run.

## 🧪 검증 결과

### 자동화 테스트 (Integration Test Required = yes)
- **명령**: `DATABASE_URL=<app_runtime> DATABASE_MIGRATE_URL=<owner> pnpm --filter @apps/api test`
- **결과**: ✅ 144 tests / 23 files (fresh DB)
- **핵심 신규**:
  - `tenant-isolation.http.e2e.test.ts` — **실 HTTP** org A 토큰이 org B 멤버 차단 + cross-org invite accept(시스템 컨텍스트)
  - guard `activeOrgId` 매핑(2) · signin org 클레임(1) · runWithSystemTenant(2) · invite email 바인딩·중복(2)

### 전체 게이트 (CI 조건 — fresh DB)
- `pnpm turbo run knip depcruise lint typecheck test build` → (ship 직전 확인)

### 수동 검증 (회고 항목별 Before→After)
1. **C-1**: signup 토큰으로 `GET /auth/org/members` → Before: org B 노출(5명) / After: org A 만. (실 HTTP RED→GREEN)
2. **C-2**: signin/refresh 토큰에 `activeOrgId`/`orgRole` 포함(단위 디코드 검증).
3. **C-3**: auth 인프라 RLS 제거 후 signin/refresh/rate-limit 회귀 0(144 GREEN).
4. **C-4**: org A 가 B 초대 → B accept → B 가 org A 멤버(실 HTTP, 시스템 컨텍스트).
5. **C-5**: email 불일치 → 403, 중복 → 409, 단일 tx 원자성.

## 🔍 발견 사항

- **org-invite/org-switch 토큰의 전역 `role` 클레임 누락**: C-1 수정으로 이 토큰들이 가드의 role 검사에 도달하며 401 표면화 → 두 서비스 모두 `role` 포함하도록 수정(잠재 버그였음).
- raw-SQL DB-level 테스트(17-07)는 C-3 로 `failed_logins` RLS 가 제거돼 도메인 테이블(organizations)로 갱신.

## 🚧 이월 항목

- 쓰기 경로 RLS 강제(`WITH CHECK`) → queue.md (후속)
- 운영 풀/pgbouncer 가이드(W-4) → infra phase
- production 슈퍼유저 가드 강화(W-5, BYPASSRLS/role 상속) → queue.md
- 이메일 실전송 검증(W-6) → queue.md

## 🔗 관련 문서
- 회고: `docs/review/2026-06-08-phase-17-review.md`
- ADR: `docs/adr/0024-tenant-isolation-enforcement.md`
- 관련 spec: [[spec-17-07]]

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성 기간 | 2026-06-08 |
| 최종 commit | (ship 시 갱신) |
