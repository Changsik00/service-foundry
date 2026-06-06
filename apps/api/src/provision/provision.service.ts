import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { eq } from "drizzle-orm";

import { memberships } from "../infra/schema/memberships.js";
import { organizations } from "../infra/schema/organizations.js";
import { users } from "../infra/schema/users.js";

export const PROVISION_SERVICE = Symbol("PROVISION_SERVICE");

export interface IProvisionService {
  provisionUser(userId: string, email: string): Promise<void>;
}

@Injectable()
export class ProvisionService implements IProvisionService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async provisionUser(userId: string, email: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
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
    });
  }
}
