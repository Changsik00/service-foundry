# Walkthrough: spec-26-06

> api-keys·sessions public_id 도입 — 26-01 감사 확정 root 의 마지막 둘. 내부 FK/rotation/verifyKey 불변.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| api-key verifyKey 반환 | ApiKeyPublic(public) / **내부 {id,orgId}** | **내부** | guard 가 verifyKey().orgId 로 RLS 컨텍스트 설정 → 내부 uuid 필수. list/create 만 public |
| DELETE /:id | 내부 uuid / **public_id** | public_id | api-key=`public_id AND org_id` 매칭, session=public_id→소유 userId 검증(IDOR 안전) |
| 응답 orgId | 내부 / **org public_id 상속** | org public | 내부 org uuid 제거(26-05 일관). api-key=서브쿼리, session=batch 해석 |
| session orgId 해석 | store join / **service batch** | service(DATABASE 주입) | 패키지 변경 최소, distinct org 1쿼리 |

## 💬 사용자 협의

- DELETE public_id 수용 + orgId 상속 2결정 → "1"(승인, /hk-plan-accept).

## 🧪 검증 결과

- api-key e2e: `id`=`^key_…`·`orgId`=`^org_…`, DELETE(public_id) 204, 타 org 키 403, **RLS backstop**(26-04) 유지. verifyKey 내부 id → RLS 컨텍스트 정상.
- session e2e: `id`=`^ses_…`, DELETE(내 세션 public_id) 204, 타인 세션 403, current 식별·일괄 종료 보존.
- 전체 게이트(fresh 5434): turbo lint+typecheck+test **154/154 tasks**, 회귀 0.

## 🔧 변경

- `api-keys.ts`·`auth-session/schema.ts` publicId 컬럼 + 마이그레이션 0023(VOLATILE 백필, 두 컬럼; api_keys 는 local.ts 미등록이라 수동 추가).
- `api-key.service`: list/create public_id+org public(서브쿼리), revoke by public_id, **verifyKey 내부 {id,orgId} 반환**(guard/RLS).
- `auth-session` store: `findByPublicId`. `session-management.service`: id=public·orgId=org public(DATABASE batch), revoke by public_id + 소유 검증.
- 테스트 blast-radius: SessionRow 픽스처(publicId)·SessionStore mock(findByPublicId)·session 서비스 mock(DATABASE) 다수 갱신.

## 🚧 이월

- **26-07(누출 스냅샷)**: 이제 4개 root(users/org/sessions/api-keys) 모두 닫힘 → 전 응답·JWT 내부 uuid 0 전수 검증 + admin cursor·web uuid-가정 부채 점검.
