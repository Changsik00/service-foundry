import { Module } from "@nestjs/common";
import { AuditService, AuthEventBus, drizzleAuditLogStore } from "@repo/backend-auth-audit";
import { AuthGuard, NESTJS_AUTH_OPTIONS } from "@repo/nestjs-auth";
import { DATABASE, type Database } from "@repo/nestjs-database";

import { JwtModule } from "../jwt/jwt.module.js";
import { JwtService } from "../jwt/jwt.service.js";
import { PROVISION_SERVICE, ProvisionService } from "../provision/provision.service.js";
import { type AppSettings, loadSettings } from "../settings.js";
import { AuditEventListener } from "./audit.event-listener.js";
import { AuthController } from "./auth.controller.js";
import { CSRF_SECRET, CsrfGuard } from "./csrf.guard.js";
import { EmailVerifyService } from "./email-verify.service.js";
import {
  createDrizzleEmailVerifyTokenStore,
  EMAIL_VERIFY_TOKEN_STORE,
} from "./email-verify.stores.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { MfaController } from "./mfa.controller.js";
import { MfaService } from "./mfa.service.js";
import { createDrizzleMfaStore, MFA_STORE } from "./mfa.stores.js";
import { OAuthController } from "./oauth.controller.js";
import { OAuthService } from "./oauth.service.js";
import { createDrizzleOAuthAccountStore, OAUTH_ACCOUNT_STORE } from "./oauth.stores.js";
import { OrgInviteService } from "./org-invite.service.js";
import { OrgMembersService } from "./org-members.service.js";
import { OrgSwitchService } from "./org-switch.service.js";
import { PasskeyController } from "./passkey.controller.js";
import { PasskeyService } from "./passkey.service.js";
import { createDrizzlePasskeyStore, PASSKEY_STORE } from "./passkey.stores.js";
import { PasswordResetService } from "./password-reset.service.js";
import {
  createDrizzleTokenStore,
  createDrizzleUserStore,
  PASSWORD_RESET_TOKEN_STORE,
  USER_STORE,
} from "./password-reset.stores.js";
import { createDrizzleRateLimitStore, RATE_LIMIT_STORE } from "./rate-limit.stores.js";
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
    OrgSwitchService,
    OrgInviteService,
    OrgMembersService,
    ProvisionService,
    { provide: PROVISION_SERVICE, useExisting: ProvisionService },
    OAuthService,
    MfaService,
    AuthGuard,
    AuthEventBus,
    AuditEventListener,
    CsrfGuard,
    {
      provide: CSRF_SECRET,
      useValue: settings.CSRF_SECRET,
    },
    {
      provide: FRONTEND_URL,
      useValue: settings.FRONTEND_URL,
    },
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
      provide: AuditService,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) =>
        new AuditService(drizzleAuditLogStore(db.db as Parameters<typeof drizzleAuditLogStore>[0])),
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
      provide: RATE_LIMIT_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleRateLimitStore(db.db),
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
    {
      provide: OAUTH_ACCOUNT_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleOAuthAccountStore(db.db),
    },
    {
      provide: MFA_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzleMfaStore(db.db),
    },
    PasskeyService,
    {
      provide: PASSKEY_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createDrizzlePasskeyStore(db.db),
    },
  ],
  controllers: [AuthController, OAuthController, MfaController, PasskeyController],
})
export class AuthModule {}
