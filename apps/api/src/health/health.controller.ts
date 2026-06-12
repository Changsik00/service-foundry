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

  @ApiOperation({
    summary: "헬스 체크",
    description: "서버 상태·가동시간·버전을 반환합니다. 모니터링 대시보드용.",
  })
  @ApiResponse({
    status: 200,
    description: "서버 정상 동작 중",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok"], example: "ok" },
        uptime: { type: "number", description: "프로세스 가동 시간 (초)", example: 3600 },
        version: { type: "string", description: "npm_package_version", example: "0.0.0" },
      },
      required: ["status", "uptime", "version"],
    },
  })
  @Get()
  health(): { status: "ok"; uptime: number; version: string } {
    return {
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "0.0.0",
    };
  }

  @ApiOperation({
    summary: "Liveness probe",
    description: "프로세스가 살아있는지 확인합니다. 죽으면 컨테이너 런타임이 재시작합니다.",
  })
  @ApiResponse({
    status: 200,
    description: "프로세스 정상",
    schema: {
      type: "object",
      properties: { status: { type: "string", enum: ["live"], example: "live" } },
      required: ["status"],
    },
  })
  @Get("live")
  live(): { status: "live" } {
    return { status: "live" };
  }

  @ApiOperation({
    summary: "Readiness probe",
    description:
      "트래픽을 받을 준비가 됐는지 확인합니다. 503이면 로드밸런서가 해당 인스턴스를 제외합니다.",
  })
  @ApiResponse({
    status: 200,
    description: "트래픽 수신 가능",
    schema: {
      type: "object",
      properties: { status: { type: "string", enum: ["ready"], example: "ready" } },
      required: ["status"],
    },
  })
  @ApiResponse({
    status: 503,
    description: "종료 드레인 중 — 새 트래픽 차단",
    schema: {
      type: "object",
      properties: { status: { type: "string", enum: ["not_ready"], example: "not_ready" } },
    },
  })
  @Get("ready")
  ready(): { status: "ready" } {
    if (!this.lifecycle.isReady()) {
      throw new ServiceUnavailableException({ status: "not_ready" });
    }
    return { status: "ready" };
  }
}
