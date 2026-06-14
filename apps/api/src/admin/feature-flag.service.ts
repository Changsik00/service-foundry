import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";
import type { FeatureFlagRow } from "../infra/schema/index.js";

export type { FeatureFlagRow };

@Injectable()
export class FeatureFlagService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async list(): Promise<FeatureFlagRow[]> {
    throw new Error("not implemented");
  }

  async isEnabled(key: string): Promise<boolean> {
    throw new Error("not implemented");
  }

  async create(key: string, description?: string): Promise<FeatureFlagRow> {
    throw new Error("not implemented");
  }

  async update(key: string, enabled: boolean): Promise<FeatureFlagRow> {
    throw new Error("not implemented");
  }

  async remove(key: string): Promise<void> {
    throw new Error("not implemented");
  }
}
