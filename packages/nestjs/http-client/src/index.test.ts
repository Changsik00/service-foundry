import { describe, expect, it } from "vitest";

import { HTTP_CLIENT, HttpClientModule } from "./index.js";

describe("HttpClientModule", () => {
  it("forRoot(options) → DynamicModule 구조 + HTTP_CLIENT provider", () => {
    const mod = HttpClientModule.forRoot({ baseUrl: "https://api.example.com" });
    expect(mod.module).toBe(HttpClientModule);
    expect(mod.global).toBe(true);
    expect(Array.isArray(mod.providers)).toBe(true);
    expect(Array.isArray(mod.exports)).toBe(true);

    const providerTokens = mod.providers.map((p) => p.provide);
    expect(providerTokens).toContain(HTTP_CLIENT);
    expect(mod.exports).toContain(HTTP_CLIENT);

    const httpClientProvider = mod.providers.find((p) => p.provide === HTTP_CLIENT);
    expect(httpClientProvider).toBeDefined();
    expect(typeof httpClientProvider?.useValue).toBe("object");
  });
});
