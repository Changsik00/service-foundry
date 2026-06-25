---
id: ADR-0028
type: decision
date: 2026-06-25
status: accepted
---

# ADR-0028: ID 체계 — 내부 uuid PK + 불투명 public_id(prefix) + provider_uid 매핑

## 📚 Context

현재 식별자 체계가 두 가지 누수를 안고 있다:

1. **PK 직접 노출**: `users.id`(uuid v4 PK)가 API 응답·URL·**native JWT `sub`** 에 그대로 노출된다. v4 랜덤이라 열거(enumeration) 위험은 낮지만, 내부 저장 표현이 외부 계약에 결합돼 재키잉·레코드 병합·표현 변경이 어렵다.
2. **`sub` 의 다형성**: native 모드는 `sub = users.id`(내부 PK), provider(supabase) 모드는 `sub = providerUid`(외부 UID). 같은 "내 식별자"가 모드마다 의미가 달라, 컨슈머마다 분기(`listForUserId` vs `listForProviderUid`)와 쿼리 중복이 생기고 식별자 의미 모호성이 잠재 버그원이 된다(spec-x 계열 cross-tenant 누수와 한 뿌리).

서비스 파운드리(보일러플레이트)로서 ID 체계는 다운스트림이 그대로 물려받는 기반 결정이므로 정본화한다.

## 🎯 Decision

3-티어 식별자 체계를 확립한다.

| 티어 | 식별자 | 타입 | 노출 | 규칙 |
|---|---|---|---|---|
| 내부 PK | `id` | uuid (**v7 default**) | ❌ 절대 외부로 안 나감 | 모든 FK·조인의 유일 타깃. 기존 v4 행은 유지(uuid 호환), 신규 행만 v7 |
| 외부 | `public_id` | text **UK** | ✅ API·URL·JWT | **불투명 랜덤** + 타입 prefix. 정렬·timestamp 정보 비노출 |
| IdP 매핑 | `provider_uid` | text UK | ❌ lookup 전용 | Supabase/Firebase → 내부 user 해석 (기존 유지) |

1. **내부 PK 는 절대 외부 표면에 노출하지 않는다.** API 응답·URL·JWT 어디에도 내부 uuid 가 나가지 않는 것을 phase 종료 시 스냅샷 테스트로 강제한다(불변식).
2. **public_id = 불투명 랜덤 + prefix.** 형식: `<prefix>_<base32(Crockford, 모호문자 제외) 랜덤 128bit>` (예: `usr_…`, `org_…`, `key_…`). prefix 는 중앙 레지스트리로 관리(타입 혼동 방지·로그 자기설명). **timestamp·순서 정보를 담지 않는다** — "정보 비노출" 의도(정렬가능 ULID/uuidv7을 public에 쓰지 않는 이유). 적용 범위는 **전 aggregate root**(외부 노출되는 root: users·organizations·api-keys·sessions 등 — 대상은 감사로 확정).
3. **내부 PK 는 uuid v7 default 로 전환.** 정렬성·인덱스 지역성은 *내부* PK 에서 취하고, *외부* public_id 는 불투명 랜덤으로 분리한다. v7 은 timestamp 를 품지만 내부 전용이라 노출 문제 없음.
4. **경계에서 식별자 정규화.** verifier/guard 가 native 의 `sub`(=public_id) 와 provider 의 `sub`(=providerUid) 를 **내부 `users.id` 로 해석**해 `AuthenticatedUser.userId`(서버 전용, 내부 PK) 로 통일한다. 클라이언트 표면에는 `public_id` 만 나간다. 결과적으로 컨슈머의 모드 분기가 사라지고 `listForUserId` 하나로 수렴한다.
5. **org RLS 정합.** organizations 에 public_id 도입 시, JWT `active_org` 클레임과 `SET LOCAL app.current_org` 는 RLS 술어(`memberships.org_id` = 내부 uuid)와 비교되므로 interceptor 에서 public→내부 org id 를 해석해 **RLS 는 내부 id 로 작동**시킨다.

## 📊 Consequences

- **긍정**: 내부/외부 디커플링(재키잉·표현 변경 자유), `sub` 다형성 제거 → 컨슈머 단일화·쿼리 중복 소멸, prefix 로 로그/디버깅 자기설명, public 정보 비노출(생성시각·순서 추정 불가).
- **부정 (성능)**: 경계 정규화로 요청당 `public_id|providerUid → 내부 id` lookup 1회 추가. provider 는 이미 매 요청 provision DB 트랜잭션을 타므로(ADR-0026) 추가 비용 작음; native 는 캐시 가능. 내부 PK lookup 은 UK 인덱스로 O(1)에 가깝다.
- **부정 (마이그레이션)**: public_id 는 NOT NULL UK → 3-step 마이그레이션(추가→백필→제약). 다운스트림 데이터 보유를 가정해 백필 필수.
- **중립**: native JWT `sub` 계약 변경(=public_id) — 클라이언트가 토큰의 sub 를 내부 id 로 쓰던 곳이 있으면 public_id 로 이행. 본 파운드리는 web 이 provider 전용이라 영향 국소.

## 🔀 Alternatives

- **public_id 를 ULID/uuidv7 로**: 정렬·compact 이점이나 생성 timestamp·순서를 외부에 노출 → "정보 비노출" 의도와 충돌. 정렬은 내부 PK(v7)에서 취하고 외부는 불투명 랜덤으로 분리해 둘을 모두 만족(채택안).
- **PK 노출 유지(현행)**: v4 랜덤이라 열거 위험은 낮으나 내부/외부 결합·`sub` 다형성 문제가 남음. 파운드리 기반 결정으론 부적합.
- **public_id 를 PK 로 승격**: 내부/외부 재결합 → 노출 문제 재발. 대리키(내부 uuid) 분리 유지.
- **users 만 적용**: blast-radius 최소이나 org id 가 URL·JWT 에 노출되는 누수가 남음 → 전 root 로 결정(단계적 시행).

## 🔗 Related

- [[ADR-0022]] 멀티테넌시 · [[ADR-0023]] 권위 모드 · [[ADR-0026]] provider active-org 운반 · [[ADR-0024]] tenant isolation(RLS)
- phase-26 (본 ADR 시행)
