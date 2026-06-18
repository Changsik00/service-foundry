# spec-19-06: API Key 발급·목록·취소 + ApiKeyGuard

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-06` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-06-api-key` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-13 |

## 📋 배경 및 문제 정의

### 현재 상황

JWT Bearer 인증만 지원한다. 외부 서비스나 CLI가 org API에 접근하려면 매번 로그인해서 토큰을 받아야 한다.

### 문제점

장기 실행 서비스나 CI 파이프라인이 JWT 갱신 로직을 직접 구현해야 한다. 만료·갱신 없이 org를 식별할 수 있는 정적 자격증명이 없다.

### 해결 방안

`api_keys` 테이블 + CRUD 엔드포인트 + `ApiKeyGuard`를 추가한다. 평문 키는 발급 시 1회만 반환하고 DB에는 SHA-256 해시만 저장한다.

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/api-keys` — admin+ 권한으로 org API Key 발급, 평문 1회 반환
2. `GET /auth/api-keys` — 현재 org의 Key 목록 (평문 미포함, preview·name·createdAt·lastUsedAt·revokedAt)
3. `DELETE /auth/api-keys/:id` — admin+ 권한으로 Key 취소 (soft delete: revokedAt 세팅)
4. `ApiKeyGuard` — `X-API-Key: sk_<64hex>` 검증 → `req.user` 세팅 → `lastUsedAt` 갱신

### Non-Functional Requirements

1. 키 검증: SHA-256 (요청당 fast lookup, 충분한 엔트로피 32바이트로 보장)
2. RLS: `api_keys.org_id = app.current_org` — 기존 테넌트 격리 패턴 적용

## 🚫 Out of Scope

- 키 권한 스코프 (read-only 등)
- 키 만료 (expiresAt)
- org당 최대 개수 제한
- 키 rotate (revoke + 재발급으로 대체)

## 🔗 관련 문서

- 관련 spec: spec-19-05 (OrgRolesGuard — admin+ 인가)

## ✅ Definition of Done

- [ ] 마이그레이션 + Drizzle 스키마
- [ ] POST / GET / DELETE 엔드포인트 동작
- [ ] ApiKeyGuard — 유효 키 통과 / 무효·취소 키 401
- [ ] 단위 테스트 (service + guard) + e2e (create → use → revoke)
- [ ] CI 통과
- [ ] `walkthrough.md` · `pr_description.md` 작성
