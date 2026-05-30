import { describe, expect, it, vi } from "vitest";
import { createDevNotifier, createNoopNotifier, type EmailMessage } from "./index.js";

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
