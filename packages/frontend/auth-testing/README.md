# @repo/frontend-auth-testing

> 테스트 환경용 `MockAuthSDK` — 상태와 호출 내역을 추적하며 `AuthSDK` 전체 계약을 구현.

## 설치 / import
```ts
import { createMockAuthSDK } from "@repo/frontend-auth-testing";
```

## 핵심 API
- `createMockAuthSDK(initial?)` — `MockAuthSDK` 인스턴스 생성
- `MockAuthSDK` — `AuthSDK & MockControls` 타입
- `MockControls._state` — 응답 프로그래밍용 상태 객체
- `MockControls._calls` — 호출 횟수·인수 검증용 레코드
- `MockControls._reset()` — 테스트 간 상태 초기화
- `DEFAULT_STATE` — 기본 초기 상태 (`success: false, reason: "invalid_credentials"`)

## 자세히
- 레퍼런스: [`docs/reference/packages/frontend-auth-testing.md`](../../../docs/reference/packages/frontend-auth-testing.md)
- 동작 원리: [`docs/explainers/frontend/auth-sdk-provider-adapters.md`](../../../docs/explainers/frontend/auth-sdk-provider-adapters.md)
