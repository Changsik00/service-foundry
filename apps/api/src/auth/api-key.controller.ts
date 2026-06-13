import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  type AuthenticatedUser,
  AuthGuard,
  CurrentUser,
  OrgRoles,
  OrgRolesGuard,
} from "@repo/nestjs-auth";

import { ApiKeyGuard } from "./api-key.guard.js";
import type { ApiKeyCreated, ApiKeyPublic } from "./api-key.service.js";
// biome-ignore lint/style/useImportType: emitDecoratorMetadata requires value import for DI
import { ApiKeyService } from "./api-key.service.js";

@Controller("auth/api-keys")
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @UseGuards(AuthGuard, OrgRolesGuard)
  @OrgRoles("admin", "owner")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string },
  ): Promise<ApiKeyCreated> {
    if (!user.orgId) throw new BadRequestException("no active org");
    return this.apiKeyService.create(user.sub, user.orgId, body.name);
  }

  @Get()
  @UseGuards(AuthGuard)
  list(@CurrentUser() user: AuthenticatedUser): Promise<ApiKeyPublic[]> {
    if (!user.orgId) throw new BadRequestException("no active org");
    return this.apiKeyService.list(user.orgId);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(AuthGuard, OrgRolesGuard)
  @OrgRoles("admin", "owner")
  revoke(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    if (!user.orgId) throw new BadRequestException("no active org");
    return this.apiKeyService.revoke(id, user.orgId);
  }

  @Get("verify")
  @UseGuards(ApiKeyGuard)
  verify(): Promise<{ ok: boolean }> {
    return Promise.resolve({ ok: true });
  }
}
