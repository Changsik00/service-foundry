import { describe, expect, it } from "vitest";

import { generateRegistrationOpts } from "./registration.js";

describe("generateRegistrationOpts", () => {
  const config = { rpID: "localhost", rpName: "Test App", origin: "http://localhost:3000" };

  it("반환값에 challenge 필드가 있다", async () => {
    const opts = await generateRegistrationOpts(config, { id: "user-1", email: "test@test.com" });
    expect(opts).toHaveProperty("challenge");
    expect(typeof opts.challenge).toBe("string");
    expect(opts.challenge.length).toBeGreaterThan(0);
  });

  it("rp.id와 rp.name이 설정값과 일치한다", async () => {
    const opts = await generateRegistrationOpts(config, { id: "user-1", email: "test@test.com" });
    expect(opts.rp.id).toBe(config.rpID);
    expect(opts.rp.name).toBe(config.rpName);
  });

  it("user.name이 email로 설정된다", async () => {
    const opts = await generateRegistrationOpts(config, { id: "user-1", email: "bob@example.com" });
    expect(opts.user.name).toBe("bob@example.com");
  });

  it("excludeCredentials를 전달하면 포함된다", async () => {
    const existing = [{ id: "cred-abc", transports: [] }];
    const opts = await generateRegistrationOpts(
      config,
      { id: "user-1", email: "a@b.com" },
      existing,
    );
    expect(opts.excludeCredentials).toHaveLength(1);
  });
});
