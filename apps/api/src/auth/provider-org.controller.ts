import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";
import { OrgSwitchInput } from "@repo/auth-contracts";
import { type AuthenticatedUser, AuthGuard, CurrentUser } from "@repo/nestjs-auth";
import { ZodError, type z } from "zod";

import { OrgListService, type OrgSummary } from "./org-list.service.js";
import { ProviderOrgSwitchService } from "./provider-org-switch.service.js";

function parseOr400<T>(schema: z.ZodType<T>, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (err) {
    if (err instanceof ZodError) throw new BadRequestException(err.issues);
    throw err;
  }
}

/** provider 모드 org 표면 — native auth.controller 의 org 엔드포인트와 분리 (spec-x-org-api) */
@Controller("auth")
export class ProviderOrgController {
  // tsx(esbuild) 는 emitDecoratorMetadata 미지원 — 명시적 @Inject 필수 (레포 컨벤션)
  constructor(
    @Inject(OrgListService) private readonly orgList: OrgListService,
    @Inject(ProviderOrgSwitchService) private readonly orgSwitch: ProviderOrgSwitchService,
  ) {}

  @Get("orgs")
  @UseGuards(AuthGuard)
  async orgs(@CurrentUser() user: AuthenticatedUser): Promise<{ orgs: OrgSummary[] }> {
    return { orgs: await this.orgList.listForProviderUid(user.sub) };
  }

  /** active org 전환 — users.orgId UPDATE, 토큰 불변 (ADR-0026). 클라는 쿼리 invalidate 만 */
  @Post("org/switch")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async switch(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ orgId: string }> {
    const { orgId } = parseOr400(OrgSwitchInput, body);
    return this.orgSwitch.switch(user.sub, orgId);
  }
}
