import { expect, test } from "@playwright/test";

test("foundation page is usable", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Detailly/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Care starts"
  );

  await page.getByRole("link", { name: "View the foundation" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Simple for the customer. Rigorous underneath."
    })
  ).toBeInViewport();
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
