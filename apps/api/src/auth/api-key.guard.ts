import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";

import type { ApiKeyService } from "./api-key.service.js";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user: unknown;
    }>();
    const plain = req.headers["x-api-key"];
    if (!plain) throw new UnauthorizedException("API key required");

    const key = await this.apiKeyService.verifyKey(plain);
    if (!key) throw new UnauthorizedException("Invalid or revoked API key");

    req.user = { sub: key.id, role: "user", orgId: key.orgId, orgRole: null };
    return true;
  }
}
