import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { AuthenticatedUser } from "@repo/nestjs-auth";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { sql } from "drizzle-orm";
import { defaultIfEmpty, from, lastValueFrom, Observable } from "rxjs";

import { TENANT_ALS, type TenantAls } from "./tenant.js";

/**
 * 요청의 org 컨텍스트를 DB 에 주입한다 (spec-17-07).
 *
 * - `user.orgId` 있으면: 요청을 트랜잭션으로 감싸 `SET LOCAL app.current_org` 발행 →
 *   ALS 에 tx 바인딩 → DATABASE proxy 가 모든 쿼리를 그 tx 로 라우팅 → RLS 격리 적용.
 *   tx-local 이므로 응답 후 자동 해제(커넥션 풀 오염 없음).
 * - orgId 없으면(미인증/부트스트랩): tx 없이 ALS 만 설정 → context NULL → 퍼미시브(기존 동작).
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    @Inject(TENANT_ALS) private readonly als: TenantAls,
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const orgId = req.user?.orgId ?? null;

    if (!orgId) {
      return new Observable((subscriber) => {
        this.als.run({ orgId: null }, () => next.handle().subscribe(subscriber));
      });
    }

    // orgId 있으면 요청 전체를 트랜잭션 안에서 실행 — set_config 는 tx-local.
    return from(
      this.database.db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.current_org', ${orgId}, true)`);
        return this.als.run({ orgId, tx }, () =>
          lastValueFrom(next.handle().pipe(defaultIfEmpty(undefined))),
        );
      }),
    );
  }
}
