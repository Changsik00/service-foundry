import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { AuthController } from "./auth.controller.js";

// NestJS 가 라우트 메타데이터를 거는 키 (PATH_METADATA / METHOD_METADATA 의 값).
// `@nestjs/common/constants` 서브패스는 타입 미노출이라 리터럴 사용.
const PATH_METADATA = "path";
const METHOD_METADATA = "method";

type Ctor = new (...args: never[]) => object;

/** 컨트롤러 클래스에서 (METHOD /prefix/path) 라우트 목록을 리플렉션으로 추출 (DB 불필요). */
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
      return [`${RequestMethod[method]} /${prefix}/${path}`];
    });
}

/** auth.controller 분할 후에도 보존되어야 하는 전체 라우트 스냅샷 (URL 불변 계약). */
const EXPECTED_AUTH_ROUTES = [
  "GET /auth/csrf",
  "GET /auth/me",
  "GET /auth/org/members",
  "GET /auth/sessions",
  "POST /auth/signin",
  "POST /auth/signup",
  "POST /auth/signout",
  "POST /auth/refresh",
  "POST /auth/password/reset",
  "POST /auth/password/reset/confirm",
  "POST /auth/email/verify/request",
  "POST /auth/email/verify/confirm",
  "POST /auth/org/switch",
  "POST /auth/org/invite",
  "POST /auth/org/invite/accept",
  "DELETE /auth/sessions/:id",
  "DELETE /auth/sessions",
].sort();

/** 분할 진행에 따라 컨트롤러를 추가한다 (현재: AuthController 단독). */
const AUTH_CONTROLLERS: Ctor[] = [AuthController];

describe("auth 라우트 인벤토리 (분할 회귀 가드)", () => {
  it("auth 컨트롤러들의 라우트 합집합 == 17 스냅샷 (URL 보존)", () => {
    const actual = AUTH_CONTROLLERS.flatMap(routesOf).sort();
    expect(actual).toEqual(EXPECTED_AUTH_ROUTES);
  });
});
