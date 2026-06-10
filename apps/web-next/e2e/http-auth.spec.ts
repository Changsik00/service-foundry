import { expect, test } from "@playwright/test";

import { createTestUser, deleteTestUser } from "./fixtures";

const TEST_EMAIL = "e2e-http@test.example.com";
const TEST_PASSWORD = "E2eTest1234!";

test.beforeAll(async () => {
  await createTestUser(TEST_EMAIL, TEST_PASSWORD);
});

test.afterAll(async () => {
  await deleteTestUser(TEST_EMAIL);
});

test("로그인 후 API 요청 → Authorization: Bearer 헤더 자동 주입", async ({ page }) => {
  const authHeaders: (string | null)[] = [];

  await page.route("**/health**", async (route) => {
    authHeaders.push(route.request().headers()["authorization"] ?? null);
    await route.continue();
  });

  // 로그인
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });

  // onAuthStateChange → auth-store authenticated 전환 → HealthCardClient 재요청 대기
  await page.waitForTimeout(2_000);

  const withBearer = authHeaders.filter((h) => h?.startsWith("Bearer "));
  expect(withBearer.length).toBeGreaterThan(0);
});

test("미인증 상태 → public API는 토큰 없이 즉시 진행 (fetch 차단 없음)", async ({ page }) => {
  const requests: { auth: string | null }[] = [];

  await page.route("**/health**", async (route) => {
    requests.push({ auth: route.request().headers()["authorization"] ?? null });
    await route.continue();
  });

  // 로그인 없이 홈 접근
  await page.goto("/");
  await page.waitForTimeout(2_000);

  // public 요청은 차단 없이 진행 — Authorization 헤더 없음
  expect(requests.length).toBeGreaterThan(0);
  for (const r of requests) {
    expect(r.auth).toBeNull();
  }
});

test("401 수신 → refresh 후 재시도 (네트워크 요청 2회)", async ({ page }) => {
  let callCount = 0;

  // 첫 번째 요청은 401, 두 번째는 성공
  await page.route("**/health**", async (route) => {
    callCount += 1;
    if (callCount === 1) {
      await route.fulfill({ status: 401, body: JSON.stringify({ error: "expired" }) });
    } else {
      await route.continue();
    }
  });

  // 로그인 후 health 요청 발생
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await page.waitForTimeout(2_000);

  // 401 → refresh → 재시도 1회 = 총 2회 fetch
  expect(callCount).toBeGreaterThanOrEqual(2);
});
