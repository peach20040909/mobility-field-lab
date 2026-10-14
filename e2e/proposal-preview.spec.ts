import { test, expect } from "@playwright/test";
test("proposal output is shown before dashboard metrics without changing example counts", async ({
  page,
}) => {
  await page.goto("./#proposal");
  const preview = page.getByRole("region", {
    name: "서울시 제안서 결과물 예시",
  });
  await expect(
    preview.getByRole("heading", {
      name: "이런 결과물로 서울시에 제안하겠습니다.",
    }),
  ).toBeVisible();
  await expect(preview.getByRole("img")).toHaveJSProperty("complete", true);
  expect(
    await preview
      .getByRole("img")
      .evaluate((el: HTMLImageElement) => el.naturalWidth),
  ).toBeGreaterThan(0);
  const link = preview.getByRole("link", { name: "제안서 크게 보기 ↗" });
  await expect(link).toHaveAttribute("href", /proposal-preview\.png$/);
  await expect(page.getByText("2대 / 200m", { exact: true })).toBeVisible();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await preview.screenshot({ path: `test-results/proposal-${width}.png` });
  }
});
