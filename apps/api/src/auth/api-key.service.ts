import { createHash, randomBytes } from "node:crypto";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";

export interface ApiKeyPublic {
  id: string;
  orgId: string;
  name: string;
  keyPreview: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyCreated extends ApiKeyPublic {
  plain: string;
  preview: string;
}

@Injectable()
export class ApiKeyService {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async create(_userId: string, _orgId: string, _name: string): Promise<ApiKeyCreated> {
    throw new Error("not implemented");
  }

  async list(_orgId: string): Promise<ApiKeyPublic[]> {
    throw new Error("not implemented");
  }

  async revoke(_id: string, _orgId: string): Promise<void> {
    throw new Error("not implemented");
  }

  async verifyKey(_plain: string): Promise<ApiKeyPublic | null> {
    throw new Error("not implemented");
  }
}
