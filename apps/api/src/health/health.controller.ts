import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

@Controller("health")
@SkipThrottle()
export class HealthController {
  @Get()
  health(): { status: "ok"; uptime: number; version: string } {
    return {
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "0.0.0",
    };
  }
}
