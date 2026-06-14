import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { asc, eq } from "drizzle-orm";
import { type FeatureFlagRow, featureFlags } from "../infra/schema/index.js";

export type { FeatureFlagRow };

@Injectable()
export class FeatureFlagService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async list(): Promise<FeatureFlagRow[]> {
    return this.database.db.select().from(featureFlags).orderBy(asc(featureFlags.createdAt));
  }

  async isEnabled(key: string): Promise<boolean> {
    const rows = await this.database.db
      .select({ enabled: featureFlags.enabled })
      .from(featureFlags)
      .where(eq(featureFlags.key, key))
      .execute();
    return rows[0]?.enabled ?? false;
  }

  async create(key: string, description?: string): Promise<FeatureFlagRow> {
    const rows = await this.database.db
      .insert(featureFlags)
      .values({ key, ...(description !== undefined && { description }) })
      .returning()
      .execute();
    return rows[0] as FeatureFlagRow;
  }

  async update(key: string, enabled: boolean): Promise<FeatureFlagRow> {
    const rows = await this.database.db
      .update(featureFlags)
      .set({ enabled })
      .where(eq(featureFlags.key, key))
      .returning()
      .execute();
    return rows[0] as FeatureFlagRow;
  }

  async remove(key: string): Promise<void> {
    await this.database.db.delete(featureFlags).where(eq(featureFlags.key, key)).execute();
  }
}
