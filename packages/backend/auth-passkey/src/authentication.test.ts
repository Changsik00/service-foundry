import { describe, expect, it } from "vitest";

import { generateAuthenticationOpts } from "./authentication.js";

describe("generateAuthenticationOpts", () => {
  const config = { rpID: "localhost", rpName: "Test App", origin: "http://localhost:3000" };

  it("반환값에 challenge 필드가 있다", async () => {
    const opts = await generateAuthenticationOpts(config);
    expect(opts).toHaveProperty("challenge");
    expect(typeof opts.challenge).toBe("string");
    expect(opts.challenge.length).toBeGreaterThan(0);
  });

  it("rpId가 설정값과 일치한다", async () => {
    const opts = await generateAuthenticationOpts(config);
    expect(opts.rpId).toBe(config.rpID);
  });

  it("allowCredentials를 전달하면 포함된다", async () => {
    const creds = [{ id: "cred-xyz", transports: [] }];
    const opts = await generateAuthenticationOpts(config, creds);
    expect(opts.allowCredentials).toHaveLength(1);
  });
});
