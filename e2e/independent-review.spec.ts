import { test, expect } from "@playwright/test";
test("both reviewers submit before disclosure and originals survive final resolution", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "예시 데이터로 둘러보기" }).click();
  await page
    .getByRole("button", { name: "사진 판정 · 검수", exact: true })
    .click();
  await page.getByRole("button", { name: "검수하기" }).first().click();
  await page.getByLabel("판정 사유").fill("A 독립 원판정");
  await page.getByRole("button", { name: "A 판정 제출" }).click();
  await expect(
    page.getByRole("button", { name: "최종 조정", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".verdicts")).toHaveCount(0);
  await page.getByRole("button", { name: "판정자 B", exact: true }).click();
  await expect(
    page.getByText("A 독립 원판정", { exact: true }),
  ).not.toBeVisible();
  await page.getByLabel("주차 상태").selectOption("danger");
  await page.getByLabel("판정 사유").fill("B 독립 원판정");
  await page.getByRole("button", { name: "B 판정 제출" }).click();
  await expect(
    page.getByRole("dialog").getByText("불일치 · 조정 대기"),
  ).toBeVisible();
  await page.getByRole("button", { name: "최종 조정", exact: true }).click();
  await expect(page.getByText("A 독립 원판정", { exact: true })).toBeVisible();
  await expect(page.getByText("B 독립 원판정", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "B 판정 불러오기" }).click();
  await page.getByLabel("판정 사유").fill("출입구 위험으로 조정");
  await page.getByRole("button", { name: "확정 판정 저장" }).click();
  await expect(
    page.getByRole("dialog").getByText("불일치 · 조정 완료"),
  ).toBeVisible();
  await expect(page.getByText("A 독립 원판정", { exact: true })).toBeVisible();
  await expect(page.getByText("B 독립 원판정", { exact: true })).toBeVisible();
});
test("short demo counts disagreements and updates final-only dashboard and map", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "30초 판정 예시", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("불일치 · 조정 대기"),
  ).toBeVisible();
  await page.getByRole("button", { name: "최종 조정", exact: true }).click();
  await page.getByRole("button", { name: "B 판정 불러오기" }).click();
  await page.getByLabel("판정 사유").fill("예시 최종 위험");
  await page.getByRole("button", { name: "확정 판정 저장" }).click();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page
    .getByRole("button", { name: "분석 대시보드", exact: true })
    .click();
  await expect(
    page.getByText("일치 3 · 불일치 2 · 비교 5쌍 · 제외 1"),
  ).toBeVisible();
  await expect(page.getByText("4대 / 400m")).toBeVisible();
  await expect(page.getByText("1대 / 판정 완료 4대")).toBeVisible();
  await page.getByRole("button", { name: "조사 지도", exact: true }).click();
  await page
    .getByRole("button", { name: "30초 독립 판정 예시 판정 집계" })
    .click();
  await expect(
    page.getByText(/확정 공유 4대.*100m당 1대.*방해·위험 25%/),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "30초 판정 예시", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("불일치 · 조정 완료"),
  ).toBeVisible();
});
