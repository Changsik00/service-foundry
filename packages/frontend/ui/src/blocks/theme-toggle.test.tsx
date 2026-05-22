import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "../lib/theme-context";
import { ThemeToggle } from "./theme-toggle.js";

function renderWithProvider(): void {
  render(
    <ThemeProvider defaultTheme="light">
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("render → button + aria-label (default light)", async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeInTheDocument();
    });
  });

  it("click → setTheme 호출 + aria-label 토글", async () => {
    renderWithProvider();
    const btn = await waitFor(() => screen.getByRole("button", { name: /switch to dark mode/i }));

    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /switch to light mode/i })).toBeInTheDocument();
    });
  });
});
