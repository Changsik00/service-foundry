import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Lifecycle } from "@repo/backend-lifecycle";

import { LIFECYCLE } from "../lifecycle/lifecycle.provider.js";

@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(@Inject(LIFECYCLE) private readonly lifecycle: Lifecycle) {}

  @Get()
  health(): { status: "ok"; uptime: number; version: string } {
    return {
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "0.0.0",
    };
  }

  /** liveness — 프로세스가 살아있으면 항상 200. */
  @Get("live")
  live(): { status: "live" } {
    return { status: "live" };
  }

  /** readiness — 트래픽 수신 가능 여부. 종료 드레인 중이면 503. */
  @Get("ready")
  ready(): { status: "ready" } {
    if (!this.lifecycle.isReady()) {
      throw new ServiceUnavailableException({ status: "not_ready" });
    }
    return { status: "ready" };
  }
}
