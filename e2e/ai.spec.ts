import { test, expect } from "@playwright/test";
test("local AI contract stores suggestions and keeps independent labels blind", async ({
  page,
}) => {
  const response = {
    modelId: "Qwen/Qwen3-VL-2B-Instruct",
    modelVersion: "test-only-revision",
    timestamp: new Date().toISOString(),
    seconds: 1,
    observations: [
      {
        kind: "shared-ebike",
        status: "danger",
        risks: ["exit"],
        fallen: false,
        reason: "test-only suggestion",
        bbox: [0.1, 0.2, 0.8, 0.9],
      },
    ],
    warnings: [],
  };
  await page.route("http://127.0.0.1:8765/connect", (route) =>
    route.request().headers().authorization === "Bearer test-only-token"
      ? route.fulfill({ json: { ready: true } })
      : route.fulfill({ status: 401, json: { detail: "Invalid token" } }),
  );
  await page.route("http://127.0.0.1:8765/analyze", (route) => {
    expect(route.request().headers().authorization).toBe(
      "Bearer test-only-token",
    );
    return route.fulfill({ json: response });
  });
  await page.goto("./");
  await page.getByRole("button", { name: "새 조사 시작" }).click();
  await page.getByLabel("장소 이름").fill("AI 계약 검증");
  await page.getByRole("button", { name: "조사 저장" }).click();
  await expect(page.getByText("조사가 저장되었습니다")).toBeVisible();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await page
    .getByLabel("사진을 등록할 조사")
    .selectOption({ label: "AI 계약 검증" });
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 20;
    c.height = 20;
    c.getContext("2d")!.fillRect(0, 0, 20, 20);
    return c.toDataURL().split(",")[1];
  });
  await page
    .locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]')
    .setInputFiles({
      name: "scene.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await page.getByLabel("로컬 AI 연결 토큰").fill("wrong-token");
  await page.getByRole("button", { name: "AI 연결 확인" }).click();
  await expect(
    page.getByText(
      "AI 서버가 준비되지 않았습니다. 수동 검수는 계속할 수 있습니다.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "AI로 기기 분석" }),
  ).toBeDisabled();
  await page.getByLabel("로컬 AI 연결 토큰").fill("test-only-token");
  await page.getByRole("button", { name: "AI 연결 확인" }).click();
  await page.getByRole("button", { name: "AI로 기기 분석" }).click();
  await expect(
    page.getByText("AI 분석을 저장했습니다. 독립 검수를 진행하세요."),
  ).toBeVisible();
  await page.getByRole("button", { name: "검수하기" }).click();
  await expect(page.getByLabel("검수 대상 기기 영역")).toBeVisible();
  await expect(page.getByText("test-only-revision")).not.toBeVisible();
  await expect(
    page.getByText("독립 판정 전에는 AI와 상대 판정을 숨깁니다."),
  ).toBeVisible();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("로컬 AI 연결 토큰")).not.toBeVisible();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await expect(page.getByLabel("로컬 AI 연결 토큰")).toHaveValue("");
  await expect(page.getByRole("button", { name: "검수하기" })).toHaveCount(1);
});
