import { test, expect } from "@playwright/test";
test("proposal renders crisp native content and an accessible enlarged view", async ({
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
  await expect(preview.locator("img")).toHaveCount(0);
  await expect(preview.getByRole("img")).toBeVisible();
  await expect(
    preview
      .getByText("예시 데이터 · 후보 위치는 가정", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText("7대 / 200m · 묶음 5대 추정 포함", { exact: true }),
  ).toBeVisible();
  await expect(preview).not.toContainText("Page 1 / 1");
  const headline = page.getByLabel("분석 핵심 결과 세 숫자");
  await expect(headline.getByRole("article")).toHaveCount(3);
  expect(
    await headline.evaluate((el) =>
      Boolean(
        el.compareDocumentPosition(
          document.querySelector('[aria-label="서울시 제안서 결과물 예시"]')!,
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ),
  ).toBe(true);

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await preview.getByRole("button", { name: "제안서 크게 보기 ↗" }).click();
    const dialog = page.getByRole("dialog", { name: "제안서 크게 보기" });
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await dialog.screenshot({ path: `test-results/proposal-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      preview.getByRole("button", { name: "제안서 크게 보기 ↗" }),
    ).toBeFocused();
  }
});
