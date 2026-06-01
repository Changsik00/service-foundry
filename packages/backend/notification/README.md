# @repo/backend-notification

> `Notifier` 포트 인터페이스와 개발용 콘솔 출력 어댑터, noop 어댑터를 제공하는 framework-agnostic 알림 추상화 패키지.

## 설치 / import
```ts
import { createDevNotifier, createNoopNotifier } from "@repo/backend-notification";
```

## 핵심 API
- `createDevNotifier()` — 로컬 개발에서 메일 내용을 콘솔에 출력하는 어댑터 팩토리
- `createNoopNotifier()` — 프로덕션 provider 미배선 시 기본값용 noop 어댑터 팩토리
- `Notifier` — `sendEmail(message: EmailMessage) => Promise<void>` 포트 인터페이스

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-notification.md`](../../../docs/reference/packages/backend-notification.md)
- 동작 원리: [`docs/explainers/backend/notification-port-adapter.md`](../../../docs/explainers/backend/notification-port-adapter.md)
