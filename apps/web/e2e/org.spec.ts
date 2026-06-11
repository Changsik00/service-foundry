import { expect, test } from "@playwright/test";

import { createTestUser, deleteTestUser } from "./fixtures";

const TEST_EMAIL = "e2e-org@test.example.com";
const TEST_PASSWORD = "E2eOrg1234!";

test.beforeAll(async () => {
  await createTestUser(TEST_EMAIL, TEST_PASSWORD);
});

test.afterAll(async () => {
  await deleteTestUser(TEST_EMAIL);
});

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=password]", TEST_PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
}

test("사이드바 테넌트 스위처 — 개인 워크스페이스 이름 표시", async ({ page }) => {
  await login(page);
  // provision: 개인 org name = email local part
  await expect(
    page.getByRole("complementary").getByRole("button", { name: /e2e-org/ }),
  ).toBeVisible({ timeout: 10_000 });
});

test("/orgs 조직 선택 — 목록 표시 + 클릭 → 콘솔", async ({ page }) => {
  await login(page);
  await page.goto("/orgs");
  const row = page.getByRole("button", { name: /e2e-org/ });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  await expect(page).toHaveURL("/", { timeout: 10_000 });
});

test("/members — 본인 멤버십 행(email·owner) + 초대 전송", async ({ page }) => {
  await login(page);
  await page.goto("/members");

  // 멤버 테이블: 본인 행 + 행 스코프 owner 배지.
  // 주의: dev/CI 의 DATABASE_URL 이 superuser 라 RLS 미적용 — 타 org 행도 보일 수 있음.
  // org 격리 검증은 runtime role 을 쓰는 api e2e(spec-17-08)가 담당. 여기선 화면 동작만.
  const myRow = page.getByRole("row", { name: new RegExp(TEST_EMAIL) });
  await expect(myRow).toBeVisible({ timeout: 10_000 });
  await expect(myRow.getByText("owner")).toBeVisible();

  // 초대 전송 — 실 API (notifier 는 로그 — 발송 200 + 완료 안내까지 검증)
  const inviteeEmail = `e2e-invitee-${Date.now()}@test.example.com`;
  await page.getByLabel("이메일").fill(inviteeEmail);
  await page.getByLabel("역할").selectOption("member");
  await page.getByRole("button", { name: "초대 보내기" }).click();
  await expect(page.getByText("초대 이메일을 보냈습니다")).toBeVisible({ timeout: 10_000 });
});

test("/invite/[token] 비로그인 — 가입/로그인 분기 (redirect 보존)", async ({ page }) => {
  await page.goto(`/invite/${"x".repeat(32)}`);
  await expect(page.getByRole("link", { name: "계정 만들고 수락" })).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인하고 수락" })).toBeVisible();
});

test("/invite/[token] 무효 토큰 수락 → 사실+행동 에러 (실 HTTP 404/410 경로)", async ({ page }) => {
  await login(page);
  await page.goto(`/invite/${"x".repeat(32)}`);
  await page.getByRole("button", { name: "초대 수락" }).click();
  await expect(
    page.getByText("초대가 만료되었거나 유효하지 않습니다. 초대한 분께 다시 요청해주세요"),
  ).toBeVisible({ timeout: 10_000 });
});
