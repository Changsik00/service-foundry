import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Toaster, toast } from "./toaster.js";

describe("Toaster (sonner)", () => {
  it("Toaster 렌더 + toast 호출 시 DOM 에 메시지 표시", async () => {
    render(<Toaster />);
    toast("Hello toast");
    await waitFor(() => {
      expect(screen.getByText("Hello toast")).toBeInTheDocument();
    });
  });
});
