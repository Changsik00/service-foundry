import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Jwks } from "@repo/backend-auth-jwt";

import type { JwtService } from "./jwt.service.js";

@Controller()
@SkipThrottle()
export class JwksController {
  constructor(private readonly jwtService: JwtService) {}

  @Get(".well-known/jwks.json")
  async jwks(): Promise<Jwks> {
    return this.jwtService.getJwks();
  }
}
