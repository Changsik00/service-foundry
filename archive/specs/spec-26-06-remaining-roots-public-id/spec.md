# spec-26-06: 나머지 root public_id (api-keys · sessions)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-26-06` |
| **Phase** | `phase-26` |
| **Branch** | `spec-26-06-remaining-roots-public-id` |
| **Base 브랜치** | `phase-26-id-scheme-public-id` |
| **상태** | Planning |
| **타입** | Feature (schema/API 계약 / 노출 전환) |
| **작성일** | 2026-06-25 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

users·organizations 는 public_id 완료(26-02/03/05). 26-01 감사의 확정 root 중 **api-keys·sessions 가 남음**:
- **api-keys**: `GET/POST /auth/api-keys` 응답 `id`(내부 uuid) + `orgId`(내부 org uuid), `DELETE /auth/api-keys/:id`(내부 uuid param).
- **sessions**: `GET /auth/sessions` 응답 `id`(내부 uuid) + `orgId`(내부 org uuid), `DELETE /auth/sessions/:id`(내부 uuid param).

### 문제점

내부 uuid 가 응답·URL 로 노출(ADR-0028 불변식 미충족). DELETE 가 내부 uuid 를 받음.

### 해결 방안

`api_keys.public_id`(`key_`)·`sessions.public_id`(`ses_`) 도입(users/org 패턴: gen_public_id default + VOLATILE 백필). 응답 `id` → 자신의 public_id, 응답 `orgId` → org public_id 상속. `DELETE /:id` 는 public_id 를 받아 **소유 스코프 내 매칭**(api-key: `public_id AND org_id`; session: public_id → 소유 userId 검증) — IDOR 안전.

## 요구사항

1. **`api_keys.public_id`** (text UK, `gen_public_id('key')`) + 백필. **`sessions.public_id`** (text UK, `gen_public_id('ses')`) + 백필.
2. **api-keys 응답**: `id` = api-key public_id, `orgId` = org public_id(조인). `DELETE /:id` 는 public_id → `WHERE public_id = $1 AND org_id = $2`(org 스코프).
3. **sessions 응답**: `id` = session public_id, `orgId` = org public_id(조인/해석). `DELETE /:id` 는 public_id → 소유 userId 검증 후 revoke.
4. **내부 불변**: session FK·rotation(refreshTokenHash/family)·revoke 로직, api_keys org FK·verifyKey(시크릿 조회)는 내부 id 그대로. RLS 무변경.
5. **회귀 0**: api-key·session e2e(생성·조회·취소·격리) PASS.

## Out of Scope

- 누출 감사 스냅샷(전 응답·JWT 내부 uuid 0 종합 검증) → 26-07 (본 spec 으로 마지막 root 가 닫히면 26-07 이 전수 검증)
- admin cursor 내부 id(26-05 와 동일 — 26-07 점검)
- RLS NULL-permissive flip (Icebox)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **DELETE /:id 가 public_id 수용** (내부 uuid 아님). api-key=org 스코프 매칭, session=소유 userId 검증 → IDOR 안전.
> - [ ] **api-key/session 응답 orgId → org public_id 상속** (내부 org uuid 제거).

> [!WARNING]
> - [ ] **Breaking**: api-keys/sessions 식별자 값 uuid→`key_`/`ses_`, DELETE 입력 계약 변경. web 세션/키 관리 UI 동시 점검(현 web 은 provider 전용이라 세션 UI 제거됨 — api-key UI 유무 확인).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| api_keys/sessions id | public_id 컬럼 + 응답 전환 | 외부=public_id |
| orgId(응답) | org public_id 조인 | 내부 org uuid 제거(26-05 일관) |
| DELETE 입력 | public_id + 소유 스코프 매칭 | IDOR 안전, 내부 uuid 제거 |
| 내부 FK/rotation/verifyKey | 내부 id 유지 | 동작·격리 불변 |

## Proposed Changes

#### [MODIFY] `packages/backend/schema/src/api-keys.ts` + `packages/backend/auth-session/src/schema.ts`
- `publicId` 컬럼(text UK, `sql\`gen_public_id('key'|'ses')\``).

#### [NEW] `apps/api/drizzle/00XX_*` (×1, 두 컬럼)
- api_keys/sessions public_id ADD COLUMN(VOLATILE default 백필) + UNIQUE. journal/snapshot.

#### [MODIFY] `apps/api/src/auth/api-key.service.ts`
- list/create 응답 `id`=public_id, `orgId`=org public_id(조인). `revoke(publicId, orgId)` → `WHERE public_id AND org_id`. verifyKey 내부 id 유지.

#### [MODIFY] `apps/api/src/auth/session.stores.ts` + `session-management.service.ts`
- store: publicId 노출 + `findByPublicId`. service: listSessions `id`=public_id·`orgId`=org public_id, `revokeSession(userId, sessionPublicId)` → findByPublicId + 소유 검증.

#### [MODIFY] web (있으면)
- api-key 관리 UI 식별자(있으면). session UI 는 provider web 에서 이미 제거됨.

## 검증 계획

```bash
turbo run lint typecheck test   # fresh 5434 DB
```
1. POST/GET /auth/api-keys → `id` = `^key_…`, `orgId` = `^org_…` — PASS
2. DELETE /auth/api-keys/{public_id} → 204; 타 org 키 public_id → 403 — PASS
3. GET /auth/sessions → `id` = `^ses_…`; DELETE /auth/sessions/{public_id}(내 세션) → 204; 타인 세션 → 403 — PASS
4. 기존 api-key/session e2e 회귀 0

## 롤백 계획

- `git revert` + 컬럼 추가 가역적. RLS/rotation 무변경.

## ADR 후보

- [x] ADR-0028 시행 — 추가 ADR 불요.

## ✅ Definition of Done

- [ ] api_keys/sessions public_id + 백필, 응답 id/orgId → public_id
- [ ] DELETE /:id public_id 수용(IDOR 안전)
- [ ] api-key/session e2e 회귀 0
- [ ] walkthrough/pr_description + push
