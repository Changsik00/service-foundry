import { Inject, Injectable } from "@nestjs/common";
import { type CursorPaginationParams, decodeCursor, encodeCursor } from "@repo/contracts";
import { DATABASE, type Database } from "@repo/nestjs-database";

import { and, asc, eq, gt, ilike, or } from "drizzle-orm";

import { memberships } from "../infra/schema/memberships.js";
import { users } from "../infra/schema/users.js";

export interface OrgMember {
  userId: string;
  orgId: string;
  role: string;
  email: string;
  displayName: string | null;
}

export type MemberListParams = CursorPaginationParams & { role?: string };

export interface MemberListResult {
  members: OrgMember[];
  nextCursor: string | null;
}

/**
 * 현재 active org 의 멤버 목록.
 *
 * **명시적 `WHERE org_id` 를 두지 않는다** — RLS(`app.current_org`)가 자동 스코프하는 것이
 * 의도이며, 본 endpoint 는 그 격리가 실제 요청 경로에서 작동함을 검증하는 표면이다 (spec-17-08).
 */
@Injectable()
export class OrgMembersService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async list(params: MemberListParams = {}): Promise<MemberListResult> {
    const { search, role, cursor, limit: rawLimit } = params;
    const limit = rawLimit ?? 20;

    const cursorData = cursor ? decodeCursor<{ userId: string }>(cursor) : null;

    const conditions = and(
      search
        ? or(ilike(users.email, `%${search}%`), ilike(users.displayName, `%${search}%`))
        : undefined,
      role ? eq(memberships.role, role as "owner" | "admin" | "member") : undefined,
      cursorData?.userId ? gt(users.id, cursorData.userId) : undefined,
    );

    const rows = await this.database.db
      .select({
        userId: memberships.userId,
        orgId: memberships.orgId,
        role: memberships.role,
        email: users.email,
        displayName: users.displayName,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(conditions)
      .orderBy(asc(memberships.createdAt), asc(users.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const members = hasMore ? rows.slice(0, limit) : rows;
    const lastMember = members[members.length - 1];
    const nextCursor = hasMore && lastMember ? encodeCursor({ userId: lastMember.userId }) : null;

    return { members: members as OrgMember[], nextCursor };
  }
}
