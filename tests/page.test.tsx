import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import ServicesPage from "@/app/services/page";

describe("booking page", () => {
  it("starts with an accessible address form", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /simply enter your address/i
      })
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Service address" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
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
