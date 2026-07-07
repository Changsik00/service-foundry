# Walkthrough: spec-23-03-constants-and-dedup

> phase-23 §11.3 재구성 후 저위험 cleanup — 상수 중앙화 + 페이지네이션 Params 타입 dedup.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 23-03 범위 | B+C4+D / C4+D5 | **C4+D5** | B1 throw 대부분 의도적 부트스트랩 fail-fast, B2 미테스트 컨트롤러 위험 → B는 23-04 |
| D5 Result 통일 | `{items}` 통일 / Result 키 유지 | **키 유지** | members/orgs/users → items 로 바꾸면 **API 응답 키 변경(breaking)**. Params 만 통일(내부, 안전) |
| EMAIL_TOKEN_TTL_MS 위치 | 서비스별 / 공유 모듈 | `apps/api/src/auth/token-ttl.constants.ts` | 이메일계열 토큰 3종 공통 24h |

## 💬 사용자 협의
- "리팩토링 가자" → 23-03 진행. §11.3 재검증으로 B를 23-04 로 미루고 저위험 C4+D5 우선(사용자 Plan Accept).

## 🧪 검증 결과
- `@repo/contracts` + `apps/api` typecheck 그린.
- contracts 단위 테스트 14 + org-invite 11 그린.
- 변경 파일 biome clean(자동 포맷 후).
- `grep '24 * 60 * 60 * 1000' apps/api/src` → 상수 정의 외 0 (인라인 제거 확인).
- **동작 보존**: 상수 값(24h·20·100) 불변, 타입은 Params 만 alias(필드 동일), Result 키 유지.

## 🔍 발견 사항
- 24h 이메일 토큰 TTL 이 email-change·email-verify(`TOKEN_TTL_MS`) + org-invite(인라인) 3곳 독립 정의 → drift 위험. 단일 상수화.
- 커서 페이지네이션 Params(`{search?,cursor?,limit?}`)가 org-members·admin(org/user) 4곳 반복 → `CursorPaginationParams` 로 통일. Result 는 도메인 키(members/orgs/users) 보존.

## 🚧 이월 항목
- **B(에러/검증 컨벤션)** → spec-23-04: throw→AppError 전환 대상(oauth Unknown provider 등) + zod parse 통일. 단, passkey/mfa 컨트롤러 안전망 선행 필요.
- D2(verifier dedup)·D3/D4/D6(adapter/forRoot/guard 팩토리) → 별도 dedup spec.
- Result 타입 통일(`{items}`) → API 버저닝 시 재검토.
- 다음: spec-23-04 (B).
