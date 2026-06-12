import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Lifecycle } from "@repo/backend-lifecycle";

import { LIFECYCLE } from "../lifecycle/lifecycle.provider.js";

@ApiTags("health")
@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(@Inject(LIFECYCLE) private readonly lifecycle: Lifecycle) {}

  @ApiOperation({ summary: "헬스 체크 — 서버 상태·가동시간·버전 반환" })
  @ApiResponse({ status: 200, description: "서버 정상 동작 중" })
  @Get()
  health(): { status: "ok"; uptime: number; version: string } {
    return {
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "0.0.0",
    };
  }

  @ApiOperation({ summary: "Liveness probe — 프로세스 생존 여부" })
  @ApiResponse({ status: 200, description: "프로세스 정상" })
  @Get("live")
  live(): { status: "live" } {
    return { status: "live" };
  }

  @ApiOperation({ summary: "Readiness probe — 트래픽 수신 가능 여부" })
  @ApiResponse({ status: 200, description: "트래픽 수신 가능" })
  @ApiResponse({ status: 503, description: "종료 드레인 중 (not_ready)" })
  @Get("ready")
  ready(): { status: "ready" } {
    if (!this.lifecycle.isReady()) {
      throw new ServiceUnavailableException({ status: "not_ready" });
    }
    return { status: "ready" };
  }
}
