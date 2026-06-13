import type { AuthenticatedUser } from "@repo/nestjs-auth";

import type { ApiKeyCreated, ApiKeyPublic, ApiKeyService } from "./api-key.service.js";

export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {
    void this.apiKeyService;
  }

  create(_user: AuthenticatedUser, _body: { name: string }): Promise<ApiKeyCreated> {
    throw new Error("not implemented");
  }

  list(_user: AuthenticatedUser): Promise<ApiKeyPublic[]> {
    throw new Error("not implemented");
  }

  revoke(_user: AuthenticatedUser, _id: string): Promise<void> {
    throw new Error("not implemented");
  }

  verify(): Promise<{ ok: boolean }> {
    throw new Error("not implemented");
  }
}
