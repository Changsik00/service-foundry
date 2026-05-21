import { Module } from "@nestjs/common";

import { JwksController } from "./jwks.controller.js";
import { JwtService } from "./jwt.service.js";

@Module({
  providers: [JwtService],
  controllers: [JwksController],
  exports: [JwtService],
})
export class JwtModule {}
