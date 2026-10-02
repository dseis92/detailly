import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("foundation page", () => {
  it("has a clear heading hierarchy and foundation navigation", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /care starts.*before the keys/i
      })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /view the foundation/i })
    ).toHaveAttribute("href", "#foundation");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });
});
