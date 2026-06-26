feat(spec-26-06): api-keys & sessions public_id (final roots)

## 📋 Summary

### 배경 및 목적
26-01 감사 확정 root 의 **마지막 둘**(api-keys·sessions)에 public_id 도입. 이로써 users·org·sessions·api-keys 4개 root 가 모두 닫힌다(26-07 누출 스냅샷이 전수 검증).

### 주요 변경 사항
- [x] `api_keys.public_id`(`key_`)·`sessions.public_id`(`ses_`) + 백필 마이그레이션(VOLATILE default)
- [x] 응답 `id` → 자신의 public_id, `orgId` → org public_id 상속
- [x] `DELETE /auth/api-keys/:id`·`DELETE /auth/sessions/:id` 가 **public_id 수용** — api-key=`public_id AND org_id` 매칭, session=public_id→소유 userId 검증(IDOR 안전)
- [x] **verifyKey 는 내부 {id,orgId} 반환** — ApiKeyGuard 가 RLS 컨텍스트 설정에 사용하므로 내부 uuid 유지

### 타입
- **Feature (schema/API 계약/노출 전환)** · spec-26-06 → `phase-26-id-scheme-public-id`

## 🎯 Key Review Points
1. **verifyKey 내부 id 분리**: guard→`req.user.orgId`→RLS `app.current_org` 라 verifyKey().orgId 는 반드시 내부. list/create 응답만 public_id. (격리 회귀 방지)
2. **DELETE IDOR 안전**: api-key 는 org 스코프 매칭, session 은 소유 userId 검증.
3. **내부 불변**: session rotation(refreshTokenHash/family)·api_keys org FK·verifyKey 시크릿 조회 = 내부 id 그대로.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB
```
- api-key/session e2e(노출·DELETE·격리·RLS backstop) + 단위 PASS.
- 전체 **154/154 tasks**, 회귀 0.

## 📦 Files Changed
- `packages/backend/schema/src/api-keys.ts`, `packages/backend/auth-session/src/{schema,store,drizzle-store}.ts`
- `apps/api/drizzle/0023_*`, `apps/api/src/auth/{api-key.service,session-management.service,session.stores}.ts`
- 관련 단위/e2e + SessionRow 픽스처/mock 갱신

## ✅ Definition of Done
- [x] api_keys/sessions public_id + 백필, 응답 id/orgId → public_id
- [x] DELETE /:id public_id 수용(IDOR 안전), verifyKey 내부 유지
- [x] e2e 회귀 0 + walkthrough/pr_description

## 🔗 관련
- ADR-0028, spec-26-01~05, 후속 **26-07(누출 스냅샷 — 마지막 spec)**
