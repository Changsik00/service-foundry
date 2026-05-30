import { Global, Module } from "@nestjs/common";

import { NOTIFIER, notifierProvider } from "./notifier.provider.js";

/** @Global — NOTIFIER 를 앱 전역(AuthModule 서비스 포함)에서 주입 가능하게. */
@Global()
@Module({
  providers: [notifierProvider],
  exports: [NOTIFIER],
})
export class NotificationModule {}
