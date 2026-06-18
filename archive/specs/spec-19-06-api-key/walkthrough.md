# Walkthrough: spec-19-06 API Key

## 구현 요약

조직 수준 API Key 발급·사용·취소 기능을 구현했습니다. JWT 없이 `X-API-Key` 헤더만으로 서버 간 인증이 가능합니다.

---

## 핵심 결정 사항

### 1. SHA-256 해시 저장, 평문 미저장
키 생성 시 `sk_<64hex>` 형태의 평문을 반환하고, DB에는 SHA-256 해시만 저장합니다. 유출 시 원본 키를 복원할 수 없습니다.

### 2. 모든 DB 쿼리 raw pool 사용
`ApiKeyService`와 `ApiKeyGuard`의 DB 쿼리는 모두 `database.pool.query()`를 사용합니다. ALS 트랜잭션 컨텍스트 없이 실행되므로 RLS 정책에 의해 org_id가 필터링됩니다.

### 3. biome-ignore로 DI 임포트 보호
`emitDecoratorMetadata`가 활성화된 NestJS 환경에서는 `@Injectable()` 클래스의 의존성을 `import type`이 아닌 값 임포트로 가져와야 합니다. Biome가 자동으로 `import type`으로 변환하는 것을 막기 위해 `biome-ignore lint/style/useImportType` 주석을 사용합니다.

### 4. soft delete (revokedAt)
키 취소는 레코드 삭제가 아니라 `revoked_at = now()` 업데이트입니다. 취소된 키는 목록 조회(`WHERE revoked_at IS NULL`)와 검증에서 자동으로 제외됩니다.

---

## 파일 변경 목록

| 파일 | 변경 |
|---|---|
| `drizzle/0018_api_keys.sql` | api_keys 테이블 + RLS 정책 + GRANT |
| `src/infra/schema/api-keys.ts` | Drizzle pgTable + 타입 export |
| `src/infra/schema/index.ts` | apiKeys appSchema 추가 |
| `src/auth/api-key.service.ts` | ApiKeyService (create/list/revoke/verifyKey) |
| `src/auth/api-key.guard.ts` | ApiKeyGuard (X-API-Key 헤더 검증) |
| `src/auth/api-key.controller.ts` | ApiKeyController (4개 엔드포인트) |
| `src/auth/auth.module.ts` | ApiKeyService, ApiKeyGuard, ApiKeyController 등록 |

---

## 엔드포인트

| 메서드 | 경로 | 가드 | 설명 |
|---|---|---|---|
| POST | `/auth/api-keys` | AuthGuard + OrgRolesGuard (admin/owner) | 키 생성 |
| GET | `/auth/api-keys` | AuthGuard | 키 목록 |
| DELETE | `/auth/api-keys/:id` | AuthGuard + OrgRolesGuard (admin/owner) | 키 취소 |
| GET | `/auth/api-keys/verify` | ApiKeyGuard | X-API-Key 검증 (e2e용) |

---

## 테스트 커버리지

- `api-key.service.test.ts` — 7 tests (create/list/revoke/verifyKey)
- `api-key.guard.test.ts` — 3 tests (헤더 없음/무효/유효)
- `api-key.controller.test.ts` — 4 tests (각 메서드)
- `api-key.e2e.test.ts` — 6 tests (생성·사용·취소 흐름 + member 403)
