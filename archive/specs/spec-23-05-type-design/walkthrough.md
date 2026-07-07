# Walkthrough: spec-23-05-type-design

> phase-23 F 중 타입설계(F3/F4). 컨트롤러 분할(F1/F2)은 23-06 으로 분리(안전망 선행).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| F 범위 | 전체 / 타입설계만 | **F3+F4** | F1/F2 는 미테스트 컨트롤러 + 로컬 e2e 부재 → 라우트 회귀 로컬검증 불가 (사용자 선택) |
| admin role 타입 | OrgRole / Role | **Role** | platform admin role("user"/"admin") — org 멤버십(OrgRole) 아님 |
| OAuthUserInfo | 단일 / union | **provider 판별 union** | google name 제공·kakao 없음을 타입으로 명시. 소비자는 providerAccountId/email 만 써 cascade 없음 |
| frontend role 소스 | 컴포넌트만 / 쿼리 스키마 | **쿼리 zod(`OrgRole`)** | 상태만 바꾸면 데이터 소스 불일치 → 응답 zod 스키마를 `OrgRole` enum 으로 (단일 소스) |

## 💬 사용자 협의
- 사용자: F 중 "F3+F4(타입설계, 안전)" 선택. 컨트롤러 분할은 23-06.

## 🧪 검증 결과
- `apps/api`·`apps/web`·`@repo/backend-auth-oauth` typecheck 그린(FULL TURBO).
- oauth 패키지 + service 테스트 22, web MemberTable 6(web 자체 러너) 그린.
- `role: string`(의도 외) grep 0.

## 🔍 발견 사항
- `role: string` 이 enum 존재에도 6곳에서 원시 사용 — service/컴포넌트 타입을 `OrgRole`/`Role` 로. frontend 는 **쿼리 zod 스키마**(`OrgRole`)가 단일 소스라 거기서 교정해야 상태까지 정합.
- `OAuthUserInfo.name` 은 추출되지만 소비자(findOrCreateOAuthUser)가 안 씀 — 관찰만(범위 외).
- web `.tsx` 테스트는 root `pnpm vitest` 로는 JSX 파싱 실패(설정 불일치) — apps/web 자체 러너로 검증해야 함(러너 컨텍스트, 코드 무관).

## 🚧 이월 항목
- **F1/F2 컨트롤러 분할** → spec-23-06 (passkey/mfa/auth 컨트롤러 테스트 안전망 선행).
- B2, D2/3/4/6 → 후속.
- phase-23 은 23-06(컨트롤러 분할) 후 `/hk-phase-ship` 또는 23-06 을 Icebox 로 내리고 조기 종료 가능.
