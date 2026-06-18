import { Inject, Injectable } from "@nestjs/common";
import { type CursorPaginationParams, decodeCursor, encodeCursor } from "@repo/contracts";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, asc, gt, ilike, or } from "drizzle-orm";

import { organizations } from "../infra/schema/organizations.js";
import { users } from "../infra/schema/users.js";
import { runWithSystemTenant, TENANT_ALS, type TenantAls } from "../infra/tenant.js";

export interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  ownerId: string;
  createdAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  /** platform admin role — "admin" = superadmin */
  role: string;
  orgId: string | null;
  createdAt: Date;
}

export type OrgListParams = CursorPaginationParams;

export interface OrgListResult {
  orgs: AdminOrg[];
  nextCursor: string | null;
}

export type UserListParams = CursorPaginationParams;

export interface UserListResult {
  users: AdminUser[];
  nextCursor: string | null;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
    @Inject(TENANT_ALS) private readonly als: TenantAls,
  ) {}

  async listOrgs(params: OrgListParams = {}): Promise<OrgListResult> {
    const { search, cursor, limit: rawLimit } = params;
    const limit = rawLimit ?? 20;
    const cursorData = cursor ? decodeCursor<{ orgId: string }>(cursor) : null;

    const conditions = and(
      search
        ? or(ilike(organizations.name, `%${search}%`), ilike(organizations.slug, `%${search}%`))
        : undefined,
      cursorData?.orgId ? gt(organizations.id, cursorData.orgId) : undefined,
    );

    return runWithSystemTenant(this.als, async () => {
      const rows = await this.database.db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          isPersonal: organizations.isPersonal,
          ownerId: organizations.ownerId,
          createdAt: organizations.createdAt,
        })
        .from(organizations)
        .where(conditions)
        .orderBy(asc(organizations.createdAt), asc(organizations.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const orgs = hasMore ? rows.slice(0, limit) : rows;
      const last = orgs[orgs.length - 1];
      const nextCursor = hasMore && last ? encodeCursor({ orgId: last.id }) : null;

      return { orgs: orgs as AdminOrg[], nextCursor };
    });
  }

  async listUsers(params: UserListParams = {}): Promise<UserListResult> {
    const { search, cursor, limit: rawLimit } = params;
    const limit = rawLimit ?? 20;
    const cursorData = cursor ? decodeCursor<{ userId: string }>(cursor) : null;

    const conditions = and(
      search
        ? or(ilike(users.email, `%${search}%`), ilike(users.displayName, `%${search}%`))
        : undefined,
      cursorData?.userId ? gt(users.id, cursorData.userId) : undefined,
    );

    return runWithSystemTenant(this.als, async () => {
      const rows = await this.database.db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          orgId: users.orgId,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions)
        .orderBy(asc(users.createdAt), asc(users.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const userList = hasMore ? rows.slice(0, limit) : rows;
      const last = userList[userList.length - 1];
      const nextCursor = hasMore && last ? encodeCursor({ userId: last.id }) : null;

      return { users: userList as AdminUser[], nextCursor };
    });
  }
}
