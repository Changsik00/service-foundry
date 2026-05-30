/**
 * 앱 생성 파일 콘텐츠 빌더 (순수 함수).
 *
 * api 는 *최소 NestJS*(health + settings + logger) — auth/db 미포함 (범용 scaffold).
 * next/vite 는 부팅 가능한 최소 구조. 콘텐츠 정합성은 통합 스모크(api)가 검증.
 */

import type { AppTarget, AppType } from "./resolve-app-target.js";

const json = (obj: unknown): string => `${JSON.stringify(obj, null, 2)}\n`;

interface GeneratedFile {
  path: string;
  content: string;
}

// ─── api (minimal NestJS) ──────────────────────────────────────────────
const apiFiles = (t: AppTarget): GeneratedFile[] => {
  const pkg = json({
    name: t.pkgName,
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: `tsx watch --env-file-if-exists=.env --tsconfig ../../tsconfig.json src/main.ts`,
      start: `tsx --env-file-if-exists=.env --tsconfig ../../tsconfig.json src/main.ts`,
      lint: "biome check .",
      typecheck: "tsc --noEmit",
      test: "vitest run",
    },
    dependencies: {
      "@nestjs/common": "catalog:",
      "@nestjs/core": "catalog:",
      "@nestjs/platform-express": "catalog:",
      "@repo/backend-settings": "workspace:*",
      "@repo/nestjs-logger": "workspace:*",
      "@repo/nestjs-settings": "workspace:*",
      "reflect-metadata": "catalog:",
      rxjs: "catalog:",
      zod: "catalog:",
    },
    devDependencies: {
      "@biomejs/biome": "catalog:",
      "@nestjs/testing": "catalog:",
      "@repo/biome-config": "workspace:*",
      "@repo/typescript-config": "workspace:*",
      "@repo/vitest-config": "workspace:*",
      "@types/node": "catalog:",
      tsx: "catalog:",
      typescript: "catalog:",
      vitest: "catalog:",
    },
  });

  const settings = `import { BaseBackendSchema } from "@repo/backend-settings";
import { z } from "zod";

const AppSettingsSchema = BaseBackendSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(${t.port}),
});

export type AppSettings = z.output<typeof AppSettingsSchema>;

export const loadSettings = (env: NodeJS.ProcessEnv): AppSettings =>
  AppSettingsSchema.parse(env);
`;

  const main = `import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { PinoLoggerService } from "@repo/nestjs-logger";

import { AppModule } from "./app.module.js";
import { loadSettings } from "./settings.js";

async function bootstrap(): Promise<void> {
  const settings = loadSettings(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);
  await app.listen(settings.PORT);
  logger.log(\`🚀 ${t.pkgName} listening on \${await app.getUrl()}\`, "Bootstrap");
}

bootstrap();
`;

  const appModule = `import { Module } from "@nestjs/common";
import { BackendLoggerModule } from "@repo/nestjs-logger";
import { BackendSettingsModule } from "@repo/nestjs-settings";

import { HealthController } from "./health/health.controller.js";
import { loadSettings } from "./settings.js";

const settings = loadSettings(process.env);

@Module({
  imports: [
    BackendSettingsModule.forRoot(loadSettings),
    BackendLoggerModule.forRoot({ level: settings.LOG_LEVEL }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
`;

  const health = `import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: "ok" };
  }
}
`;

  const healthTest = `import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("health 는 ok 를 반환한다", () => {
    expect(new HealthController().check()).toEqual({ status: "ok" });
  });
});
`;

  return [
    { path: "package.json", content: pkg },
    {
      path: "tsconfig.json",
      content: json({ extends: t.tsconfigExtends, include: ["src/**/*.ts"] }),
    },
    { path: "vitest.config.ts", content: `export { default } from "@repo/vitest-config/node";\n` },
    { path: "src/main.ts", content: main },
    { path: "src/app.module.ts", content: appModule },
    { path: "src/settings.ts", content: settings },
    { path: "src/health/health.controller.ts", content: health },
    { path: "src/health/health.controller.test.ts", content: healthTest },
  ];
};

// ─── next (minimal App Router) ─────────────────────────────────────────
const nextFiles = (t: AppTarget): GeneratedFile[] => {
  const pkg = json({
    name: t.pkgName,
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: `next dev --port ${t.port}`,
      build: "next build",
      start: `next start --port ${t.port}`,
      lint: "biome check .",
      typecheck: "tsc --noEmit",
      test: "vitest run",
    },
    dependencies: { next: "catalog:", react: "catalog:", "react-dom": "catalog:", zod: "catalog:" },
    devDependencies: {
      "@biomejs/biome": "catalog:",
      "@repo/biome-config": "workspace:*",
      "@repo/typescript-config": "workspace:*",
      "@repo/vitest-config": "workspace:*",
      "@types/node": "catalog:",
      "@types/react": "catalog:",
      "@types/react-dom": "catalog:",
      "@vitejs/plugin-react": "catalog:",
      jsdom: "catalog:",
      typescript: "catalog:",
      vitest: "catalog:",
    },
  });
  return [
    { path: "package.json", content: pkg },
    {
      path: "tsconfig.json",
      content: json({ extends: t.tsconfigExtends, include: ["src/**/*.ts", "src/**/*.tsx"] }),
    },
    { path: "vitest.config.ts", content: `export { default } from "@repo/vitest-config/react";\n` },
    {
      path: "next.config.js",
      content: `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true };\nexport default nextConfig;\n`,
    },
    {
      path: "src/app/layout.tsx",
      content: `export const metadata = { title: "${t.pkgName}" };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`,
    },
    {
      path: "src/app/page.tsx",
      content: `export default function Home() {\n  return <main>${t.pkgName} — service-foundry</main>;\n}\n`,
    },
  ];
};

// ─── vite (minimal React SPA) ──────────────────────────────────────────
const viteFiles = (t: AppTarget): GeneratedFile[] => {
  const pkg = json({
    name: t.pkgName,
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: `vite --port ${t.port}`,
      build: "vite build",
      preview: `vite preview --port ${t.port}`,
      lint: "biome check .",
      typecheck: "tsc --noEmit",
      test: "vitest run",
    },
    dependencies: { react: "catalog:", "react-dom": "catalog:", zod: "catalog:" },
    devDependencies: {
      "@biomejs/biome": "catalog:",
      "@repo/biome-config": "workspace:*",
      "@repo/typescript-config": "workspace:*",
      "@repo/vitest-config": "workspace:*",
      "@types/node": "catalog:",
      "@types/react": "catalog:",
      "@types/react-dom": "catalog:",
      "@vitejs/plugin-react": "catalog:",
      jsdom: "catalog:",
      typescript: "catalog:",
      vite: "catalog:",
      vitest: "catalog:",
    },
  });
  return [
    { path: "package.json", content: pkg },
    {
      path: "tsconfig.json",
      content: json({ extends: t.tsconfigExtends, include: ["src/**/*.ts", "src/**/*.tsx"] }),
    },
    { path: "vitest.config.ts", content: `export { default } from "@repo/vitest-config/react";\n` },
    {
      path: "vite.config.ts",
      content: `import react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: ${t.port} },\n});\n`,
    },
    {
      path: "index.html",
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${t.pkgName}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    },
    {
      path: "src/App.tsx",
      content: `export default function App() {\n  return <main>${t.pkgName} — service-foundry</main>;\n}\n`,
    },
    {
      path: "src/main.tsx",
      content: `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.js";\n\nconst el = document.getElementById("root");\nif (el) {\n  createRoot(el).render(\n    <StrictMode>\n      <App />\n    </StrictMode>,\n  );\n}\n`,
    },
  ];
};

export function buildAppFiles(target: AppTarget): GeneratedFile[] {
  const byType: Record<AppType, (t: AppTarget) => GeneratedFile[]> = {
    api: apiFiles,
    next: nextFiles,
    vite: viteFiles,
  };
  return byType[target.type](target);
}

export type { GeneratedFile };
