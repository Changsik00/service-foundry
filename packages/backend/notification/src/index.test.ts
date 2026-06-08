import { describe, expect, it, vi } from "vitest";
import {
  buildEmailVerifyEmail,
  buildInvitationEmail,
  buildPasswordResetEmail,
  createDevNotifier,
  createNoopNotifier,
  createResendNotifier,
  type EmailMessage,
} from "./index.js";

const msg: EmailMessage = {
  to: "alice@example.com",
  subject: "reset",
  body: "link: https://app/reset?token=abc",
};

describe("createDevNotifier", () => {
  it("sink 에 메시지를 전달한다", async () => {
    const sink = vi.fn();
    await createDevNotifier(sink).sendEmail(msg);
    expect(sink).toHaveBeenCalledOnce();
    expect(sink).toHaveBeenCalledWith(msg);
  });

  it("sink 미지정이어도 throw 하지 않는다", async () => {
    await expect(createDevNotifier().sendEmail(msg)).resolves.toBeUndefined();
  });
});

describe("createNoopNotifier", () => {
  it("아무 것도 하지 않고 resolve (sink 미호출)", async () => {
    const sink = vi.fn();
    await createNoopNotifier().sendEmail(msg);
    expect(sink).not.toHaveBeenCalled();
  });
});

describe("createResendNotifier (spec-17-01)", () => {
  const makeMockClient = (override?: object) => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null, ...override }),
    },
  });

  it("sendEmail 호출 시 client.emails.send 가 올바른 payload 로 호출된다", async () => {
    const client = makeMockClient();
    const notifier = createResendNotifier(client, "noreply@example.com");
    await notifier.sendEmail({ to: "bob@example.com", subject: "안녕", body: "<p>내용</p>" });
    expect(client.emails.send).toHaveBeenCalledOnce();
    expect(client.emails.send).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "bob@example.com",
      subject: "안녕",
      html: "<p>내용</p>",
    });
  });

  it("client.emails.send 가 error 반환 시 throw 한다", async () => {
    const client = {
      emails: {
        send: vi.fn().mockResolvedValue({ data: null, error: { message: "invalid key" } }),
      },
    };
    const notifier = createResendNotifier(client, "noreply@example.com");
    await expect(notifier.sendEmail(msg)).rejects.toThrow(/Resend send failed/);
  });
});

describe("buildPasswordResetEmail (spec-17-01)", () => {
  it("링크에 token 과 frontendUrl base 가 포함된다", () => {
    const result = buildPasswordResetEmail("tok-123", "https://app.example.com");
    expect(result.body).toContain("tok-123");
    expect(result.body).toContain("https://app.example.com");
  });

  it("subject 가 비어 있지 않다", () => {
    const result = buildPasswordResetEmail("tok-123", "https://app.example.com");
    expect(result.subject.length).toBeGreaterThan(0);
  });
});

describe("buildEmailVerifyEmail (spec-17-01)", () => {
  it("링크에 token 이 포함된다", () => {
    const result = buildEmailVerifyEmail("vtok-456", "https://app.example.com");
    expect(result.body).toContain("vtok-456");
    expect(result.body).toContain("https://app.example.com");
  });
});

describe("buildInvitationEmail (spec-17-01)", () => {
  it("orgName 과 token 이 포함된다", () => {
    const result = buildInvitationEmail("MyOrg", "inv-tok-789", "https://app.example.com");
    expect(result.body).toContain("MyOrg");
    expect(result.body).toContain("inv-tok-789");
    expect(result.body).toContain("https://app.example.com");
  });
});
