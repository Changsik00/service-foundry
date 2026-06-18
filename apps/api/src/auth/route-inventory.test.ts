import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { AuthController } from "./auth.controller.js";

// NestJS 가 메타데이터를 거는 키 (PATH/METHOD/GUARDS_METADATA 의 값).
// `@nestjs/common/constants` 서브패스는 타입 미노출이라 리터럴 사용.
const PATH_METADATA = "path";
const METHOD_METADATA = "method";
const GUARDS_METADATA = "__guards__";

type Ctor = new (...args: never[]) => object;

/**
 * 컨트롤러 클래스에서 `METHOD /prefix/path [Guard,...]` 라우트 목록을 리플렉션으로 추출 (DB 불필요).
 * 가드까지 포함해 분할 시 URL **과 가드 조합**까지 보존됨을 검증한다.
 */
function routesOf(ctrl: Ctor): string[] {
  const prefix = (Reflect.getMetadata(PATH_METADATA, ctrl) as string) ?? "";
  const proto = ctrl.prototype as Record<string, unknown>;
  return Object.getOwnPropertyNames(proto)
    .filter((n) => n !== "constructor")
    .flatMap((n) => {
      const handler = proto[n] as object;
      const path = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
      if (path === undefined) return [];
      const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod;
      const guards = (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined) ?? [];
      const guardNames = guards
        .map((g) => (typeof g === "function" ? g.name : (g as object)?.constructor?.name))
        .sort()
        .join(",");
      return [`${RequestMethod[method]} /${prefix}/${path} [${guardNames}]`];
    });
}

/** auth.controller 분할 후에도 보존되어야 하는 전체 라우트+가드 스냅샷 (URL·가드 불변 계약). */
const EXPECTED_AUTH_ROUTES = [
  "DELETE /auth/sessions [AuthGuard,CsrfGuard]",
  "DELETE /auth/sessions/:id [AuthGuard,CsrfGuard]",
  "GET /auth/csrf []",
  "GET /auth/me [AuthGuard]",
  "GET /auth/org/members [AuthGuard]",
  "GET /auth/sessions [AuthGuard]",
  "POST /auth/email/verify/confirm [CsrfGuard]",
  "POST /auth/email/verify/request [CsrfGuard]",
  "POST /auth/org/invite [AuthGuard,OrgRolesGuard]",
  "POST /auth/org/invite/accept [AuthGuard]",
  "POST /auth/org/switch [AuthGuard]",
  "POST /auth/password/reset [CsrfGuard]",
  "POST /auth/password/reset/confirm [CsrfGuard]",
  "POST /auth/refresh [CsrfGuard]",
  "POST /auth/signin [CsrfGuard]",
  "POST /auth/signout [CsrfGuard]",
  "POST /auth/signup [CsrfGuard]",
].sort();

/** 분할 진행에 따라 컨트롤러를 추가한다 (현재: AuthController 단독). */
const AUTH_CONTROLLERS: Ctor[] = [AuthController];

describe("auth 라우트 인벤토리 (분할 회귀 가드)", () => {
  it("auth 컨트롤러들의 라우트 합집합 == 17 스냅샷 (URL 보존)", () => {
    const actual = AUTH_CONTROLLERS.flatMap(routesOf).sort();
    expect(actual).toEqual(EXPECTED_AUTH_ROUTES);
  });
});
