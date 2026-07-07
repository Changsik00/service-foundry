# spec-26-01: id 생성 유틸 + 노출 root 감사 (안전망 선결)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-01` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-01-id-util-and-audit` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Feature (foundation) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

ADR-0028 로 3-티어 ID 체계(내부 uuid v7 PK + 불투명 prefixed public_id + provider_uid 매핑)를 확정했다. 현재 식별자 생성은 분산돼 있다: 토큰은 `randomBytes(32).toString("base64url")`(auth-session), PK 는 drizzle `uuid().defaultRandom()`(= pg `gen_random_uuid()`, **v4**). 공통 `public_id` 생성기와 prefix 규약은 없다.

### 문제점

- public_id 를 도입하려면 **모든 후속 spec(26-02~05)이 공유할 생성기·prefix 규약**이 먼저 있어야 한다 — 없으면 각 spec 이 제각각 생성 로직을 만들어 표류한다.
- 후속 spec 의 범위(어떤 root 에 public_id 를 다느냐)가 **감사로 확정되지 않으면** scope 가 흔들린다.

### 해결 방안

스키마/런타임을 건드리지 않는 **순수 유틸 패키지 `@repo/backend-id`** 를 TDD 로 먼저 만들고(생성기·prefix 레지스트리·uuidv7), 동시에 **내부 uuid 외부 노출 감사**로 후속 spec 의 대상 root 를 확정한다. (24-01 안전망-선결 패턴)

## 요구사항

1. **public_id 생성기** `publicId(prefix)`: `<prefix>_<base32 랜덤>`. 랜덤부 = `crypto.randomBytes(16)`(128bit) 를 **Crockford base32**(모호문자 I/L/O/U 제외) 인코딩 → 26자. 결과 예: `usr_3k9q...`(총 30자).
2. **prefix 중앙 레지스트리**: 엔티티→prefix 단일 출처 상수(`ID_PREFIX`). 타입 안전(union). 확정 root: `user→usr`, `org→org`, `session→ses`, `apiKey→key`.
3. **uuidv7 생성기** `uuidv7()`: 앱-레이어 구현(PG 버전 비의존). RFC 9562 v7 레이아웃(48bit ms timestamp + ver/variant + 랜덤). 내부 PK default 전용(외부 노출 안 함).
4. **불투명성**: public_id 랜덤부에 timestamp·순서 정보가 없어야 한다(정렬 불가). uuidv7 과 분리.
5. **패키지 경계**: `packages/backend/id` (core, **framework dep 0**, `node:crypto` 만). `@repo/backend-id` flat alias.
6. **노출 root 감사 확정**: 내부 uuid 가 API 응답·JWT·URL 로 나가는 root 를 확정해 본 spec 산출물(아래 표)로 고정.

## Out of Scope

- 스키마 컬럼 추가·마이그레이션 (→ 26-02 users, 26-04 org, 26-05 sessions/api-keys)
- JWT `sub` 전환·verifier/guard 정규화 (→ 26-03)
- RLS/interceptor 변경 (→ 26-04)
- 누출 감사 자동 스냅샷 테스트 (→ 26-06) — 본 spec 은 *수동* 감사로 리스트만 확정
- 기존 v4 PK 행의 v7 재생성 (불필요 — uuid 호환, default 만 v7)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] public_id 길이/인코딩: prefix + 26자 Crockford base32(128bit). 더 짧게(예: 80bit/16자) 원하면 조정 가능 — 충돌 확률 vs 길이 트레이드오프.
> - [ ] uuidv7 을 앱-레이어로 생성(채택) vs PG18 `uuidv7()` SQL default. PG 버전 비의존 위해 앱-레이어 선택.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **public_id** | `node:crypto` randomBytes(16) + Crockford base32, prefix 부착 | dep 0(기존 token 패턴 일관), 불투명·비순차, URL-safe·대소문자 모호 제거 |
| **prefix** | 중앙 `ID_PREFIX` 상수 + 타입 union | 단일 출처, 타입 혼동 방지, 로그 자기설명 |
| **uuidv7** | 앱-레이어 RFC 9562 구현 | PG 버전 비의존, 내부 PK 정렬·인덱스 지역성 |
| **패키지** | `packages/backend/id` core | platform-agnostic(ADR-0015), 모든 backend/nestjs 가 의존 가능 |

## Proposed Changes

#### [NEW] `packages/backend/id/` (`@repo/backend-id`)
- `package.json` / `tsconfig` — 기존 backend core 패키지 형식 따름, dep: 없음(node 빌트인만)
- `src/public-id.ts` — `publicId(prefix: string): string`, Crockford base32 인코더
- `src/prefix.ts` — `ID_PREFIX` 레지스트리 + `IdPrefix` 타입
- `src/uuidv7.ts` — `uuidv7(): string`
- `src/index.ts` — 배럴

#### [NEW] `packages/backend/id/src/*.test.ts`
- public_id: 형식(`prefix_` + 26자)·문자집합(Crockford only)·고유성(대량 생성 충돌 0)·prefix 반영
- uuidv7: v7 레이아웃(version nibble=7, variant)·시간 단조 증가(앞부분)·형식
- 불투명성: 연속 생성된 public_id 가 정렬해도 생성순서와 무관

> 📌 **감사 결과 (확정 root)** — 본 spec 산출물:
>
> | Root | 노출 경로 | 후속 spec |
> |---|---|---|
> | **users** | signin/signup/refresh `user.id`, JWT `sub`, /auth/me, /admin/users | 26-02 |
> | **organizations** | /auth/orgs·/org/members `orgId`, JWT `active_org`, /admin/orgs | 26-04 (RLS) |
> | **sessions** | GET /auth/sessions `id`, DELETE /auth/sessions/:id | 26-05 |
> | **api-keys** | GET/POST /auth/api-keys `id`, DELETE /auth/api-keys/:id | 26-05 |
> | memberships | `userId`/`orgId` 노출 → **users/org public_id 상속** (자체 public_id 불요) | (상속) |
> | invitations | 토큰 기반, 객체 미노출 (응답 `orgId` 는 org public_id) | 불요 |
> | mfa / passkey / oauth-accounts | 객체 미노출 | 불요 |

## 검증 계획

```bash
turbo run lint typecheck test --filter=@repo/backend-id
```

수동 검증 시나리오:
1. `publicId(ID_PREFIX.user)` 1e6회 생성 → 형식 `usr_[0-9A-HJKMNP-TV-Z]{26}`, 충돌 0 — 기대: PASS
2. `uuidv7()` 두 번 호출 → version nibble=7, 두 값의 timestamp 부 단조 비감소 — 기대: PASS

## 롤백 계획

- `git revert` — 신규 패키지 추가만, 기존 코드 참조 없음(런타임 무영향). state/마이그레이션/외부 부수효과 없음.

## ADR 후보

- [x] 이미 ADR-0028 로 결정 기록됨. 본 spec 은 시행 — 추가 ADR 불요.
- [ ] 없음

## ✅ Definition of Done

- [ ] `@repo/backend-id` 유틸 + 단위 테스트 PASS (생성기·prefix·uuidv7·불투명성)
- [ ] 감사 확정 root 표 본 spec 에 고정 (후속 spec 범위 확정)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-26-01-id-util-and-audit` 브랜치 push 완료
