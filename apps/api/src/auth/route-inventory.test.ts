import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { ORG_ROLES_KEY } from "@repo/nestjs-auth";
import { describe, expect, it } from "vitest";

import { AccountController } from "./account.controller.js";
import { AuthController } from "./auth.controller.js";
import { EmailChangeController } from "./email-change.controller.js";
import { MfaController } from "./mfa.controller.js";
import { OAuthController } from "./oauth.controller.js";
import { OrgController } from "./org.controller.js";
import { PasskeyController } from "./passkey.controller.js";
import { ProviderMeController } from "./provider-me.controller.js";
import { ProviderOrgController } from "./provider-org.controller.js";
import { SessionController } from "./session.controller.js";

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
      // 선언 순서 보존(정렬 금지) — 가드 실행 순서 회귀를 탐지 (Wd, spec-25-01).
      const guardNames = guards
        .map((g) => (typeof g === "function" ? g.name : (g as object)?.constructor?.name))
        .join(",");
      // @OrgRoles 메타도 포함 — OrgRolesGuard 는 메타 없으면 fail-open 이라 데코 누락 회귀를 가드.
      const orgRoles = Reflect.getMetadata(ORG_ROLES_KEY, handler) as string[] | undefined;
      const rolesSig = orgRoles ? ` @roles(${[...orgRoles].sort().join(",")})` : "";
      return [`${RequestMethod[method]} /${prefix}/${path} [${guardNames}]${rolesSig}`];
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
  "POST /auth/org/invite [AuthGuard,OrgRolesGuard] @roles(admin,owner)",
  "POST /auth/org/invite/accept [AuthGuard]",
  "POST /auth/org/switch [AuthGuard]",
  "POST /auth/password/reset [CsrfGuard]",
  "POST /auth/password/reset/confirm [CsrfGuard]",
  "POST /auth/refresh [CsrfGuard]",
  "POST /auth/signin [CsrfGuard]",
  "POST /auth/signout [CsrfGuard]",
  "POST /auth/signup [CsrfGuard]",
].sort();

/** 분할 진행에 따라 컨트롤러를 추가한다. */
const AUTH_CONTROLLERS: Ctor[] = [AuthController, SessionController, OrgController];

describe("auth 라우트 인벤토리 (분할 회귀 가드)", () => {
  it("auth 컨트롤러들의 라우트 합집합 == 17 스냅샷 (URL 보존)", () => {
    const actual = AUTH_CONTROLLERS.flatMap(routesOf).sort();
    expect(actual).toEqual(EXPECTED_AUTH_ROUTES);
  });
});

/**
 * 나머지 인증 컨트롤러(account/email-change/passkey/mfa/oauth/provider-org/provider-me)의 라우트+가드 스냅샷.
 * spec-24-03 의 account.controller 분할 후에도 URL·가드 계약이 보존됨을 검증한다 (안전망 spec-24-01).
 */
const EXPECTED_OTHER_ROUTES = [
  // account.controller (password/profile/delete/avatar — AccountService)
  "DELETE /auth/account// [AuthGuard,CsrfGuard]", // @Delete() 빈 경로 → 리플렉션상 `//` (라우팅 시 collapse)
  "PATCH /auth/account/password [AuthGuard]",
  "PATCH /auth/account/profile [AuthGuard]",
  "POST /auth/account/avatar [AuthGuard]",
  // email-change.controller (spec-24-03 분할 — EmailChangeService, prefix 동일)
  "POST /auth/account/email/change-confirm [CsrfGuard]",
  "POST /auth/account/email/change-request [AuthGuard,CsrfGuard]",
  // passkey.controller
  "POST /auth/passkey/authenticate/options [CsrfGuard]",
  "POST /auth/passkey/authenticate/verify [CsrfGuard]",
  "POST /auth/passkey/register/options [AuthGuard,CsrfGuard]",
  "POST /auth/passkey/register/verify [AuthGuard,CsrfGuard]",
  // mfa.controller
  "POST /auth/mfa/totp/disable [AuthGuard,CsrfGuard]",
  "POST /auth/mfa/totp/enroll [AuthGuard,CsrfGuard]",
  "POST /auth/mfa/totp/enroll/confirm [AuthGuard,CsrfGuard]",
  "POST /auth/mfa/totp/verify [CsrfGuard]",
  // oauth.controller (가드 없음 — state/pkce 쿠키 + provider 검증으로 보호)
  "GET /auth/oauth/:provider []",
  "GET /auth/oauth/:provider/callback []",
  // provider-org.controller (provider 모드 org 표면)
  "GET /auth/org/members [AuthGuard]",
  "GET /auth/orgs [AuthGuard]",
  "POST /auth/org/invite [AuthGuard]",
  "POST /auth/org/invite/accept [AuthGuard]",
  "POST /auth/org/switch [AuthGuard]",
  // provider-me.controller
  "GET /auth/me [AuthGuard]",
].sort();

const OTHER_CONTROLLERS: Ctor[] = [
  AccountController,
  EmailChangeController,
  PasskeyController,
  MfaController,
  OAuthController,
  ProviderOrgController,
  ProviderMeController,
];

describe("기타 인증 컨트롤러 라우트 인벤토리 (분할 회귀 가드)", () => {
  it("account/passkey/mfa/oauth/provider-org/provider-me 라우트+가드 스냅샷", () => {
    const actual = OTHER_CONTROLLERS.flatMap(routesOf).sort();
    expect(actual).toEqual(EXPECTED_OTHER_ROUTES);
  });
});
