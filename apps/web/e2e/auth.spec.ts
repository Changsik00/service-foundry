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

test("(auth) 공통 골격 — 카드 + 제목 렌더 (DESIGN §6.0)", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByLabel("비밀번호")).toBeVisible();
  await expect(page.getByText("계정이 없으신가요?")).toBeVisible();
});

test("회원가입 성공 → 콘솔(/)로 직행 (DESIGN §6.2)", async ({ page }) => {
  const SIGNUP_EMAIL = "e2e-signup@test.example.com";
  await deleteTestUser(SIGNUP_EMAIL); // 이전 실행 잔재 정리

  await page.goto("/signup");
  await page.getByLabel("이름").fill("e2e 가입자");
  await page.getByLabel("이메일").fill(SIGNUP_EMAIL);
  await page.getByLabel("비밀번호").fill("E2eSignup1234!");
  await page.click("button[type=submit]");

  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await deleteTestUser(SIGNUP_EMAIL);
});

test("로그인 상태로 /login 접근 → 콘솔(/)로 보냄 (GuestOnly 가드)", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });

  await page.goto("/login");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
});
