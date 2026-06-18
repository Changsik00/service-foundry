# spec-19-04: OpenAPI/Swagger

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-04` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-04-openapi-swagger` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-12 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

`apps/api`에 컨트롤러가 10개 이상 존재하지만 API surface를 자동으로 문서화하는 수단이 없다. 프론트엔드 연동 시 직접 소스 코드를 읽거나 별도 문서를 작성해야 한다.

### 문제점

- 신규 엔드포인트 추가 시 계약 변경을 외부에 공식 노출할 방법이 없음
- Postman/Insomnia 등에서 직접 테스트하기 어려움

### 해결 방안 (요약)

`@nestjs/swagger` 설치 + `GET /api-docs`에 SwaggerUI 노출. `SWAGGER_ENABLED` env로 production 게이팅. 핵심 컨트롤러(Auth, Account, Health)에 최소한의 데코레이터 추가.

## 🎯 요구사항

### Functional Requirements

1. `GET /api-docs` — SwaggerUI 제공 (`SWAGGER_ENABLED=true` 일 때)
2. `GET /api-docs-json` — OpenAPI JSON 반환
3. 핵심 컨트롤러 데코레이터:
   - `AuthController`, `AccountController`, `HealthController`에 `@ApiTags`, `@ApiOperation`, `@ApiResponse` 추가
   - JWT 보호 엔드포인트: `@ApiBearerAuth`
   - CSRF 보호 엔드포인트: `@ApiHeader({ name: 'X-Csrf-Token' })`
4. `SWAGGER_ENABLED` 미설정(또는 `false`) 시 `/api-docs` 라우트 미등록

### Non-Functional Requirements

1. 기존 테스트·typecheck 전부 PASS — 데코레이터가 런타임 동작 변경 없음
2. production build 포함 가능 (dep에 추가, devDep 불가)

## 🚫 Out of Scope

- 전체 컨트롤러 완전 문서화 (MFA, Passkey, OAuth 등 — 추후 spec-FF)
- Request body DTO 스키마 자동 생성 (class-validator 기반 DTO 미사용)
- API Key 인증 스키마 (spec-19-06 이후)

## 📑 ADR 후보

- [ ] 없음

## 🔗 관련 문서

- 관련 phase: [[phase-19]] — spec-19-04

## ✅ Definition of Done

- [ ] `GET /api-docs` 접속 시 SwaggerUI 정상 렌더링 (SWAGGER_ENABLED=true)
- [ ] `SWAGGER_ENABLED` 미설정 시 라우트 미등록
- [ ] typecheck PASS + 전체 테스트 PASS
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-19-04-openapi-swagger` 브랜치 push + PR 생성
