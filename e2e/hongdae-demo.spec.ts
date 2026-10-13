import { test, expect } from "@playwright/test";

for (const width of [390, 768, 1440])
  test(`Hongdae saved display fits ${width}px and every publication photo is available`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#hongdae");
    await expect(
      page.getByRole("heading", { name: "홍대 사진으로 준비한 사전 분석" }),
    ).toBeVisible();
    const hits = await page.locator("body").innerText();
    expect(hits).not.toMatch(/면접|재확인|확인하지 않았/);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const photos = page.locator("figure img");
    for (let index = 0; index < 2; index++)
      await expect(photos.nth(index)).toHaveJSProperty("complete", true);
    await page.screenshot({
      path: `test-results/hongdae-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "불일치 조정 시연", exact: true })
      .click();
    await expect(
      page.getByRole("dialog").getByText("불일치 · 조정 대기"),
    ).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("img")).toHaveJSProperty(
      "complete",
      true,
    );
    expect(
      (await page.getByRole("dialog").boundingBox())!.width,
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/hongdae-review-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "닫기", exact: true }).click();
    await page
      .getByRole("button", { name: "숫자 보기 →", exact: true })
      .click();
    await expect(page.getByText("2대 / 200m", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    if (width === 1440)
      for (let index = 0; index < 25; index++) {
        const response = await request.get(
          `./hongdae/photo-${String(index).padStart(2, "0")}.jpg`,
        );
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image/jpeg");
      }
  });

test("Hongdae saved results work without a model and final review updates scoped metrics", async ({
  page,
}) => {
  let modelRequests = 0;
  await page.route("http://127.0.0.1:8765/**", (r) => {
    modelRequests++;
    return r.abort();
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "홍대 사전조사 시연", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "홍대 사진으로 준비한 사전 분석" }),
  ).toBeVisible();
  await expect(
    page.getByText("Claude 자료의 사전 판정 · 실시간 분석 아님", {
      exact: true,
    }),
  ).not.toBeVisible();
  await expect(
    page.getByLabel("홍대 사전조사 사진 모음").locator("img"),
  ).toHaveCount(25);
  await expect(
    page.getByLabel("홍대 사전 판정 결과").locator("tbody tr"),
  ).toHaveCount(6);
  await expect(page.getByLabel("로컬 AI 연결 토큰")).not.toBeVisible();
  await page
    .getByRole("button", { name: "03 독립 판정 보기", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("불일치 · 조정 대기"),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("합성 사진과 판정", { exact: false }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "최종 조정", exact: true }).click();
  await page.getByRole("button", { name: "B 판정 불러오기" }).click();
  await page
    .getByLabel("판정 사유")
    .fill("시연 예시: 역 출구 앞 통행 방해로 합의");
  await page.getByRole("button", { name: "확정 판정 저장" }).click();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page
    .getByRole("button", { name: "분석 대시보드", exact: true })
    .click();
  await expect(page.getByText("3대 / 200m", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1대 / 판정 완료 3대", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "조사 지도", exact: true }).click();
  await page
    .getByRole("button", { name: "홍대 사전조사 시연 판정 집계", exact: true })
    .click();
  await expect(
    page.getByText(/확정 공유 3대.*100m당 1.5대.*33.3%/),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "홍대 사전조사 시연", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "03 독립 판정 보기", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("불일치 · 조정 완료"),
  ).toBeVisible();
  expect(modelRequests).toBe(0);
});
