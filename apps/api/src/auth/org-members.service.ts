import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";

import { eq } from "drizzle-orm";

import { memberships } from "../infra/schema/memberships.js";
import { users } from "../infra/schema/users.js";

export interface OrgMember {
  userId: string;
  orgId: string;
  role: string;
  email: string;
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

  async list(): Promise<OrgMember[]> {
    const rows = await this.database.db
      .select({
        userId: memberships.userId,
        orgId: memberships.orgId,
        role: memberships.role,
        email: users.email,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id));
    return rows as OrgMember[];
  }
}
