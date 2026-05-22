# Implementation Plan: spec-06-05

## 📋 Branch Strategy

- 신규 브랜치: `spec-06-05-e2e-login-vertical-slice`
- 시작 지점: `phase-06-auth-integration` (Phase base branch mode)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 구현은 이미 완료 (spec-06-03). 본 spec은 통합 테스트만 추가.
> - [x] 실 PostgreSQL(port 5434)이 로컬에서 실행 중이어야 테스트 통과.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
Client (supertest agent)
    │
    ▼ POST /auth/signup  → 201 + Set-Cookie: refresh_token
    │ POST /auth/signin  → 200 + accessToken + Set-Cookie refresh
    │ GET  /auth/me      → 200  (Authorization: Bearer <accessToken>)
    │ POST /auth/signout → 200  (Cookie: refresh_token → cleared)
    │ GET  /auth/me      → 401  (no valid token)
    │ POST /auth/refresh → 200  (Cookie: refresh_token → new accessToken)
    ▼ GET  /auth/me      → 200  (new accessToken)

apps/api (NestJS + real PG @ 5434)
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **파일** | 기존 `auth.e2e.test.ts` 확장 | 동일 NestJS app 인스턴스 공유로 시작 비용 0 |
| **쿠키 관리** | `supertest.agent(server)` | agent가 Set-Cookie를 자동 추적 |
| **격리** | 유니크 email(`${Date.now()}@example.com`) | 테스트 간 사용자 충돌 방지 |
| **accessToken 전달** | `Authorization: Bearer` 헤더 | /me가 Bearer token 방식 검증 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [MODIFY] `apps/api/src/auth/auth.e2e.test.ts`

기존 파일 하단에 `"로그인 수직 슬라이스"` describe 블록 추가:

```ts
describe("로그인 수직 슬라이스", () => {
  const agent = request.agent(app.getHttpServer());
  const email = `slice-${Date.now()}@example.com`;
  const password = "SliceTest123!";
  let accessToken: string;

  it("POST /auth/signup → 201 + cookie", async () => { ... });
  it("GET /auth/me (accessToken) → 200", async () => { ... });
  it("POST /auth/signout → 200 + cookie cleared", async () => { ... });
  it("GET /auth/me (signout 후) → 401", async () => { ... });
  it("POST /auth/refresh (cookie) → 200 + new accessToken", async () => { ... });
  it("GET /auth/me (refresh 후) → 200", async () => { ... });
});
```

## 🧪 검증 계획

### 통합 테스트 (Integration Test Required = yes)

```bash
# 실 DB가 port 5434에서 실행 중이어야 함
pnpm --filter @apps/api test
```

## 🔁 Rollback Plan

- 테스트 파일만 변경이므로 `git revert` 로 즉시 롤백 가능
- 프로덕션 코드 변경 없음

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
