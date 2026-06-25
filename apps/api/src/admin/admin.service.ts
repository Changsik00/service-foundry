import { Inject, Injectable } from "@nestjs/common";
import type { Role } from "@repo/auth-contracts";
import { organizations, users } from "@repo/backend-schema";
import { runWithSystemTenant, TENANT_ALS, type TenantAls } from "@repo/backend-tenant";
import { type CursorPaginationParams, decodeCursor, encodeCursor } from "@repo/contracts";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, asc, eq, gt, ilike, or } from "drizzle-orm";

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
  role: Role;
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
      // 외부 식별자 = public_id (ADR-0028). id=org public, ownerId=owner public. cursor 는 내부 id(불투명).
      const rows = await this.database.db
        .select({
          id: organizations.publicId,
          internalId: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          isPersonal: organizations.isPersonal,
          ownerId: users.publicId,
          createdAt: organizations.createdAt,
        })
        .from(organizations)
        .innerJoin(users, eq(organizations.ownerId, users.id))
        .where(conditions)
        .orderBy(asc(organizations.createdAt), asc(organizations.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const sliced = hasMore ? rows.slice(0, limit) : rows;
      const last = sliced[sliced.length - 1];
      const nextCursor = hasMore && last ? encodeCursor({ orgId: last.internalId }) : null;
      const orgs = sliced.map(({ internalId: _omit, ...o }) => o);

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
      // 외부 식별자 = public_id. id=user public, orgId=org public(없으면 null). cursor 는 내부 id(불투명).
      const rows = await this.database.db
        .select({
          id: users.publicId,
          internalId: users.id,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          orgId: organizations.publicId,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(organizations, eq(users.orgId, organizations.id))
        .where(conditions)
        .orderBy(asc(users.createdAt), asc(users.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const sliced = hasMore ? rows.slice(0, limit) : rows;
      const last = sliced[sliced.length - 1];
      const nextCursor = hasMore && last ? encodeCursor({ userId: last.internalId }) : null;
      const userList = sliced.map(({ internalId: _omit, ...u }) => u);

      return { users: userList as AdminUser[], nextCursor };
    });
  }
}
