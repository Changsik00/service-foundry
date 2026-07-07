# Walkthrough: spec-23-01-test-safety-net

> phase-23 첫 spec — 23-02(핫패스) 변경의 회귀 안전망. 테스트 전용(production 변경 0).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| G 범위 | 11개 전부 / 핫패스 타깃+보안 | **4개 정조준** | api-key·org-list·signin·passkey는 이미 단위테스트 보유. 23-02가 바꿀 account.stores·jwt.service + 보안 mfa·oauth만 |
| 테스트 성격 | TDD Red / characterization | **characterization** | 동작 변경이 아니라 현재 동작 고정 → 23-02 가드 |
| account.stores mock | thenable / Promise+limit | Promise+`.limit()` | biome `noThenProperty` 차단 → `Object.assign(Promise, {limit})` |
| mfa env-free 결정성 | 실 otplib / 패키지 mock | `@repo/backend-auth-mfa` mock | verifyTotp 등 결정적 제어, orchestration 분기 검증 |
| oauth env 주입 | process.env 직접 / `vi.stubEnv` | **vi.stubEnv** | useLiteralKeys lint 회피 + 자동 복원 |

## 💬 사용자 협의
- **주제**: "리팩토링 가자" + phase 범위/branch 모드
  - **합의**: phase-23 = G·A·B·C·D·F (E는 phase-24 분리), non-base, 의존순(G先). spec-23-01 Plan Accept 승인.

## 🧪 검증 결과
- 신규 4 테스트 17 케이스 그린: account.stores(4)·jwt.service(3)·mfa.service(7)·oauth.service(3).
- `apps/api` typecheck 그린. 변경 7파일 biome clean.
- **production 코드 diff 0** — `git diff main...HEAD -- ':!*.test.ts' ':!specs' ':!backlog'` 비어있음(테스트 전용 확인).

### 훅 이슈
- mfa.service.test 의 fixture `secret: "SECRET32"`(가짜)를 check-secrets 가 오탐 → `HARNESS_HOOK_MODE_SECRETS=warn` 1회 우회(실 시크릿 아님 확인). 기존 알려진 오탐(RCA-002 계열).

## 🔍 발견 사항
- `isSoleOwnerOfAnyOrg` 는 org당 otherOwners+otherMembers 2쿼리(N+1) + 다른 owner 있어도 otherMembers 쿼리 — 23-02 A1 에서 단일 집계+early-exit 로 최적화 예정. 본 테스트는 boolean 결과만 단언해 최적화 후에도 그린 유지.
- `getJwks` 매 호출 `toJwks` 재계산 — 23-02 A3 메모이즈 대상. "반복 호출 동일 kid" 테스트가 가드.

## 🚧 이월 항목
- 나머지 G(컨트롤러 테스트)는 e2e 커버 + 핫패스 비대상이라 후순위 — 필요 시 후속.
- 다음: spec-23-02 (핫패스 A) — 본 안전망 위에서 진행.
