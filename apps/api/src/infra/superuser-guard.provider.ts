import { Inject, Injectable, type OnApplicationBootstrap } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { sql } from "drizzle-orm";

/**
 * 부팅 시 런타임 DB role 이 슈퍼유저면 production 기동을 거부한다 (spec-x-tenant-isolation-hardening, W-5).
 *
 * 슈퍼유저(또는 BYPASSRLS)는 RLS 를 우회하므로 테넌트 격리가 조용히 무력화된다. settings.ts 의
 * username 휴리스틱(`postgres`)과 달리 **DB 사실(`pg_roles.rolsuper`)** 로 정확히 판정한다.
 */
@Injectable()
export class SuperuserGuard implements OnApplicationBootstrap {
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV !== "production") return;

    const result = (await this.database.db.execute(
      sql`SELECT rolsuper FROM pg_roles WHERE rolname = current_user`,
    )) as unknown as { rows: Array<{ rolsuper: boolean }> };
    const isSuperuser = result.rows[0]?.rolsuper === true;

    if (isSuperuser) {
      throw new Error(
        "production 기동 거부: 런타임 DB role 이 슈퍼유저입니다. RLS 테넌트 격리가 우회됩니다. 비-슈퍼유저 role(app_runtime 등)을 사용하세요.",
      );
    }
  }
}
