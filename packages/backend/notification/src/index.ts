/**
 * @repo/backend-notification — 이메일/알림 전송 포트 (core, framework-agnostic).
 *
 * 어댑터 교체식: dev(로그/sink) / noop(비-dev 기본) / resend(prod).
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

export interface ResendClient {
  emails: {
    send(payload: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }): Promise<{ data: unknown; error: unknown }>;
  };
}

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

/** Resend 어댑터 — client 를 파라미터로 받아 단위 테스트에서 mock 주입 가능. */
export function createResendNotifier(client: ResendClient, from: string): Notifier {
  return {
    async sendEmail(message: EmailMessage): Promise<void> {
      const { error } = await client.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        html: message.body,
      });
      if (error) throw new Error(`Resend send failed: ${JSON.stringify(error)}`);
    },
  };
}

/** 비밀번호 재설정 이메일 — 링크에 token 포함. */
export function buildPasswordResetEmail(token: string, frontendUrl: string): EmailMessage {
  const link = `${frontendUrl}/auth/password/reset?token=${token}`;
  return {
    to: "",
    subject: "비밀번호 재설정",
    body: `<p>비밀번호를 재설정하려면 아래 링크를 클릭하세요 (10분 유효):</p><p><a href="${link}">${link}</a></p>`,
  };
}

/** 이메일 인증 메일 — 링크에 token 포함. */
export function buildEmailVerifyEmail(token: string, frontendUrl: string): EmailMessage {
  const link = `${frontendUrl}/auth/email-verify?token=${token}`;
  return {
    to: "",
    subject: "이메일 주소 인증",
    body: `<p>이메일 주소를 인증하려면 아래 링크를 클릭하세요:</p><p><a href="${link}">${link}</a></p>`,
  };
}

/** 이메일 변경 확인 메일 — 새 이메일 주소로 발송. */
export function buildEmailChangeEmail(token: string, frontendUrl: string): EmailMessage {
  const link = `${frontendUrl}/auth/email-change/confirm?token=${token}`;
  return {
    to: "",
    subject: "이메일 주소 변경 확인",
    body: `<p>이메일 주소 변경을 확인하려면 아래 링크를 클릭하세요 (24시간 유효):</p><p><a href="${link}">${link}</a></p>`,
  };
}

/** 초대 이메일 — orgName, token, frontendUrl 포함. */
export function buildInvitationEmail(
  orgName: string,
  token: string,
  frontendUrl: string,
): EmailMessage {
  const link = `${frontendUrl}/invite/accept?token=${token}`;
  return {
    to: "",
    subject: `${orgName} 에 초대되었습니다`,
    body: `<p><strong>${orgName}</strong> 워크스페이스에 초대되었습니다. 아래 링크를 클릭하여 참여하세요:</p><p><a href="${link}">${link}</a></p>`,
  };
}
