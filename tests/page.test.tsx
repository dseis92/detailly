import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import ServicesPage from "@/app/services/page";

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

describe("services page", () => {
  it("renders the approved mobile catalog without add-ons", () => {
    render(<ServicesPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /good care, clearly priced/i
      })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Interior Detail" })
    ).toBeVisible();
    expect(screen.getAllByText("$150.00")).toHaveLength(2);
    expect(screen.getByText(/no add-ons currently offered/i)).toBeVisible();
  });
});
