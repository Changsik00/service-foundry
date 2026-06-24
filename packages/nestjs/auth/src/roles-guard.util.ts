import { type ExecutionContext, ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import type { AuthenticatedUser } from "./auth.guard.js";

/**
 * RolesGuard·OrgRolesGuard 공통 로직 (D6, spec-25-02).
 *
 * 메타(metaKey)에 요구 role 이 없으면 통과(fail-open — 데코 없는 라우트), 있으면 req.user 의
 * 해당 role(`pick`)이 포함돼야 통과. 미포함/없음 → Forbidden. 클래스 팩토리 대신 공유 *함수* 로
 * 둔 이유: 각 Guard 를 명명 클래스로 유지해 DI 메타데이터(@Inject 없이 Reflector 주입)와
 * 클래스명(route-inventory 가드 스냅샷)을 보존하기 위함.
 */
export function checkRoles<T extends string>(
  ctx: ExecutionContext,
  reflector: Reflector,
  metaKey: string,
  pick: (user: AuthenticatedUser) => T | null | undefined,
  message: string,
): boolean {
  const roles = reflector.getAllAndOverride<T[] | undefined>(metaKey, [
    ctx.getHandler(),
    ctx.getClass(),
  ]);

  if (!roles || roles.length === 0) return true;

  const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  const role = req.user ? pick(req.user) : null;
  if (!role || !roles.includes(role)) {
    throw new ForbiddenException(message);
  }
  return true;
}
