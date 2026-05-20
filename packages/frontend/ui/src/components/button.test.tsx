import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button.js";

describe("Button", () => {
  it("기본 렌더링 — children 표시 + button role", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
  });

  it("variant prop → 적절 class 적용", () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn.className).toContain("destructive");
  });

  it("size prop → 적절 class 적용", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole("button", { name: "Large" });
    expect(btn.className).toMatch(/h-(10|11|12)/);
  });

  it("asChild prop → Slot 으로 렌더 (button 아닌 자식 요소)", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
  });

  it("className prop → 사용자 class merge", () => {
    render(<Button className="custom-class">Custom</Button>);
    const btn = screen.getByRole("button", { name: "Custom" });
    expect(btn.className).toContain("custom-class");
  });
});
