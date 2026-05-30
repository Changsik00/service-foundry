/**
 * 앱 타입 → 생성 타깃 매핑 (순수 함수).
 *
 * `pnpm new app` (turbo gen `app`) 가 쓰는 규칙: 디렉토리·`@apps/*` 네이밍·
 * tsconfig extends 프리셋. scripts/deps 등 타입별 콘텐츠는 app-templates.ts.
 */

export type AppType = "api" | "next" | "vite";

export const APP_TYPES: readonly AppType[] = ["api", "next", "vite"];

export interface AppTarget {
  dir: string;
  pkgName: string;
  type: AppType;
  port: number;
  tsconfigExtends: string;
}

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TS_NESTJS = "@repo/typescript-config/nestjs";
const TS_REACT = "@repo/typescript-config/react-app";

export function resolveAppTarget(type: AppType, name: string, port: number): AppTarget {
  if (!APP_TYPES.includes(type)) {
    throw new Error(`unknown app type: ${type} (allowed: ${APP_TYPES.join(", ")})`);
  }
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`invalid name: "${name}" — kebab-case 소문자만 허용 (예: my-app)`);
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid port: ${port} — 1~65535 정수`);
  }

  return {
    dir: `apps/${name}`,
    pkgName: `@apps/${name}`,
    type,
    port,
    tsconfigExtends: type === "api" ? TS_NESTJS : TS_REACT,
  };
}
