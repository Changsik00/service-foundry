import { expect, test } from "@playwright/test";

import { createTestUser, deleteTestUser } from "./fixtures";

const TEST_EMAIL = "e2e-auth@test.example.com";
const TEST_PASSWORD = "E2eTest1234!";

test.beforeAll(async () => {
  await createTestUser(TEST_EMAIL, TEST_PASSWORD);
});

test.afterAll(async () => {
  await deleteTestUser(TEST_EMAIL);
});

test("로그인 성공 → 홈으로 리다이렉트", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
});

test("잘못된 비밀번호 → 오류 메시지 표시", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", "wrong-password");
  await page.click("button[type=submit]");
  await expect(page.getByRole("alert")).toBeVisible();
});
