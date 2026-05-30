import { createDevNotifier, createNoopNotifier, type Notifier } from "@repo/backend-notification";

/** @Inject 토큰 — auth 서비스가 reset/verify 메일 전송에 사용. */
export const NOTIFIER = Symbol("NOTIFIER");

export const notifierProvider = {
  provide: NOTIFIER,
  // dev: 메일을 로그(가시성). 비-dev: noop (실제 provider 미배선 시 토큰 미로깅).
  // prod 전송은 Resend/SES 어댑터로 교체 (후속).
  useFactory: (): Notifier =>
    process.env.NODE_ENV === "development" ? createDevNotifier() : createNoopNotifier(),
};
