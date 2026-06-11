import { expect, test } from "@playwright/test";

import { createTestUser, deleteTestUser } from "./fixtures";

const TEST_EMAIL = "e2e-http@test.example.com";
const TEST_PASSWORD = "E2eTest1234!";
const API_URL = "http://localhost:2026";

test.beforeAll(async () => {
  await createTestUser(TEST_EMAIL, TEST_PASSWORD);
});

test.afterAll(async () => {
  await deleteTestUser(TEST_EMAIL);
});

test("로그인 후 http-client → Authorization: Bearer 헤더 자동 주입", async ({ page }) => {
  const authHeaders: (string | null)[] = [];

  await page.route(`${API_URL}/**`, async (route) => {
    authHeaders.push(route.request().headers().authorization ?? null);
    await route.continue();
  });

  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await page.waitForTimeout(2_000);

  const withBearer = authHeaders.filter((h) => h?.startsWith("Bearer "));
  expect(withBearer.length).toBeGreaterThan(0);
});

test("로그인 후 GET /auth/me → apps/api가 Bearer 검증 후 사용자 정보 반환", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });

  // Supabase SDK가 localStorage에 저장한 세션에서 access_token 추출
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes("auth-token"));
    if (!key) return null;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "{}");
      return (parsed as { access_token?: string }).access_token ?? null;
    } catch {
      return null;
    }
  });

  expect(token).toBeTruthy();

  // apps/api의 protected GET /auth/me — SUPABASE_JWT_SECRET으로 로컬 JWT 검증
  const response = await page.request.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.user.sub).toBeTruthy();
  // provision 발화 증명 — null 이면 PROVISION_PORT 주입 단선 (provider-auth.module exports 참조)
  expect(body.user.orgId).toBeTruthy();
});

test("미인증 상태 → GET /auth/me 401 반환", async ({ page }) => {
  const response = await page.request.get(`${API_URL}/auth/me`);
  expect(response.status()).toBe(401);
});

test("미인증 → 콘솔 접근 시 클라이언트 API 호출 없이 /login (401 스팸 방지)", async ({ page }) => {
  // 구 시나리오(public 즉시 진행)는 홈이 AuthGuard 뒤로 가며 호스트 화면 소실 —
  // public 무토큰 진행은 http-client 단위 테스트가 커버. 여기선 가드가 호출 자체를 막는지 검증.
  const requests: string[] = [];

  await page.route(`${API_URL}/**`, async (route) => {
    requests.push(route.request().url());
    await route.continue();
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  await page.waitForTimeout(1_000);

  expect(requests).toHaveLength(0);
});

test("401 수신 → refresh 후 재시도 (네트워크 요청 2회)", async ({ page }) => {
  let callCount = 0;

  // 로그인 후 클라이언트 첫 호출 = GET /auth/me (대시보드 계정 카드)
  await page.route(`${API_URL}/auth/me`, async (route) => {
    callCount += 1;
    if (callCount === 1) {
      await route.fulfill({ status: 401, body: JSON.stringify({ error: "expired" }) });
    } else {
      await route.continue();
    }
  });

  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await page.waitForTimeout(2_000);

  expect(callCount).toBeGreaterThanOrEqual(2);
});
