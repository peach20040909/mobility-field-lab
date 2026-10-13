import { test, expect } from "@playwright/test";

test("latest photo wins even when an earlier photo decodes slowly", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const decode = Image.prototype.decode;
    let calls = 0;
    Image.prototype.decode = async function () {
      const call = ++calls;
      await decode.call(this);
      await new Promise((resolve) =>
        setTimeout(resolve, call === 1 ? 800 : 10),
      );
    };
  });
  await page.goto("./demo/");
  expect(
    await page
      .locator("main")
      .evaluate((el) => getComputedStyle(el).marginLeft),
  ).toBe("0px");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 30;
    c.height = 80;
    return c.toDataURL().split(",")[1];
  });
  const upload = page.getByLabel("조사 사진 선택");
  await upload.setInputFiles({
    name: "older.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await upload.setInputFiles({
    name: "latest.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(page.getByText("latest.png", { exact: true })).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByText("latest.png", { exact: true })).toBeVisible();
  await expect(page.getByText("older.png", { exact: true })).not.toBeVisible();
  await page.emulateMedia({ media: "print" });
  const size = await page
    .getByAltText("선택한 조사 사진")
    .evaluate((image) => ({
      width: image.getBoundingClientRect().width,
      height: image.getBoundingClientRect().height,
    }));
  expect(size.width / size.height).toBeCloseTo(30 / 80, 2);
});

test("presentation uses actual API response, hides old results on failure, and prints the same report", async ({
  page,
}) => {
  await page.route("**/connect", (r) => r.fulfill({ json: { ready: true } }));
  let fail = false;
  await page.route("**/analyze", (r) =>
    fail
      ? r.fulfill({ status: 503 })
      : r.fulfill({
          json: {
            modelId: "Qwen/Qwen3-VL-2B-Instruct",
            modelVersion: "test-revision",
            timestamp: "2026-10-14T00:00:00Z",
            seconds: 12,
            warnings: ["가려진 기기는 직접 검수하세요."],
            observations: [
              {
                kind: "shared-ebike",
                status: "danger",
                risks: ["exit"],
                fallen: false,
                reason: "출입구 앞 통행을 막고 있습니다.",
                bbox: [0.1, 0.2, 0.8, 0.9],
              },
            ],
          },
        }),
  );
  await page.goto("./demo/");
  await expect(
    page.getByRole("heading", { name: "사진 한 장, 거리의 문제를 보다." }),
  ).toBeVisible();
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 40;
    c.height = 30;
    return c.toDataURL().split(",")[1];
  });
  await page.getByLabel("조사 사진 선택").setInputFiles({
    name: "hongdae.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await page.getByLabel("로컬 AI 연결 토큰").fill("test-token");
  await page.getByRole("button", { name: "AI 연결 확인" }).click();
  await page.getByRole("button", { name: "AI 분석 시작" }).click();
  await expect(page.getByText("출입구 앞 통행을 막고 있습니다.")).toBeVisible();
  await expect(page.getByLabel("기기 1 영역")).toBeVisible();
  await expect(page.getByText("test-revision")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByText("출입구 앞 통행을 막고 있습니다.")).toBeVisible();
  await expect(page.getByLabel("로컬 AI 연결 토큰")).not.toBeVisible();
  await page.emulateMedia({ media: "screen" });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  fail = true;
  await page.getByRole("button", { name: "AI 분석 시작" }).click();
  await expect(page.locator('main [role="alert"]')).toBeVisible();
  await expect(
    page.getByText("출입구 앞 통행을 막고 있습니다."),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "결과 인쇄 / PDF" }),
  ).not.toBeVisible();
});
