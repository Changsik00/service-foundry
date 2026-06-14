import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "@repo/nestjs-auth";

import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";

@Module({
  controllers: [AdminController],
  providers: [AdminService, RolesGuard, Reflector],
})
export class AdminModule {}
