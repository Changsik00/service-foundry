import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { FEATURE_FLAG_KEY } from "./feature-flag.decorator.js";
import type { FeatureFlagService } from "./feature-flag.service.js";

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.get<string | undefined>(FEATURE_FLAG_KEY, context.getHandler());
    if (!key) return true;
    const enabled = await this.featureFlagService.isEnabled(key);
    if (!enabled) throw new ForbiddenException("Feature flag disabled");
    return true;
  }
}
