import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// vitest globals: false 모드 — testing-library 자동 cleanup 안 박힘. 명시 호출.
afterEach(() => {
  cleanup();
});

// jsdom 의 window.matchMedia 부재 — next-themes 등 client lib 가 호출.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
