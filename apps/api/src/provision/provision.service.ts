import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { eq } from "drizzle-orm";

import { memberships } from "../infra/schema/memberships.js";
import { organizations } from "../infra/schema/organizations.js";
import { users } from "../infra/schema/users.js";

export const PROVISION_SERVICE = Symbol("PROVISION_SERVICE");

export interface IProvisionService {
  provisionUser(userId: string, email: string): Promise<{ orgId: string; orgRole: string }>;
  provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }>;
}

@Injectable()
export class ProvisionService implements IProvisionService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }> {
    return this.database.db.transaction(async (tx) => {
      // provider_uid로 기존 유저 조회
      const existing = await tx
        .select()
        .from(users)
        .where(eq(users.providerUid, uid))
        .limit(1)
        .then((r) => r[0]);

      let userId: string;
      let currentOrgId: string | null;

      if (existing) {
        userId = existing.id;
        currentOrgId = existing.orgId ?? null;
      } else {
        // 신규 유저 생성
        const [created] = await tx
          .insert(users)
          .values({ email, providerUid: uid })
          .returning({ id: users.id, orgId: users.orgId });
        userId = created!.id;
        currentOrgId = null;
      }

      if (currentOrgId) {
        return { orgId: currentOrgId, orgRole: "owner", internalUserId: userId };
      }

      // org 없으면 프로비저닝 (provisionUser의 트랜잭션 내 로직 인라인)
      const [org] = await tx
        .insert(organizations)
        .values({
          name: email.split("@")[0] ?? email,
          slug: randomUUID(),
          isPersonal: true,
          ownerId: userId,
        })
        .returning({ id: organizations.id });

      await tx.insert(memberships).values({ userId, orgId: org!.id, role: "owner" });
      await tx.update(users).set({ orgId: org!.id }).where(eq(users.id, userId));

      return { orgId: org!.id, orgRole: "owner", internalUserId: userId };
    });
  }

  async provisionUser(userId: string, email: string): Promise<{ orgId: string; orgRole: string }> {
    return this.database.db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: email.split("@")[0] ?? email,
          slug: randomUUID(),
          isPersonal: true,
          ownerId: userId,
        })
        .returning({ id: organizations.id });

      // INSERT with RETURNING always yields a row; org! is safe here
      await tx.insert(memberships).values({
        userId,
        orgId: org!.id,
        role: "owner",
      });

      await tx.update(users).set({ orgId: org!.id }).where(eq(users.id, userId));

      return { orgId: org!.id, orgRole: "owner" };
    });
  }
}
