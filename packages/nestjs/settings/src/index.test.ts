import { defineSettings } from "@repo/backend-settings";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { BACKEND_SETTINGS, BackendSettingsModule } from "./index.js";

describe("BackendSettingsModule", () => {
  const sampleLoader = defineSettings({
    envSchema: z.object({
      APP_ENV: z.enum(["local", "prod"]).default("local"),
    }),
    envKey: "APP_ENV",
    defaults: { region: "us-east-1" },
    perEnv: {
      local: { region: "us-east-1" },
      prod: { region: "us-west-2" },
    },
    build: (_env, layered) => ({ region: layered.region }),
  });

  it("forRoot(loader, env) 호출 시 DynamicModule 구조를 반환한다", () => {
    const mod = BackendSettingsModule.forRoot(sampleLoader, { APP_ENV: "prod" });
    expect(mod.module).toBe(BackendSettingsModule);
    expect(mod.global).toBe(true);
    expect(mod.providers).toBeDefined();
    expect(mod.exports).toEqual([BACKEND_SETTINGS]);
  });

  it("BACKEND_SETTINGS provider value가 loader 결과와 일치한다", () => {
    const mod = BackendSettingsModule.forRoot(sampleLoader, { APP_ENV: "prod" });
    const provider = mod.providers?.find(
      (p): p is { provide: symbol; useValue: { region: string } } =>
        typeof p === "object" && p !== null && "provide" in p && p.provide === BACKEND_SETTINGS,
    );
    expect(provider).toBeDefined();
    expect(provider?.useValue.region).toBe("us-west-2");
  });
});
