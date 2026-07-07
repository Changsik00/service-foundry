# Walkthrough: spec-24-06

> Drizzle 스키마(15 파일)를 `@repo/backend-schema` 로 이관 (E2). auto 모드 자율 수행.

## 📌 결정 기록 (auto)

| 이슈 | 결정 | 근거 |
|---|---|---|
| E2 스키마 패키지 경계 | 스키마 소스만 @repo/backend-schema 로, migrations+drizzle.config 는 apps/api 잔류 | 마이그레이션은 app/deploy 관심사·저널 정합 유지; 스키마 def 만 재사용 대상 |
| 파일 이동 방식 | `git mv` (rename 100%) | 히스토리 보존 |
| 소비처 import | barrel 수렴 + drizzle.config 는 `/local` subpath | barrel 이 전 테이블·타입 re-export |

## 💬 §11.3 재검증

- 감사의 "50+ 파일"은 과대평가 — 실측 **15 파일 / 358 LOC**, 소비처 18. 마이그레이션 SQL+`_journal.json` 은 스키마와 분리(`apps/api/drizzle/`) → 이관이 저널-안전함을 확인하고 진행.

## 🧪 검증 결과

### 저널 정합 (핵심)
- `db:generate` → **"No schema changes, nothing to migrate"** (드리프트 0).
- **fresh DB(컨테이너 재생성) `db:migrate`** → 0000~0009 클린 적용 성공. 저널 정합 증명.

### 자동화 테스트
- `turbo run lint typecheck test` (로컬 5434 fresh DB) → ✅ **151/151 task**. apps/api 237 단위 + e2e, backend-schema typecheck, 회귀 0.

## 🔍 발견 사항

- **mock 취약성 발견·수정**: barrel(index.ts)이 `sessions`(외부 `@repo/backend-auth-session`)를 re-export 하는데 `org-invite.service.test.ts` 가 그 패키지를 부분 mock(토큰 함수만) → barrel 경유 시 `sessions` 누락 에러. → **실제 export 보존 + 함수만 override** 하는 부분 mock 으로 견고화.
- `git mv` rename 100% 추적 — diff 가 이동으로 표시(내용 무변경 증거).

## 🚧 이월 항목

- E3(provision·org 도메인 서비스 분리), E4(superuser-guard·feature-flag·cookie/csrf 패키지화) — 후속 phase 후보.
- **phase-24 마지막 spec** — 다음은 `/hk-phase-ship`.
