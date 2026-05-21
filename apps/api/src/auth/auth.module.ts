import { Module } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";

import { AuthController } from "./auth.controller.js";
import { EmailVerifyService } from "./email-verify.service.js";
import {
  createDrizzleEmailVerifyTokenStore,
  EMAIL_VERIFY_TOKEN_STORE,
} from "./email-verify.stores.js";
import { PasswordResetService } from "./password-reset.service.js";
import {
  createDrizzleTokenStore,
  createDrizzleUserStore,
  PASSWORD_RESET_TOKEN_STORE,
  USER_STORE,
} from "./password-reset.stores.js";

@Module({
  providers: [
    PasswordResetService,
    EmailVerifyService,
    {
      provide: USER_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleUserStore(db.db),
    },
    {
      provide: PASSWORD_RESET_TOKEN_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleTokenStore(db.db),
    },
    {
      provide: EMAIL_VERIFY_TOKEN_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) =>
        createDrizzleEmailVerifyTokenStore(db.db),
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
