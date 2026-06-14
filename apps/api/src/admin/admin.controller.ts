import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { AuthGuard, Roles, RolesGuard } from "@repo/nestjs-auth";

import { AdminService, type OrgListResult, type UserListResult } from "./admin.service.js";

/** 플랫폼 수퍼어드민 전용 API — users.role="admin" 인 유저만 접근 가능 */
@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

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
}
