/**
 * @repo/backend-notification — 이메일/알림 전송 포트 (core, framework-agnostic).
 *
 * 어댑터 교체식: dev(로그/sink) / noop(비-dev 기본). prod provider(Resend/SES)는 후속.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface Notifier {
  sendEmail(message: EmailMessage): Promise<void>;
}

export type EmailSink = (message: EmailMessage) => void;

// TDD 스텁 — 구현은 Green 단계.
export function createDevNotifier(_sink?: EmailSink): Notifier {
  throw new Error("not implemented");
}

export function createNoopNotifier(): Notifier {
  throw new Error("not implemented");
}
