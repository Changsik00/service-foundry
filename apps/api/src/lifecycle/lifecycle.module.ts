import { Global, Module } from "@nestjs/common";

import { LIFECYCLE, lifecycleProvider } from "./lifecycle.provider.js";

/** @Global — LIFECYCLE 를 health controller + main 부트에서 공유. */
@Global()
@Module({
  providers: [lifecycleProvider],
  exports: [LIFECYCLE],
})
export class LifecycleModule {}
