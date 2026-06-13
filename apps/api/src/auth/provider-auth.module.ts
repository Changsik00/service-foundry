import { type DynamicModule, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard, RolesGuard } from "@repo/nestjs-auth";
import { FIREBASE_PROVISION_PORT } from "@repo/nestjs-auth-firebase";
import { SUPABASE_PROVISION_PORT } from "@repo/nestjs-auth-supabase";

import { DATABASE, type Database } from "@repo/nestjs-database";
import { JwtModule } from "../jwt/jwt.module.js";
import { PROVISION_SERVICE, ProvisionService } from "../provision/provision.service.js";
import { type AppSettings, loadSettings } from "../settings.js";
import { ACCOUNT_USER_STORE, createAccountUserStore } from "./account.stores.js";
import { FRONTEND_URL } from "./frontend-url.token.js";
import { JWT_SIGN_OPTIONS } from "./jwt-sign.options.js";
import { OrgInviteService } from "./org-invite.service.js";
import { OrgListService } from "./org-list.service.js";
import { OrgMembersService } from "./org-members.service.js";
import { ProviderMeController } from "./provider-me.controller.js";
import { ProviderOrgController } from "./provider-org.controller.js";
import { ProviderOrgSwitchService } from "./provider-org-switch.service.js";

/**
 * firebase / supabase provider 모드 전용 모듈.
 * native 컨트롤러(signup, oauth, mfa 등) 없이 AuthGuard + ProvisionService 만 제공.
 *
 * global: true — FIREBASE_PROVISION_PORT / SUPABASE_PROVISION_PORT 가 전역 스코프에 등록되어
 * 중첩된 verifierModule(NestjsFirebaseAuthModule 등)의 verifier 가 @Optional()으로 주입받을 수 있다.
 */
const settings: AppSettings = loadSettings(process.env);

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS @Module 패턴은 클래스 필수
export class ProviderAuthModule {
  static forMode(mode: "firebase" | "supabase", verifierModule: DynamicModule): DynamicModule {
    const portToken = mode === "firebase" ? FIREBASE_PROVISION_PORT : SUPABASE_PROVISION_PORT;
    const portProvider = { provide: portToken, useExisting: ProvisionService };

    return {
      module: ProviderAuthModule,
      global: true,
      // JwtModule: OrgInviteService 생성자 의존 (native accept 경로용 — provider 경로는 미사용)
      imports: [verifierModule, JwtModule],
      controllers: [ProviderMeController, ProviderOrgController],
      providers: [
        OrgListService,
        ProviderOrgSwitchService,
        OrgMembersService,
        OrgInviteService,
        { provide: FRONTEND_URL, useValue: settings.FRONTEND_URL },
        {
          provide: JWT_SIGN_OPTIONS,
          useValue: { issuer: settings.JWT_ISSUER, audience: settings.JWT_AUDIENCE },
        },
        ProvisionService,
        { provide: PROVISION_SERVICE, useExisting: ProvisionService },
        portProvider,
        Reflector,
        AuthGuard,
        RolesGuard,
        {
          provide: ACCOUNT_USER_STORE,
          inject: [DATABASE],
          useFactory: (db: Database<Record<string, unknown>>) => createAccountUserStore(db.db),
        },
      ],
      // portToken export 필수 — global 모듈도 export 하지 않은 provider 는 외부(verifierModule 내부
      // SupabaseVerifier 의 @Optional 주입)에서 보이지 않는다. 누락 시 provision 이 조용히 null
      // → 첫 로그인 개인 워크스페이스 자동 생성(ADR-0022 seam)이 끊긴다 (spec-x-org-api 에서 발견).
      exports: [AuthGuard, RolesGuard, ProvisionService, verifierModule, portToken],
    };
  }
}
