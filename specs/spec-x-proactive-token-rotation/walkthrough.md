# Walkthrough: spec-x-proactive-token-rotation

> 액세스 토큰 만료 전 자동 갱신 (프론트엔드).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 만료 인지 | 서버 응답에 expiresAt 추가 / accessToken JWT exp 디코드 | **JWT exp 디코드** | accessToken 이 이미 응답 body 에 있음 → 백엔드/contract 무변경 (의도 동일, 변경 최소) |
| SDK 노출 | 필수 메서드 / optional | **optional `getAccessTokenExpiresAt?`** | provider 모드(firebase/supabase 자체 갱신)는 미구현 → 타이머 비활성, 회귀 0 |
| 탭 재포커스 | 별도 effect / 기존 타이머에 통합 | **통합 + visibilitychange 재스케줄** | 재포커스 시 schedule() 재평가 → 만료 경과면 delay 0 으로 즉시 refresh (로직 단일화) |

## 💬 사용자 협의
- **주제**: 다음 작업 추천 → Proactive Token Rotation 선택.
- **스코프 정정**: 초기엔 "httpOnly 라 backend 필요"로 오판 → accessToken 이 응답 body 에 있음을 확인하고 **프론트엔드-only** 로 축소(사용자 보고 후 진행).

## 🧪 검증 결과
- `turbo run lint typecheck`: ✅ 96/96
- 영향 패키지 test: ✅ auth-contracts / frontend-auth-react / apps/web
- 단위: decodeJwtExp(5) / auth-sdk expiry 추적(3) / AuthProvider 타이머·재스케줄·provider-모드-비활성·탭재포커스(4, fake timers)

## 🔍 발견 사항
- `auth-sdk.ts` 가 응답의 accessToken 을 버리고 user 만 쓰고 있었음 → exp 추적 위해 캡처.
- `noUncheckedIndexedAccess` 로 `parts[1]` 가드 필요(typecheck).
- 테스트 픽스처 `password:` 가 check-secrets 오탐(RCA-002) → `HARNESS_HOOK_MODE_SECRETS=warn` 우회.

## 🚧 이월 항목
- 선제 갱신을 native-jwt(Bearer) 어댑터에도 확장 (현재 apps/web cookie SDK 기준). 필요 시 후속.
