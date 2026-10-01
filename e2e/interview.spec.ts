import { test, expect } from "@playwright/test";
test("demo_full_flow preserves independent judgments and separates real records", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "도시의 선택을, 거리의 기록으로." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "예시 데이터로 둘러보기" }).click();
  await expect(page.getByText("예시 데이터가 준비되었습니다")).toBeVisible();
  await page
    .getByRole("button", { name: "분석 대시보드", exact: true })
    .click();
  await expect(
    page.getByText("합성 예시 데이터 · 실제 조사 결과가 아닙니다"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await page.getByRole("button", { name: "검수하기" }).first().click();
  await expect(
    page.getByText("독립 판정 전에는 AI와 상대 판정을 숨깁니다."),
  ).toBeVisible();
  await page.getByLabel("판정 사유").fill("면접 시연 점자블록 위");
  await page.getByRole("button", { name: "A 판정 제출" }).click();
  await page.getByRole("button", { name: "검수자 B", exact: true }).click();
  await page.getByLabel("판정 사유").fill("두 번째 독립 판정");
  await page.getByRole("button", { name: "B 판정 제출" }).click();
  await page.getByRole("button", { name: "최종 조정", exact: true }).click();
  await page.getByLabel("판정 사유").fill("두 사람 비교 후 확정");
  await page.getByRole("button", { name: "확정 판정 저장" }).click();
  await expect(page.getByText("판정이 저장되었습니다")).toBeVisible();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "조사 기록", exact: true }).click();
  await page
    .getByRole("button", { name: "새 조사 등록", exact: true })
    .first()
    .click();
  await page.getByLabel("장소 이름").fill("실제 조사 테스트");
  await page.getByRole("button", { name: "조사 저장" }).click();
  await expect(page.getByText("조사가 저장되었습니다")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "조사 기록", exact: true }).click();
  await page.getByRole("button", { name: "실제 기록", exact: true }).click();
  await expect(page.getByText("실제 조사 테스트")).toBeVisible();
  await expect(page.getByText("뢰머광장 → 차일 거리")).not.toBeVisible();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = 20;
    canvas.getContext("2d")!.fillRect(0, 0, 20, 20);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("사진을 등록할 조사")
    .selectOption({ label: "실제 조사 테스트" });
  await page
    .locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]')
    .setInputFiles({
      name: "empty-scene.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect(page.getByText("사진만 등록됨 · 기록된 기기 0대")).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await expect(page.getByText("사진만 등록됨 · 기록된 기기 0대")).toBeVisible();
  await page.getByRole("button", { name: "기기 추가", exact: true }).click();
  await expect(page.getByRole("button", { name: "검수하기" })).toHaveCount(1);
});
test("mobile navigation is operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("button", { name: "조사 기록", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "거리를 기록하는 첫 단계." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
