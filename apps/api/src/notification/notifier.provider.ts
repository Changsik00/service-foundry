import {
  createDevNotifier,
  createNoopNotifier,
  createResendNotifier,
  type Notifier,
} from "@repo/backend-notification";
import { Resend } from "resend";

import { loadSettings } from "../settings.js";

/** @Inject 토큰 — auth 서비스가 reset/verify 메일 전송에 사용. */
export const NOTIFIER = Symbol("NOTIFIER");

export const notifierProvider = {
  provide: NOTIFIER,
  useFactory: (): Notifier => {
    const settings = loadSettings(process.env);
    if (settings.RESEND_API_KEY) {
      const client = new Resend(settings.RESEND_API_KEY);
      return createResendNotifier(client, settings.EMAIL_FROM);
    }
    return settings.NODE_ENV === "development" ? createDevNotifier() : createNoopNotifier();
  },
};
