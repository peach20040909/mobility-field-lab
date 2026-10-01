import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("real local model photo upload to saved independent review", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.FIELD_PHOTO,
    "Requires user-supplied local photo and running GPU server",
  );
  test.setTimeout(100000);
  if (process.env.PLAYWRIGHT_BASE_URL?.startsWith("https:"))
    await context.grantPermissions(["local-network-access"], {
      origin: new URL(process.env.PLAYWRIGHT_BASE_URL).origin,
    });
  await page.goto("./");
  await page.getByRole("button", { name: "새 조사 시작" }).click();
  await page.getByLabel("장소 이름").fill("로컬 AI 연결 검증 · 측정 결과 아님");
  await page.getByRole("button", { name: "조사 저장" }).click();
  await expect(page.getByText("조사가 저장되었습니다")).toBeVisible();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await page
    .getByLabel("사진을 등록할 조사")
    .selectOption({ label: "로컬 AI 연결 검증 · 측정 결과 아님" });
  await page
    .locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]')
    .setInputFiles(process.env.FIELD_PHOTO!);
  await expect(page.getByText("사진만 등록됨 · 기록된 기기 0대")).toBeVisible();
  await page
    .getByLabel("로컬 AI 연결 토큰")
    .fill(readFileSync("services/vision/.env", "utf8").trim());
  await page.getByRole("button", { name: "AI 연결 확인" }).click();
  await expect(page.getByText("로컬 AI 서버가 준비되었습니다")).toBeVisible();
  await page.getByRole("button", { name: "AI로 기기 분석" }).click();
  await expect(
    page.getByText("AI 분석을 저장했습니다. 독립 검수를 진행하세요."),
  ).toBeVisible({ timeout: 65000 });
  await page.getByRole("button", { name: "검수하기" }).first().click();
  await expect(page.getByLabel("검수 대상 기기 영역")).toBeVisible();
  await expect(
    page.getByText("독립 판정 전에는 AI와 상대 판정을 숨깁니다."),
  ).toBeVisible();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "검수하기" })).toHaveCount(1);
});
