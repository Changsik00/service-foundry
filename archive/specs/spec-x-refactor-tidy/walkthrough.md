# Walkthrough: spec-x-refactor-tidy

> 7차원 리팩토링 감사(queue.md Icebox)의 첫 퀵윈 — behavior-preserving 매직 리터럴/중복 정리. Serena LSP로 참조 추적·진단.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| C3 권한 체크 | (A) 상수 배열 (B) 기존 `canInviteMember` | B | authz 패키지에 이미 동일 로직 존재 → 중복 제거 겸 |
| C2 TTL | (A) 양쪽 상수 (B) 단일 export/import | B | 30일을 한 곳(`SESSION_TTL_MS`)에서 — 단위 drift 차단 |
| worker LOG_LEVEL env | (A) env 주입 (B) `"info"` 고정 | B | `string`이 `LogLevel`과 불일치(Serena LSP가 포착) — demo worker엔 고정으로 충분 |
| 검증 도구 | grep vs Serena | **Serena 우선** | 사용자 지적 + agent.md §6.5. 참조추적·타입진단은 LSP가 권위 (worker 타입오류를 grep은 못 잡았을 것) |

## 💬 사용자 협의

- **주제**: "grep 말고 Serena 써야 하지 않나?"
  - **합의**: 참조 추적·타입 진단은 Serena LSP(`find_referencing_symbols`/`get_diagnostics_for_file`)로, 단순 텍스트 존재 확인만 grep. 전환 후 worker `LogLevel` 타입오류를 Serena가 즉시 포착(grep 불가).
- **주제**: Plan Accept 게이트
  - **합의**: turbo 모드여도 plan-accept 훅이 production 코드 커밋을 차단 → 사용자가 `/hk-plan-accept` 승인 후 재개.

## 🧪 검증 결과

### 변경분 (회귀 0)
- 변경 7개 파일 `biome check` clean.
- 영향 패키지 typecheck green: `@apps/api`, `@apps/worker`, `@repo/backend-auth-session`, `@repo/backend-http-client`.
- 단위 테스트 green: signup(claim 키 가드 +1 = 5), org-invite(admin 케이스 +1 = 11), auth-session/cookie(13), http-client(14).
- Serena LSP 진단: 변경 파일 전부 0 error.

### ⚠️ 기존(pre-existing) 게이트 잡음 — 본 spec 범위 밖
- **api e2e 500 다수**: `main` 체크아웃에서도 `POST /auth/signup → 500` 동일 재현 → 로컬 e2e DB 미마이그레이션(CI compose 스택 전용). 내 변경과 무관.
- **`turbo run lint` 실패**: `oauth.service`·`admin.*`·`api-key.*` 등 **미접촉 파일**의 기존 biome hint(useLiteralKeys/useTemplate 등). 내 변경 파일은 clean.

## 🔍 발견 사항
- `canInviteMember`는 authz 패키지에 있었으나 apps/api 어디서도 안 쓰이고 invite는 배열을 하드코딩 — 패키지 함수 미활용 사례.
- worker `console.info`를 logger로 바꿀 때 `process.env.LOG_LEVEL`(string)이 `LogLevel`과 타입 불일치 — LSP가 즉시 포착(grep 검증이었으면 런타임까지 통과했을 위험).

## 🚧 이월 항목
- 나머지 리팩토링(A 핫패스·B1/B2·C4·D2~D6·E 이관·F 분할·G 테스트부채·H 데드코드) → queue.md Icebox 적재됨, Phase 승격 후보.
- 기존 lint hint(미접촉 파일)·로컬 e2e DB 셋업은 별도 정리 대상.
