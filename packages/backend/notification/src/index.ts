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

const defaultDevSink: EmailSink = (m) =>
  console.info(`[notification:dev] to=${m.to} subject=${m.subject}\n${m.body}`);

/** dev 어댑터 — 메일을 sink(기본 console.info)로 출력. 로컬 가시성용. */
export function createDevNotifier(sink: EmailSink = defaultDevSink): Notifier {
  return {
    sendEmail(message: EmailMessage): Promise<void> {
      sink(message);
      return Promise.resolve();
    },
  };
}

/** noop 어댑터 — 아무 것도 하지 않음 (비-dev 기본, prod provider 미배선 시 토큰 미로깅 보장). */
export function createNoopNotifier(): Notifier {
  return {
    sendEmail(_message: EmailMessage): Promise<void> {
      return Promise.resolve();
    },
  };
}
