import { createLifecycle, type Lifecycle } from "@repo/backend-lifecycle";

/** @Inject 토큰 — health controller(readiness) + main(shutdown) 가 공유. */
export const LIFECYCLE = Symbol("LIFECYCLE");

export const lifecycleProvider = {
  provide: LIFECYCLE,
  useFactory: (): Lifecycle => createLifecycle(),
};
