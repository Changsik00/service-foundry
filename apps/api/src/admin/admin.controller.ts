import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard, Roles, RolesGuard } from "@repo/nestjs-auth";

import { AdminService, type OrgListResult, type UserListResult } from "./admin.service.js";
import { type FeatureFlagRow, FeatureFlagService } from "./feature-flag.service.js";

/** 플랫폼 수퍼어드민 전용 API — users.role="admin" 인 유저만 접근 가능 */
@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
  ) {}

  /** 전체 조직 목록 — RLS 우회(runWithSystemTenant), 커서 페이지네이션 */
  @Get("orgs")
  async listOrgs(
    @Query("search") search?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") rawLimit?: string,
  ): Promise<OrgListResult> {
    return this.adminService.listOrgs({
      ...(search !== undefined && { search }),
      ...(cursor !== undefined && { cursor }),
      ...(rawLimit !== undefined && { limit: Number(rawLimit) }),
    });
  }

  /** 전체 유저 목록 — RLS 우회(runWithSystemTenant), 커서 페이지네이션 */
  @Get("users")
  async listUsers(
    @Query("search") search?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") rawLimit?: string,
  ): Promise<UserListResult> {
    return this.adminService.listUsers({
      ...(search !== undefined && { search }),
      ...(cursor !== undefined && { cursor }),
      ...(rawLimit !== undefined && { limit: Number(rawLimit) }),
    });
  }

  @Get("feature-flags")
  async listFeatureFlags(): Promise<FeatureFlagRow[]> {
    return this.featureFlagService.list();
  }

  @Post("feature-flags")
  async createFeatureFlag(
    @Body() body: { key: string; description?: string },
  ): Promise<FeatureFlagRow> {
    return this.featureFlagService.create(body.key, body.description);
  }

  @Patch("feature-flags/:key")
  async updateFeatureFlag(
    @Param("key") key: string,
    @Body() body: { enabled: boolean },
  ): Promise<FeatureFlagRow> {
    return this.featureFlagService.update(key, body.enabled);
  }

  @Delete("feature-flags/:key")
  @HttpCode(204)
  async deleteFeatureFlag(@Param("key") key: string): Promise<void> {
    return this.featureFlagService.remove(key);
  }
}
