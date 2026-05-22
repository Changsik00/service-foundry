import { describe, expect, it } from "vitest";

import { issueCsrfToken, verifyCsrfToken } from "./csrf.js";

const SECRET = "test-secret-key-do-not-use-in-prod";
const SESSION_ID = "session-uuid-abc-123";

describe("CSRF token", () => {
  it("round-trip — issue then verify returns true", () => {
    const token = issueCsrfToken(SECRET, SESSION_ID);
    expect(token.length).toBeGreaterThan(0);
    expect(verifyCsrfToken(SECRET, SESSION_ID, token)).toBe(true);
  });

  it("deterministic — same input yields same token (double-submit 친화)", () => {
    const a = issueCsrfToken(SECRET, SESSION_ID);
    const b = issueCsrfToken(SECRET, SESSION_ID);
    expect(a).toBe(b);
  });

  it("rejects mismatched session id", () => {
    const token = issueCsrfToken(SECRET, SESSION_ID);
    expect(verifyCsrfToken(SECRET, "other-session", token)).toBe(false);
  });

  it("rejects tampered token", () => {
    const token = issueCsrfToken(SECRET, SESSION_ID);
    const flipped = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    expect(verifyCsrfToken(SECRET, SESSION_ID, flipped)).toBe(false);
  });

  it("rejects empty inputs", () => {
    const token = issueCsrfToken(SECRET, SESSION_ID);
    expect(verifyCsrfToken("", SESSION_ID, token)).toBe(false);
    expect(verifyCsrfToken(SECRET, "", token)).toBe(false);
    expect(verifyCsrfToken(SECRET, SESSION_ID, "")).toBe(false);
  });
});
