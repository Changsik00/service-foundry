# Implementation Plan: spec-19-06 API Key

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-06-api-key`
- 시작 지점: `phase-19-account-authz`

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **키 해시** | SHA-256(plain_key) hex | bcrypt는 요청당 ~100ms → 느림. 32바이트 랜덤 엔트로피로 rainbow table 무의미 |
| **키 형식** | `sk_<64hex>` | 접두사로 API Key 임을 식별, 64hex = 256bit 엔트로피 |
| **Guard 위치** | `apps/api/src/auth/api-key.guard.ts` | DB 직접 의존 → CsrfGuard 패턴 (apps/api 로컬) |
| **엔드포인트 prefix** | `/auth/api-keys` | 기존 `/auth/org/*` 패턴과 일관성 |
| **취소** | soft delete (revokedAt) | 감사 로그 보존 |
| **RLS** | `raw pool.query` (org-switch 패턴) | ALS 트랜잭션 cross-org 차단 우회 |

## 📂 변경 파일

### Task 1 — 마이그레이션 + Drizzle 스키마

#### [NEW] `apps/api/drizzle/0018_api_keys.sql`
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,        -- 평문 앞 8자 (표시용)
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON api_keys
  USING (NULLIF(current_setting('app.current_org', true), '') IS NULL
         OR org_id = NULLIF(current_setting('app.current_org', true), '')::uuid)
  WITH CHECK (true);
```

#### [NEW] `apps/api/src/infra/schema/api-keys.ts`
- Drizzle pgTable 정의
- `ApiKeyRow`, `ApiKeyInsert` 타입 export

#### [MODIFY] `apps/api/src/infra/schema/index.ts`
- `apiKeys` 추가 → `appSchema`

#### [MODIFY] `apps/api/drizzle.config.ts`
- (필요시) schema 경로 확인

### Task 2 — ApiKeyService (TDD)

#### [NEW] `apps/api/src/auth/api-key.service.ts`
```typescript
create(userId, orgId, name): Promise<{ id, plain, preview, name, createdAt }>
list(orgId): Promise<ApiKeyRow[]>
revoke(id, orgId): Promise<void>   // ForbiddenException if not owner
```
- `create`: `randomBytes(32)`, `createHash('sha256')`, INSERT via raw pool
- Guard용 `verifyKey(plainKey): Promise<ApiKeyRow | null>` — SHA-256 → SELECT → UPDATE lastUsedAt

#### [NEW] `apps/api/src/auth/api-key.service.test.ts`
- create: key 반환 형식 검증
- list: orgId 필터
- revoke: 취소 처리 / 타 org 키 취소 시 ForbiddenException
- verifyKey: 유효 / 취소됨 / 없음

### Task 3 — ApiKeyGuard (TDD)

#### [NEW] `apps/api/src/auth/api-key.guard.ts`
```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  // X-API-Key 헤더 → apiKeyService.verifyKey → req.user 세팅
  // req.user = { sub: key.id, role: "user", orgId: key.orgId, orgRole: null }
}
```

#### [NEW] `apps/api/src/auth/api-key.guard.test.ts`
- 헤더 없음 → 401
- 무효 키 → 401
- 취소된 키 → 401
- 유효 키 → 통과 + req.user 세팅

### Task 4 — ApiKeyController (TDD)

#### [NEW] `apps/api/src/auth/api-key.controller.ts`
```typescript
@ApiTags("api-keys")
@Controller("auth/api-keys")
class ApiKeyController {
  @Post()          @UseGuards(AuthGuard, OrgRolesGuard) @OrgRoles("admin","owner")
  @Get()           @UseGuards(AuthGuard)
  @Delete(":id")   @UseGuards(AuthGuard, OrgRolesGuard) @OrgRoles("admin","owner")
}
```

#### [NEW] `apps/api/src/auth/api-key.controller.test.ts`

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
- `ApiKeyService`, `ApiKeyGuard` providers 추가
- `ApiKeyController` controllers 추가

### Task 5 — e2e

#### [NEW] `apps/api/src/auth/api-key.e2e.test.ts`
- 시나리오: owner → create → list → `X-API-Key` 로 `/auth/me` 접근(ApiKeyGuard 테스트용 엔드포인트 추가) → revoke → 재시도 → 401

> ApiKeyGuard 를 `/auth/me`에 적용하거나 테스트 전용 엔드포인트를 추가한다.
> 가장 간단한 방법: `/auth/api-key-verify` GET 엔드포인트 (ApiKeyGuard만 적용, `{ orgId }` 반환)

## 🧪 검증

```bash
pnpm turbo test --filter=@apps/api
pnpm turbo typecheck --filter=@apps/api
```

## 📦 Deliverables

- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md
