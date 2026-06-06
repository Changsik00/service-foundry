import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { Observable } from "rxjs";

import { TENANT_ALS, type TenantAls } from "./tenant.js";

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(@Inject(TENANT_ALS) private readonly als: TenantAls) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const orgId = req.user?.orgId ?? null;

    return new Observable((subscriber) => {
      this.als.run({ orgId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
