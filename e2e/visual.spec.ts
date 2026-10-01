import { test, expect } from "@playwright/test";
test("desktop and mobile pages fit and render without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "도시의 선택을, 거리의 기록으로." }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/overview-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "예시 데이터로 둘러보기" }).click();
  await expect(page.getByText("예시 데이터가 준비되었습니다")).toBeVisible();
  await page.getByRole("button", { name: "조사 지도", exact: true }).click();
  await expect(page.getByRole("img", { name: "조사 위치 지도" })).toBeVisible();
  await page
    .getByRole("button", { name: "분석 대시보드", exact: true })
    .click();
  await page.screenshot({
    path: "docs/screenshots/analysis-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/analysis-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
