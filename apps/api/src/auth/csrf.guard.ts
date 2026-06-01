/**
 * CsrfGuard — double-submit CSRF 검증 (spec-15-02).
 *
 * `csrf_id` 쿠키 + `X-Csrf-Token` 헤더를 `verifyCsrfToken(secret, csrf_id, header)` 로 검증.
 * 쿠키/헤더 부재·불일치는 모두 403. 보안 로직은 `@repo/backend-auth-rate-limit` 재사용.
 */

import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { verifyCsrfToken } from "@repo/backend-auth-rate-limit";
import type { Request } from "express";
import { readCsrfId } from "./csrf.cookie.js";

/** CsrfGuard 에 주입되는 CSRF secret DI 토큰. (settings.CSRF_SECRET 값) */
export const CSRF_SECRET = Symbol("CSRF_SECRET");

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(@Inject(CSRF_SECRET) private readonly secret: string) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const csrfId = readCsrfId(req);
    const raw = req.headers["x-csrf-token"];
    const presented = Array.isArray(raw) ? raw[0] : raw;

    if (!csrfId || !presented || !verifyCsrfToken(this.secret, csrfId, presented)) {
      throw new ForbiddenException("CSRF 토큰 검증 실패");
    }
    return true;
  }
}
