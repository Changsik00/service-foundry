import { Controller, Get, UseGuards } from "@nestjs/common";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";

import type { OrgListService, OrgSummary } from "./org-list.service.js";

/** provider 모드 org 표면 — native auth.controller 의 org 엔드포인트와 분리 (spec-x-org-api) */
@Controller("auth")
export class ProviderOrgController {
  constructor(private readonly orgList: OrgListService) {}

  @Get("orgs")
  @UseGuards(AuthGuard)
  async orgs(@CurrentUser() user: AuthenticatedUser): Promise<{ orgs: OrgSummary[] }> {
    return { orgs: await this.orgList.listForProviderUid(user.sub) };
  }
}
