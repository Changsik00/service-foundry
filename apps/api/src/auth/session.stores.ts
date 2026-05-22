import { Inject } from "@nestjs/common";
import { drizzleSessionStore, type SessionStore, type sessions } from "@repo/backend-auth-session";
import type { NodePgDatabase } from "@repo/nestjs-database";

export const SESSION_STORE = Symbol("SESSION_STORE");
export const InjectSessionStore = () => Inject(SESSION_STORE);
export type { SessionStore };

type AnyDb = NodePgDatabase<Record<string, unknown>>;

export function createDrizzleSessionStore(db: AnyDb): SessionStore {
  return drizzleSessionStore(db as NodePgDatabase<{ sessions: typeof sessions }>);
}
