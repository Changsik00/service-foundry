import { type DynamicModule, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard, RolesGuard } from "@repo/nestjs-auth";
import { FIREBASE_PROVISION_PORT } from "@repo/nestjs-auth-firebase";
import { SUPABASE_PROVISION_PORT } from "@repo/nestjs-auth-supabase";

import { PROVISION_SERVICE, ProvisionService } from "../provision/provision.service.js";
import { OrgListService } from "./org-list.service.js";
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
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS @Module 패턴은 클래스 필수
export class ProviderAuthModule {
  static forMode(mode: "firebase" | "supabase", verifierModule: DynamicModule): DynamicModule {
    const portProvider =
      mode === "firebase"
        ? { provide: FIREBASE_PROVISION_PORT, useExisting: ProvisionService }
        : { provide: SUPABASE_PROVISION_PORT, useExisting: ProvisionService };

    return {
      module: ProviderAuthModule,
      global: true,
      imports: [verifierModule],
      controllers: [ProviderMeController, ProviderOrgController],
      providers: [
        OrgListService,
        ProviderOrgSwitchService,
        ProvisionService,
        { provide: PROVISION_SERVICE, useExisting: ProvisionService },
        portProvider,
        Reflector,
        AuthGuard,
        RolesGuard,
      ],
      exports: [AuthGuard, RolesGuard, ProvisionService, verifierModule],
    };
  }
}
