import { expect, test } from "@playwright/test";

test("booking starts with address entry", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Detailly/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Simply Enter Your Address"
  );
  await page
    .getByRole("textbox", { name: "Service address" })
    .fill("100 Main Street, Madison WI 53703");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "We Come To You"
  );
});

test("operations workspace denies anonymous access", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fadmin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your bookings"
  );
});

test("session endpoint denies anonymous access", async ({ request }) => {
  const response = await request.get("/api/auth/session");

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ authenticated: false });
});

test("approved services catalog is visible", async ({ page }) => {
  await page.goto("/services");

  await expect(
    page.getByRole("heading", { name: "Good care, clearly priced." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Interior Detail" })
  ).toBeVisible();
  await expect(page.getByText("$150.00").first()).toBeVisible();
  await expect(page.getByText(/No add-ons currently offered/i)).toBeVisible();
});

test("availability preview searches server-authoritative slots", async ({
  page
}) => {
  await page.goto("/availability");
  await expect(
    page.getByRole("heading", { name: "Bring the detail to your driveway." })
  ).toBeVisible();
  await page.locator('input[type="date"]').fill("2026-10-05");
  await page.getByRole("button", { name: /show times/i }).click();
  await expect(page.getByRole("status")).toContainText("windows available");
  await expect(page.getByRole("button", { name: /9:00 AM/i })).toBeVisible();
});
