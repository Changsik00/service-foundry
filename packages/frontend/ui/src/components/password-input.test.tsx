import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("기본은 가려진 상태(type=password) + 표시 토글 버튼 (aria-label)", () => {
    render(<PasswordInput aria-label="비밀번호" />);

    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "비밀번호 표시" })).toBeInTheDocument();
  });

  it("토글 클릭 → type=text 전환 + aria-label 반전, 재클릭 → 원복", () => {
    render(<PasswordInput aria-label="비밀번호" />);

    fireEvent.click(screen.getByRole("button", { name: "비밀번호 표시" }));
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "비밀번호 숨기기" }));
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("type", "password");
  });
});
