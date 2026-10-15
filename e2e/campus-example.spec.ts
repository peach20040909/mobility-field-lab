import { test, expect } from "@playwright/test";

test("campus bus stop case presents both user photos and separates observation from witness report", async ({
  page,
}) => {
  let modelRequests = 0;
  await page.route("http://127.0.0.1:8765/**", (route) => {
    modelRequests++;
    return route.abort();
  });
  await page.goto("./#campus");
  const card = page.getByRole("region", {
    name: "명지대 앞 버스정류장 관찰 사례",
  });
  await expect(
    card.getByRole("heading", { name: "우리 학교 앞에서도 마주친 문제" }),
  ).toBeVisible();
  await expect(card.getByText("사진에서 확인한 내용")).toBeVisible();
  await expect(card.getByText("촬영자의 현장 설명")).toBeVisible();
  await expect(card.getByRole("img")).toHaveCount(2);
  for (const image of await card.getByRole("img").all()) {
    await expect(image).toHaveJSProperty("complete", true);
    expect(
      await image.evaluate((el: HTMLImageElement) => el.naturalWidth),
    ).toBeGreaterThan(0);
  }
  await expect(
    card.getByText("통행 방해 관찰 사례", { exact: true }),
  ).toBeVisible();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: `test-results/campus-${width}.png` });
  }
  expect(await card.innerText()).not.toMatch(/면접|재확인|확인하지 않았/);
  await page.getByRole("button", { name: "숫자 보기 →", exact: true }).click();
  await expect(
    page.getByText("7대 / 200m · 묶음 5대 추정 포함", { exact: true }),
  ).toBeVisible();
  expect(modelRequests).toBe(0);
});
