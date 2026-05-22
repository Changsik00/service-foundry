import { describe, expect, it } from "vitest";

import { generateState, verifyState } from "./state.js";

describe("generateState", () => {
  it("비어있지 않은 문자열을 반환해야 한다", () => {
    const state = generateState();
    expect(state.length).toBeGreaterThan(0);
  });

  it("base64url 문자만 포함해야 한다", () => {
    const state = generateState();
    expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("매 호출마다 다른 값을 반환해야 한다", () => {
    const s1 = generateState();
    const s2 = generateState();
    expect(s1).not.toBe(s2);
  });
});

describe("verifyState", () => {
  it("state와 cookie 값이 일치하면 true를 반환해야 한다", () => {
    const state = generateState();
    expect(verifyState(state, state)).toBe(true);
  });

  it("state와 cookie 값이 다르면 false를 반환해야 한다", () => {
    const state = generateState();
    const other = generateState();
    expect(verifyState(state, other)).toBe(false);
  });

  it("빈 state는 false를 반환해야 한다", () => {
    expect(verifyState("", "")).toBe(false);
  });

  it("변조된 state는 false를 반환해야 한다", () => {
    const state = generateState();
    expect(verifyState(state + "x", state)).toBe(false);
  });
});
