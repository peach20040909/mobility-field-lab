import { test, expect } from "@playwright/test";
test("a wheel burst is moderated instead of jumping several map levels", async ({
  page,
}) => {
  await page.route("https://*.tile.openstreetmap.org/**", (r) =>
    r.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto("./#hongdae");
  await expect(
    page.getByRole("heading", { name: "홍대 사진으로 준비한 사전 분석" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "조사 지도", exact: true }).click();
  const map = page.getByRole("img", { name: "조사 위치 지도" });
  await expect(map.locator(".leaflet-tile").first()).toBeAttached();
  const tileLevel = () =>
    map
      .locator(".leaflet-tile")
      .evaluateAll((images) =>
        Math.max(
          ...images.map((img) =>
            Number(
              (img as HTMLImageElement).src.match(/\.org\/(\d+)\//)?.[1] ?? 0,
            ),
          ),
        ),
      );
  const before = await tileLevel();
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -480);
  await page.waitForTimeout(700);
  const after = await tileLevel();
  expect(after).toBeGreaterThan(before);
  expect(after - before).toBeLessThanOrEqual(2);
});

test("zoom buttons make half steps and survey view can be restored", async ({
  page,
}) => {
  await page.goto("./#hongdae");
  await expect(
    page.getByRole("heading", { name: "홍대 사진으로 준비한 사전 분석" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "조사 지도", exact: true }).click();
  const zoom = page.getByLabel("지도 확대 단계");
  await expect(zoom).toHaveText("14.0");
  await page.locator(".leaflet-control-zoom-in").click();
  await expect(zoom).toHaveText("14.5");
  await page.locator(".leaflet-control-zoom-out").click();
  await expect(zoom).toHaveText("14.0");
  await page.locator(".leaflet-control-zoom-in").click();
  await expect(zoom).toHaveText("14.5");
  await page
    .getByRole("button", { name: "조사 위치로 돌아가기", exact: true })
    .click();
  await expect(zoom).toHaveText("14.0");
});
