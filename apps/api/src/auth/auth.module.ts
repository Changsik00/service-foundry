import { Module } from "@nestjs/common";
import { AuditService, AuthEventBus, drizzleAuditLogStore } from "@repo/backend-auth-audit";
import { createMemoryStorage } from "@repo/backend-storage";
import {
  ACCESS_TOKEN_VERIFIER,
  AuthGuard,
  NativeVerifier,
  NESTJS_AUTH_OPTIONS,
  type NestjsAuthOptions,
  OrgRolesGuard,
  RolesGuard,
} from "@repo/nestjs-auth";
import { FIREBASE_ADMIN_APP } from "@repo/nestjs-auth-firebase";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { createClient } from "@supabase/supabase-js";
import { cert, initializeApp } from "firebase-admin/app";
import { AdminController } from "../admin/admin.controller.js";
import { AdminService } from "../admin/admin.service.js";
import { FeatureFlagGuard } from "../admin/feature-flag.guard.js";
import { FeatureFlagService } from "../admin/feature-flag.service.js";
import { createSupabaseStorage } from "../infra/storage/supabase-storage.js";
import { JwtModule } from "../jwt/jwt.module.js";
import { JwtService } from "../jwt/jwt.service.js";
import { PROVISION_SERVICE, ProvisionService } from "../provision/provision.service.js";
import { type AppSettings, loadSettings } from "../settings.js";
import { AccountController } from "./account.controller.js";
import { AccountService, STORAGE } from "./account.service.js";
import { ACCOUNT_USER_STORE, createAccountUserStore } from "./account.stores.js";
import { ApiKeyController } from "./api-key.controller.js";
import { ApiKeyGuard } from "./api-key.guard.js";
import { ApiKeyService } from "./api-key.service.js";
import { AuditEventListener } from "./audit.event-listener.js";
import { AuthController } from "./auth.controller.js";
import { CSRF_SECRET, CsrfGuard } from "./csrf.guard.js";
import { EmailChangeController } from "./email-change.controller.js";
import { EmailChangeService } from "./email-change.service.js";
import { createEmailChangeTokenStore, EMAIL_CHANGE_TOKEN_STORE } from "./email-change.stores.js";
import { EmailVerifyService } from "./email-verify.service.js";
import {
  createDrizzleEmailVerifyTokenStore,
  EMAIL_VERIFY_TOKEN_STORE,
} from "./email-verify.stores.js";
import { FirebaseTokenController } from "./firebase-token.controller.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { JWT_SIGN_OPTIONS, type JwtSignOptions } from "./jwt-sign.options.js";
import { MfaController } from "./mfa.controller.js";
import { MfaService } from "./mfa.service.js";
import { createDrizzleMfaStore, MFA_STORE } from "./mfa.stores.js";
import { OAuthController } from "./oauth.controller.js";
import { OAuthService } from "./oauth.service.js";
import { createDrizzleOAuthAccountStore, OAUTH_ACCOUNT_STORE } from "./oauth.stores.js";
import { OrgController } from "./org.controller.js";
import { OrgInviteService } from "./org-invite.service.js";
import { OrgListService } from "./org-list.service.js";
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
import { SessionController } from "./session.controller.js";
import { createDrizzleSessionStore, SESSION_STORE } from "./session.stores.js";
import { SessionManagementService } from "./session-management.service.js";
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
    OrgListService,
    ProvisionService,
    { provide: PROVISION_SERVICE, useExisting: ProvisionService },
    OAuthService,
    MfaService,
    AccountService,
    EmailChangeService,
    SessionManagementService,
    {
      provide: EMAIL_CHANGE_TOKEN_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createEmailChangeTokenStore(db.db),
    },
    {
      provide: ACCOUNT_USER_STORE,
      inject: [DATABASE],
      useFactory: (db: Database<Record<string, unknown>>) => createAccountUserStore(db.db),
    },
    AuthGuard,
    OrgRolesGuard,
    RolesGuard,
    AdminService,
    FeatureFlagService,
    FeatureFlagGuard,
    ApiKeyService,
    ApiKeyGuard,
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
      provide: ACCESS_TOKEN_VERIFIER,
      inject: [NESTJS_AUTH_OPTIONS],
      useFactory: (opts: NestjsAuthOptions) => new NativeVerifier(opts),
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
    {
      provide: STORAGE,
      useFactory: () => {
        if (settings.SUPABASE_URL && settings.SUPABASE_SERVICE_ROLE_KEY) {
          const client = createClient(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY);
          return createSupabaseStorage(
            client,
            settings.SUPABASE_STORAGE_BUCKET,
            settings.SUPABASE_URL,
          );
        }
        return createMemoryStorage({ baseUrl: "memory://avatars" });
      },
    },
    // [브리지 패턴] FIREBASE_SERVICE_ACCOUNT 설정 시에만 Firebase Admin 앱 초기화.
    // AUTH_MODE=native 서버에서 Firebase 클라이언트 SDK 세션이 추가로 필요한 경우에 활성화.
    // "native-bridge" 앱 이름 — AUTH_MODE=firebase 모드의 unnamed app과 충돌 방지.
    ...(settings.FIREBASE_SERVICE_ACCOUNT
      ? [
          {
            provide: FIREBASE_ADMIN_APP,
            useValue: initializeApp(
              {
                credential: cert(settings.FIREBASE_SERVICE_ACCOUNT),
                ...(settings.FIREBASE_PROJECT_ID
                  ? { projectId: settings.FIREBASE_PROJECT_ID }
                  : {}),
              },
              "native-bridge",
            ),
          },
        ]
      : []),
  ],
  controllers: [
    AuthController,
    SessionController,
    OrgController,
    AccountController,
    EmailChangeController,
    ApiKeyController,
    OAuthController,
    MfaController,
    PasskeyController,
    FirebaseTokenController,
    AdminController,
  ],
})
export class AuthModule {}
