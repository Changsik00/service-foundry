import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

import type { ApiKeyService } from "./api-key.service.js";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {
    void this.apiKeyService;
  }

  canActivate(_ctx: ExecutionContext): Promise<boolean> {
    throw new Error("not implemented");
  }
}
