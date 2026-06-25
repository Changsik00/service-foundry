import { Inject, Injectable } from "@nestjs/common";
import type { OrgRole } from "@repo/auth-contracts";
import { memberships, organizations, users } from "@repo/backend-schema";
import { type CursorPaginationParams, decodeCursor, encodeCursor } from "@repo/contracts";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { and, asc, eq, gt, ilike, or } from "drizzle-orm";

export interface OrgMember {
  userId: string;
  orgId: string;
  role: OrgRole;
  email: string;
  displayName: string | null;
}

export type MemberListParams = CursorPaginationParams & {
  role?: string;
  /** active org — 명시 스코프(defense-in-depth, spec-x-org-members-defensive-scope). null 이면 fail-closed. */
  orgId?: string | null;
};

export interface MemberListResult {
  members: OrgMember[];
  nextCursor: string | null;
}

/** 어떤 org 와도 매칭 안 되는 값 — orgId 없으면 fail-closed (0건). interceptor 와 동일 철학. */
const NIL_ORG = "00000000-0000-0000-0000-000000000000";

/**
 * 현재 active org 의 멤버 목록.
 *
 * **명시적 `WHERE memberships.org_id = activeOrg`** 로 스코프한다(defense-in-depth,
 * spec-x-org-members-defensive-scope). RLS(`app.current_org`) + interceptor fail-close 에 더해
 * 애플리케이션 레이어에도 명시 스코프를 둬, 단일 계층이 어긋나도 cross-org 누수가 없게 한다.
 * orgId 가 없으면 nil-uuid 로 0건(fail-closed).
 */
@Injectable()
export class OrgMembersService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async list(params: MemberListParams = {}): Promise<MemberListResult> {
    const { search, role, cursor, limit: rawLimit, orgId } = params;
    const limit = rawLimit ?? 20;

    const cursorData = cursor ? decodeCursor<{ userId: string }>(cursor) : null;

    const conditions = and(
      eq(memberships.orgId, orgId ?? NIL_ORG),
      search
        ? or(ilike(users.email, `%${search}%`), ilike(users.displayName, `%${search}%`))
        : undefined,
      role ? eq(memberships.role, role as "owner" | "admin" | "member") : undefined,
      cursorData?.userId ? gt(users.id, cursorData.userId) : undefined,
    );

    const rows = await this.database.db
      .select({
        // 외부 식별자 = public_id. internalUserId 는 커서 페이지네이션(내부 정렬)에만 사용.
        userId: users.publicId,
        internalUserId: users.id,
        orgId: organizations.publicId,
        role: memberships.role,
        email: users.email,
        displayName: users.displayName,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .innerJoin(organizations, eq(memberships.orgId, organizations.id))
      .where(conditions)
      .orderBy(asc(memberships.createdAt), asc(users.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const lastMember = sliced[sliced.length - 1];
    // 커서는 내부 user id 기반(불투명, 페이지네이션 정렬키) — 응답엔 미노출.
    const nextCursor =
      hasMore && lastMember ? encodeCursor({ userId: lastMember.internalUserId }) : null;
    const members = sliced.map(({ internalUserId: _omit, ...m }) => m);

    return { members: members as OrgMember[], nextCursor };
  }
}
