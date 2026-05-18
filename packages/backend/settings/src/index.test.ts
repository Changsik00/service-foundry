import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineSettings } from "./index.js";

describe("defineSettings (re-export)", () => {
  it("@env-kit/node-settings의 defineSettings를 그대로 노출한다", () => {
    expect(typeof defineSettings).toBe("function");
  });

  it("valid env로 loader를 만들고 build callback의 결과를 반환한다", () => {
    const loader = defineSettings({
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
    const settings = loader({ APP_ENV: "prod" });
    expect(settings.region).toBe("us-west-2");
  });

  it("invalid env를 거부한다", () => {
    const loader = defineSettings({
      envSchema: z.object({
        APP_ENV: z.enum(["local", "prod"]),
      }),
      envKey: "APP_ENV",
      defaults: {},
      perEnv: { local: {}, prod: {} },
      build: () => ({}),
    });
    expect(() => loader({ APP_ENV: "invalid" })).toThrow();
  });
});
