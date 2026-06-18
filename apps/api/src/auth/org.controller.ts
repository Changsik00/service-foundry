import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OrgInviteAcceptInput, OrgInviteInput, OrgSwitchInput } from "@repo/auth-contracts";
import {
  type AuthenticatedUser,
  AuthGuard,
  CurrentUser,
  OrgRoles,
  OrgRolesGuard,
} from "@repo/nestjs-auth";

import { zodPipe } from "./auth-controller.shared.js";
import { OrgInviteService } from "./org-invite.service.js";
import { type MemberListResult, OrgMembersService } from "./org-members.service.js";
import { OrgSwitchService } from "./org-switch.service.js";

/** org 전환·초대·멤버 — auth.controller 에서 분리 (spec-23-06). URL prefix 동일(`auth`). */
@ApiTags("auth")
@Controller("auth")
export class OrgController {
  constructor(
    @Inject(OrgSwitchService) private readonly orgSwitchService: OrgSwitchService,
    @Inject(OrgInviteService) private readonly orgInviteService: OrgInviteService,
    @Inject(OrgMembersService) private readonly orgMembersService: OrgMembersService,
  ) {}

  @Post("org/switch")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgSwitch(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ accessToken: string }> {
    const { orgId } = zodPipe(OrgSwitchInput).transform(body);
    return this.orgSwitchService.switch(user.sub, orgId);
  }

  @Post("org/invite")
  @UseGuards(AuthGuard, OrgRolesGuard)
  @OrgRoles("admin", "owner")
  @HttpCode(200)
  async orgInvite(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    const { email, role } = zodPipe(OrgInviteInput).transform(body);
    if (!user.orgId) throw new BadRequestException("no active org");
    await this.orgInviteService.invite(user.sub, user.orgId, email, role);
    return { status: "ok" };
  }

  @Post("org/invite/accept")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgInviteAccept(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ accessToken: string }> {
    const { token } = zodPipe(OrgInviteAcceptInput).transform(body);
    return this.orgInviteService.accept(user.sub, token);
  }

  /** active org 의 멤버 목록 — RLS 가 자동 스코프(spec-17-08 격리 검증 표면). search/role/cursor/limit 지원. */
  @Get("org/members")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async orgMembers(
    @CurrentUser() _user: AuthenticatedUser,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") rawLimit?: string,
  ): Promise<MemberListResult> {
    return this.orgMembersService.list({
      ...(search !== undefined && { search }),
      ...(role !== undefined && { role }),
      ...(cursor !== undefined && { cursor }),
      ...(rawLimit !== undefined && { limit: Number(rawLimit) }),
    });
  }
}
