import { Module } from "@nestjs/common";
import { AuthGuard, NESTJS_AUTH_OPTIONS } from "@repo/nestjs-auth";
import { DATABASE, type Database } from "@repo/nestjs-database";

import { JwtModule } from "../jwt/jwt.module.js";
// biome-ignore lint/style/useImportType: NestJS emitDecoratorMetadata requires runtime reference
import { JwtService } from "../jwt/jwt.service.js";
import { type AppSettings, loadSettings } from "../settings.js";
import { AuthController } from "./auth.controller.js";
import { EmailVerifyService } from "./email-verify.service.js";
import {
  createDrizzleEmailVerifyTokenStore,
  EMAIL_VERIFY_TOKEN_STORE,
} from "./email-verify.stores.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { PasswordResetService } from "./password-reset.service.js";
import {
  createDrizzleTokenStore,
  createDrizzleUserStore,
  PASSWORD_RESET_TOKEN_STORE,
  USER_STORE,
} from "./password-reset.stores.js";
import { createDrizzleSessionStore, SESSION_STORE } from "./session.stores.js";
import { SigninService } from "./signin.service.js";
import { SignupService } from "./signup.service.js";

const settings: AppSettings = loadSettings(process.env);

@Module({
  imports: [JwtModule],
  providers: [
    PasswordResetService,
    EmailVerifyService,
    SigninService,
    SignupService,
    AuthGuard,
    {
      provide: JWT_SIGN_OPTIONS,
      useValue: { issuer: settings.JWT_ISSUER, audience: settings.JWT_AUDIENCE },
    },
    {
      provide: NESTJS_AUTH_OPTIONS,
      inject: [JWT_SIGN_OPTIONS, JwtService],
      useFactory: (opts: JwtSignOptions, jwt: JwtService) => ({
        keyStore: () => jwt.getKeyStore(),
        issuer: opts.issuer,
        audience: opts.audience,
      }),
    },
    {
      provide: USER_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleUserStore(db.db),
    },
    {
      provide: SESSION_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleSessionStore(db.db),
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
