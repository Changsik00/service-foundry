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
import { OrgInviteAcceptInput, OrgInviteInput, OrgSwitchInput } from "@repo/auth-contracts";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";

import { zodPipe } from "./auth-controller.shared.js";
import { OrgInviteService } from "./org-invite.service.js";
import { OrgListService, type OrgSummary } from "./org-list.service.js";
import { type MemberListResult, type OrgMember, OrgMembersService } from "./org-members.service.js";
import { ProviderOrgSwitchService } from "./provider-org-switch.service.js";

/** provider 모드 org 표면 — native auth.controller 의 org 엔드포인트와 분리 (spec-x-org-api) */
@Controller("auth")
export class ProviderOrgController {
  // tsx(esbuild) 는 emitDecoratorMetadata 미지원 — 명시적 @Inject 필수 (레포 컨벤션)
  constructor(
    @Inject(OrgListService) private readonly orgList: OrgListService,
    @Inject(ProviderOrgSwitchService) private readonly orgSwitch: ProviderOrgSwitchService,
    @Inject(OrgMembersService) private readonly orgMembers: OrgMembersService,
    @Inject(OrgInviteService) private readonly orgInvite: OrgInviteService,
  ) {}

  @Get("orgs")
  @UseGuards(AuthGuard)
  async orgs(@CurrentUser() user: AuthenticatedUser): Promise<{ orgs: OrgSummary[] }> {
    // sub 는 내부 users.id 로 정규화됨(spec-x-auth-sub-normalize) → native 와 동일 메서드.
    return { orgs: await this.orgList.listForUserId(user.sub) };
  }

  /** active org 전환 — users.orgId UPDATE, 토큰 불변 (ADR-0026). 클라는 쿼리 invalidate 만 */
  @Post("org/switch")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async switch(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ orgId: string }> {
    const { orgId } = zodPipe(OrgSwitchInput).transform(body);
    return this.orgSwitch.switch(user.sub, orgId);
  }

  /** active org 멤버 목록 — 명시 org 스코프(defense-in-depth) + RLS, search/role/cursor/limit 지원 */
  @Get("org/members")
  @UseGuards(AuthGuard)
  async members(
    @CurrentUser() user: AuthenticatedUser,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") rawLimit?: string,
  ): Promise<MemberListResult> {
    return this.orgMembers.list({
      orgId: user.orgId,
      ...(search !== undefined && { search }),
      ...(role !== undefined && { role }),
      ...(cursor !== undefined && { cursor }),
      ...(rawLimit !== undefined && { limit: Number(rawLimit) }),
    });
  }

  @Post("org/invite")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async invite(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    const { email, role } = zodPipe(OrgInviteInput).transform(body);
    if (!user.orgId) throw new BadRequestException("no active org");
    // sub=내부 id → native invite 와 동일(providerUid resolve 불필요).
    await this.orgInvite.invite(user.sub, user.orgId, email, role);
    return { status: "ok" };
  }

  /** 초대 수락 — 멤버십 생성 + active org 전환 (토큰 불변, ADR-0026) */
  @Post("org/invite/accept")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async inviteAccept(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ orgId: string }> {
    const { token } = zodPipe(OrgInviteAcceptInput).transform(body);
    return this.orgInvite.acceptForProvider(user.sub, token);
  }
}
