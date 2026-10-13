import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

test("real Hongdae photo produces a live printable report", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.PRESENTATION_PHOTO,
    "Requires actual local photo and GPU server",
  );
  test.setTimeout(100000);
  if (process.env.PLAYWRIGHT_BASE_URL?.startsWith("https:"))
    await context.grantPermissions(["local-network-access"], {
      origin: new URL(process.env.PLAYWRIGHT_BASE_URL).origin,
    });
  await page.goto("./demo/");
  await page
    .getByLabel("조사 사진 선택")
    .setInputFiles(process.env.PRESENTATION_PHOTO!);
  await page
    .getByLabel("로컬 AI 연결 토큰")
    .fill(readFileSync("services/vision/.env", "utf8").trim());
  await page.getByRole("button", { name: "AI 연결 확인" }).click();
  await expect(
    page.getByRole("button", { name: "AI 분석 시작" }),
  ).toBeEnabled();
  const response = page.waitForResponse((r) => r.url().endsWith("/analyze"), {
    timeout: 65000,
  });
  await page.getByRole("button", { name: "AI 분석 시작" }).click();
  await expect(
    page.getByText("사진 속 기기를 분석하고 있습니다."),
  ).toBeVisible();
  const live = await response;
  expect(live.status()).toBe(200);
  const result = await live.json();
  await expect(page.getByText("실제 업로드 사진 · AI 예비 판정")).toBeVisible();
  await expect(
    page.getByText(result.modelVersion, { exact: true }),
  ).toBeVisible();
  mkdirSync("services/vision/results", { recursive: true });
  writeFileSync(
    "services/vision/results/presentation.json",
    JSON.stringify(result, null, 2),
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `services/vision/results/presentation-${width}.png`,
      fullPage: true,
    });
  }
  expect(await page.locator("body").innerText()).not.toMatch(
    /면접|재확인|확인하지 않았/,
  );
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: "services/vision/results/hongdae-analysis.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
  });
});
