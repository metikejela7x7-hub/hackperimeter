import { expect, test, type Page } from "@playwright/test";

const PDF = Buffer.from("%PDF-1.7\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

async function fillApplication(page: Page, { withResume = false } = {}) {
  await page.goto("/apply");

  await page.getByLabel("Full name").fill("Ada Lovelace");
  await page.getByLabel("Personal email").fill("ada@example.com");
  await page.getByLabel("School").fill("Perimeter College");
  await page.getByLabel("Graduation year").selectOption("2027");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Major").fill("Computer Science");
  await page.getByRole("radio", { name: /^Intermediate/ }).check();
  await page.getByRole("checkbox", { name: "Web development" }).check();
  if (withResume) {
    await page.getByLabel(/Resume/).setInputFiles({ name: "ada.pdf", mimeType: "application/pdf", buffer: PDF });
    await expect(page.getByText("ada.pdf")).toBeVisible();
  }
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("radio", { name: /^Looking for a team/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("checkbox", { name: /I confirm the information above/ }).check();
}

test("submits an application with a resume", async ({ page }) => {
  let uploaded = false;
  let sent: Record<string, unknown> | undefined;

  await page.route("**/api/resume/upload", async (route) => {
    uploaded = true;
    await route.fulfill({ status: 201, json: { resumeId: "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b" } });
  });
  await page.route("**/api/applications", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { id: "new-id" } });
  });

  await fillApplication(page, { withResume: true });
  await expect(page.getByText("ada.pdf")).toBeVisible(); // shown on the review step
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByRole("heading", { name: /You're on the radar, Ada/ })).toBeVisible();
  expect(uploaded).toBe(true);
  expect(sent).toMatchObject({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    teamMode: "solo",
    resumeId: "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b",
    agreed: true,
  });
});

test("shows the server's message when the email already applied", async ({ page }) => {
  await page.route("**/api/applications", (route) =>
    route.fulfill({ status: 409, json: { error: "An application with this email already exists." } }),
  );

  await fillApplication(page);
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "already exists" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit application" })).toBeEnabled();
});

test("rejects a non-PDF resume before upload", async ({ page }) => {
  await page.goto("/apply");
  await page.getByLabel("Full name").fill("Ada Lovelace");
  await page.getByLabel("Personal email").fill("ada@example.com");
  await page.getByLabel("School").fill("Perimeter College");
  await page.getByLabel("Graduation year").selectOption("2027");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel(/Resume/).setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from("png") });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Upload your resume as a PDF.")).toBeVisible();
});

test("keeps signed-out visitors out of the dashboard", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Admin sign-in" })).toBeVisible();

  const response = await page.request.get("/api/admin/applications");
  expect(response.status()).toBe(401);
});
