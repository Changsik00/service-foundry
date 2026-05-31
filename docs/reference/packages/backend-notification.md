---
type: reference
aliases: ["@repo/backend-notification", "알림 이메일 포트"]
tags: [service-foundry, reference, backend, notification]
---

# @repo/backend-notification — 이메일/알림 전송 포트 + dev/noop 어댑터

> 💡 **한 줄 요약**: `Notifier` 포트 인터페이스와 개발용 로그 어댑터, noop 어댑터를 제공하는 framework-agnostic 알림 추상화 패키지.
> **위치**: `packages/backend/notification` · **상위**: [[architecture]]

## 책임 (Responsibility)

이메일 전송 인터페이스(`Notifier`)를 정의하여 provider(Resend/SES 등) 교체를 용이하게 한다. `createDevNotifier`는 로컬 개발에서 콘솔로 메일 내용을 출력하고, `createNoopNotifier`는 비-dev 환경의 기본값으로 프로덕션 provider 미배선 시 토큰이 로그에 노출되는 것을 방지한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `Notifier` | type | 이메일 전송 포트 인터페이스 |
| `EmailMessage` | type | 전송 메시지 타입 (to, subject, body) |
| `EmailSink` | type | dev 어댑터 출력 콜백 타입 |
| `createDevNotifier` | fn | 콘솔 출력 dev 어댑터 팩토리 |
| `createNoopNotifier` | fn | 아무 것도 하지 않는 noop 어댑터 팩토리 |

## 의존

- 내부: 없음
- 외부: 없음

## 사용 예

```ts
import { createDevNotifier, createNoopNotifier } from "@repo/backend-notification";

const notifier = process.env.NODE_ENV === "development"
  ? createDevNotifier()
  : createNoopNotifier();

await notifier.sendEmail({
  to: "user@example.com",
  subject: "이메일 인증",
  body: "인증 코드: 123456",
});
```

## 연결된 개념

- [[explainers/backend/notification-port-adapter]] — 포트-어댑터 패턴 및 provider 교체 전략
- [[backend-queue]] — 비동기 알림 전송 큐와의 조합
- [[backend-outbox]] — 트랜잭션 아웃박스로 알림 발행 보장

> 소스: spec-12-01 · `packages/backend/notification/src/`
