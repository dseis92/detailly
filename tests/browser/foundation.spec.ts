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
