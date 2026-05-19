import { describe, expect, it } from "vitest";

import { HTTP_CLIENT, HttpClientModule } from "./index.js";

describe("HttpClientModule", () => {
  it("forRoot(options) → DynamicModule 구조 + HTTP_CLIENT provider", () => {
    const mod = HttpClientModule.forRoot({ baseUrl: "https://api.example.com" });
    expect(mod.module).toBe(HttpClientModule);
    expect(mod.global).toBe(true);
    expect(Array.isArray(mod.providers)).toBe(true);
    expect(Array.isArray(mod.exports)).toBe(true);

    const providers = mod.providers ?? [];
    // biome-ignore lint/suspicious/noExplicitAny: NestJS Provider union narrowing — test 검증용
    const providerTokens = providers.map((p: any) => p.provide);
    expect(providerTokens).toContain(HTTP_CLIENT);
    expect(mod.exports).toContain(HTTP_CLIENT);

    // biome-ignore lint/suspicious/noExplicitAny: NestJS Provider union narrowing — test 검증용
    const httpClientProvider = providers.find((p: any) => p.provide === HTTP_CLIENT) as
      | { provide: symbol; useValue: unknown }
      | undefined;
    expect(httpClientProvider).toBeDefined();
    expect(typeof httpClientProvider?.useValue).toBe("object");
  });
});
