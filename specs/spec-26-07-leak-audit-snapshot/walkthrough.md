# Walkthrough: spec-26-07

> 누출 감사 스냅샷 — ADR-0028 §1 불변식("응답 body 에 내부 uuid 0")을 코드로 강제. phase-26 마지막 spec.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 검증 방식 | 리터럴 snapshot / **uuid 스캔** | hex uuid 정규식 스캔 | 랜덤 id 라 리터럴 부적합; 스캔이 회귀 가드로 robust |
| 스캔 범위 | 전체 / **응답 body** | 응답 body | §1 강제 경계. JWT payload(§1 예외)·base64 cursor(불투명)는 hex-uuid 미매칭이라 자연 제외 |
| slug 처리 | 포함 / **제외** | 제외 | 개인 org slug=randomUUID 는 PK 아닌 공개 handle — 식별자 누출 아님 |

## 💬 사용자 협의

- 스캔 범위(응답 body hex uuid) 확인 → "1"(승인).

## 🧪 검증 결과 — **누출 0건 (GREEN)**

주요 인증 엔드포인트 전수 스캔 결과 **내부 uuid 노출 0**:
- auth: signup·signin·`/auth/me`·`/auth/orgs`·`/auth/org/members`
- resource: `/auth/api-keys`(create+list)·`/auth/sessions`
- admin: `/admin/orgs`·`/admin/users` (role 승격 후)

각 식별자 prefix(`usr_`/`org_`/`key_`/`ses_`) sanity 동반 — "필드 누락" 가짜 통과 방지. → 26-02~06 이 4개 root 를 빠짐없이 닫았음이 **전수 실증**됨.

- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, 회귀 0.

## 🔧 변경

- [NEW] `apps/api/src/auth/public-id-leak-audit.e2e.test.ts` — `expectNoInternalUuid` 스캔(slug scrub) + 주요 엔드포인트 순회 + prefix sanity. (런타임 코드 변경 0 — 검증 전용.)

## 🚧 이월 / 한계 (명시)

- **JWT payload**: 내부 sub 포함(§1 예외, self-bearer) — 스캔 비대상.
- **base64 cursor**(admin/org-members): 내부 id 를 base64 인코딩 — hex-uuid 미매칭이라 스캔 비대상(불투명, 의도적).
- **web uuid-가정 부채**(26-05 refute #1): 별도 — web 작업 시 점검.
