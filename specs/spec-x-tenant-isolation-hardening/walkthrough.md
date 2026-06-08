# Walkthrough: spec-x-tenant-isolation-hardening

> phase-17 격리 부채(W-2/W-5/W-6) 마무리.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 쓰기 강제(W-2) | 앱 레이어 필터 / **RLS WITH CHECK** | **WITH CHECK** | 읽기(USING)와 대칭, SoT 단일 |
| 시스템 쓰기 호환 | 정책 분기 / **NULL 컨텍스트 허용** | NULL/빈문자열 허용 | provision/invite accept(runWithSystemTenant) 회귀 0 |
| 슈퍼유저 가드(W-5) | username 휴리스틱 / **DB rolsuper** | **부팅 시 `SELECT rolsuper`** | DB 사실 기반 정확. BYPASSRLS/타 슈퍼유저 포착 |
| W-6 | 신규 테스트 추가 / **기존 확인** | **기존 충분 — 추가 안 함** | 어댑터 happy+error 경로 이미 테스트됨 |

## 💬 사용자 협의
- **주제**: phase-17 격리 잔여 마무리 구조
  - **합의**: B(격리 잔여) 우선, **1개 spec-x 번들**로 3건 한 번에

## 🧪 검증 결과

### 자동화 테스트 (Integration Test Required = yes)
- **명령**: `DATABASE_URL=<app_runtime> DATABASE_MIGRATE_URL=<owner> pnpm --filter @apps/api test`
- **결과**: ✅ 146 tests / 23 files (fresh DB)
- **핵심 신규**: 쓰기 격리 e2e(ctx=A → org_id=B INSERT 거부, org_id=A 허용) · SuperuserGuard(3)

### 전체 게이트 (CI 조건 — fresh DB)
- `pnpm turbo run knip depcruise lint typecheck test build` → ✅ **137 tasks GREEN**

### 수동 검증 (회고 항목별)
1. **W-2**: ctx=A INSERT org_id=B → **rejected**(WITH CHECK). org_id=A → ok. provision/invite accept(시스템 컨텍스트) 회귀 0.
2. **W-5**: production + rolsuper → 기동 거부(단위). non-prod 미검사.
3. **W-6**: `createResendNotifier` 의 SDK 호출 + error→throw 경로 **이미 테스트됨**(`notification/index.test.ts`). 진짜 live-send 는 실 키·인박스 필요라 자동화 불가 — 한계 명시로 종결.

## 🔍 발견 사항
- W-6 은 spec-17-01 시점에 이미 충분히 테스트돼 있어 추가 작업 불필요(중복 회피).
- 쓰기 강제 후에도 invite accept(cross-org membership 삽입)가 `runWithSystemTenant`(NULL 컨텍스트)로 통과 — 설계가 맞물려 회귀 0.

## 🚧 이월 항목
- 쓰기 강제는 도메인 3테이블까지. provider 모드(phase-18) 쓰기는 그 phase 에서.

## 🔗 관련 문서
- ADR: `docs/adr/0024-tenant-isolation-enforcement.md` (쓰기 강제·부팅 가드 보강 반영)
- 회고: `docs/review/2026-06-08-phase-17-review.md` (W-2/W-5/W-6)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성 기간 | 2026-06-08 |
| 최종 commit | (ship 시 갱신) |
