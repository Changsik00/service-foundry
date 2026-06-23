import {
  type CallHandler,
  type ExecutionContext,
  Global,
  Inject,
  Injectable,
  Module,
  type NestInterceptor,
} from "@nestjs/common";
import { TENANT_ALS, TenantAls } from "@repo/backend-tenant";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { sql } from "drizzle-orm";
import { defaultIfEmpty, from, lastValueFrom, Observable } from "rxjs";

/**
 * 요청의 org 컨텍스트를 DB 에 주입한다 (spec-17-07, 패키지 이관 spec-24-05).
 *
 * - `user.orgId` 있으면: 요청을 트랜잭션으로 감싸 `SET LOCAL app.current_org` 발행 →
 *   ALS 에 tx 바인딩 → DATABASE proxy 가 모든 쿼리를 그 tx 로 라우팅 → RLS 격리 적용.
 *   tx-local 이므로 응답 후 자동 해제(커넥션 풀 오염 없음).
 * - **인증됐는데 orgId 없음**: 불가능 컨텍스트(nil-uuid)로 tx → RLS 가 모든 org-scoped 행 차단
 *   (**fail-closed**, spec-x-null-org-isolation-failclose). 정당한 cross-org/무-org 흐름은
 *   `runWithSystemTenant` 로 system 컨텍스트를 명시 토글하므로 영향 없음.
 * - **미인증(req.user 없음)**: tx 없이 ALS NULL → 퍼미시브 (signup·csrf 등 bootstrap 에 필요).
 *
 * 요청 user 형태는 `{ orgId?: string | null }` 만 의존(인라인) — nestjs-auth 비의존.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  /** 어떤 org 와도 매칭 안 되는 컨텍스트 — 인증-무org 요청을 RLS 로 fail-close. */
  private static readonly FAIL_CLOSED_ORG = "00000000-0000-0000-0000-000000000000";

  constructor(
    @Inject(TENANT_ALS) private readonly als: TenantAls,
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: { orgId?: string | null } }>();
    // 인증(req.user 존재)인데 org 없음 → 불가능 컨텍스트(fail-closed). 미인증 → null(permissive).
    const orgId = req.user ? (req.user.orgId ?? TenantContextInterceptor.FAIL_CLOSED_ORG) : null;

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

/**
 * 요청 스코프 테넌트 컨텍스트(ALS)의 **공유 단일 인스턴스**.
 *
 * DATABASE proxy(wrapDb)·TenantContextInterceptor·org 서비스(invite accept 의 시스템 컨텍스트)가
 * 모두 *같은* 인스턴스를 써야 컨텍스트가 일관되므로 모듈 레벨 싱글톤으로 둔다.
 */
export const tenantAls = new TenantAls();

@Global()
@Module({
  providers: [{ provide: TENANT_ALS, useValue: tenantAls }],
  exports: [TENANT_ALS],
})
export class TenantModule {}
