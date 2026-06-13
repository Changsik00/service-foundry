# spec-19-06: 조직 API Key 발급·사용·취소

## 변경 내용

조직 관리자(owner/admin)가 API Key를 발급하고, 서비스 계정이 `X-API-Key` 헤더로 JWT 없이 인증하는 기능을 구현했습니다.

- `api_keys` 테이블 (SHA-256 해시, key_preview, soft delete via revokedAt, RLS 적용)
- `ApiKeyService` — create / list / revoke / verifyKey (모두 raw pool)
- `ApiKeyGuard` — `X-API-Key` 헤더 → verifyKey → req.user 세팅
- `ApiKeyController` — POST/GET/DELETE `/auth/api-keys` + GET `/auth/api-keys/verify`
- `AuthModule` — ApiKeyService, ApiKeyGuard, ApiKeyController 등록

## 테스트

- 단위 14개 (Service 7, Guard 3, Controller 4)
- e2e 6개 (owner 생성→목록→X-API-Key 사용→취소→401, member 403)

## 주요 결정

- **SHA-256 저장**: 평문은 생성 시 1회만 반환, DB 미보관
- **raw pool 전용**: RLS 컨텍스트 없이 org_id 필터는 쿼리 WHERE 절로 처리
- **biome-ignore**: `emitDecoratorMetadata` DI를 위해 `ApiKeyService` 값 임포트 보호
