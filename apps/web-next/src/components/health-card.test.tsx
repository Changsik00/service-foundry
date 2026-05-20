import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HealthCard } from "./health-card.js";

describe("HealthCard", () => {
  it("정상 응답 → status / uptime / version 모두 표시", () => {
    render(<HealthCard data={{ status: "ok", uptime: 12.34, version: "0.0.0" }} />);
    expect(screen.getByText(/ok/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.34/)).toBeInTheDocument();
    expect(screen.getByText(/0\.0\.0/)).toBeInTheDocument();
  });

  it("error prop → error message 표시", () => {
    render(<HealthCard error="connection refused" />);
    expect(screen.getByText(/connection refused/i)).toBeInTheDocument();
  });
});
