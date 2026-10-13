import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const menus = [
  "프로젝트 개요",
  "조사 기록",
  "사진 판정 · 검수",
  "분석 대시보드",
  "조사 지도",
  "조사 방법",
];
const forbidden = ["면접", "재확인", "확인하지 않았"];
for (const width of [390, 768, 1024, 1440]) {
  test("render audit at " + width + "px", async ({ page }) => {
    const report: {
      view: string;
      source: string;
      hits: string[];
      scrollWidth: number;
    }[] = [];
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./");
    for (const source of ["field", "demo"]) {
      if (source === "demo") {
        await page
          .getByRole("button", { name: "예시 데이터로 둘러보기" })
          .click();
        await expect(
          page.getByText("예시 데이터가 준비되었습니다"),
        ).toBeVisible();
      }
      for (const menu of menus) {
        const opener = page.getByRole("button", { name: "메뉴 열기" });
        if (await opener.isVisible()) await opener.click();
        await page.getByRole("button", { name: menu, exact: true }).click();
        await expect(page.locator("h1")).toBeVisible();
        if (menu === "조사 지도")
          await expect(
            page.getByRole("img", { name: "조사 위치 지도" }),
          ).toBeVisible();
        const text = await page.locator("body").innerText();
        if (menu === "프로젝트 개요" || menu === "조사 지도") {
          for (const phrase of [
            "2026.10 확인",
            "주차면 263곳",
            "반경 100m",
            "1,700여 곳",
            "2025년 부상 666명",
            "2027년 1월부터 공유 킥보드 금지 예정 (12월이 마지막 운행)",
            "약 1.5만 대 퇴출",
            "공유 전기자전거는 운영 중",
            "공유 전기자전거·스쿠터는 허가",
          ])
            expect(text).toContain(phrase);
        }
        const hits = forbidden.filter((word) => text.includes(word));
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        report.push({ view: menu, source, hits, scrollWidth });
        expect(hits).toEqual([]);
        expect(scrollWidth).toBeLessThanOrEqual(width);
        if (
          source === "demo" &&
          ["사진 판정 · 검수", "분석 대시보드", "조사 지도"].includes(menu)
        )
          await expect(page.locator(".demo-notice").first()).toBeVisible();
        if (source === "demo" && menu === "사진 판정 · 검수") {
          await page.getByRole("button", { name: "검수하기" }).first().click();
          await expect(page.locator(".modal .demo-notice")).toBeVisible();
          const modal = page.locator(".modal");
          const box = await modal.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          const modalText = await modal.innerText();
          report.push({
            view: "검수 팝업",
            source,
            hits: forbidden.filter((word) => modalText.includes(word)),
            scrollWidth: box!.width,
          });
          expect(forbidden.filter((word) => modalText.includes(word))).toEqual(
            [],
          );
          await page.screenshot({
            path: "docs/screenshots/review-" + width + ".png",
          });
          await page.getByRole("button", { name: "닫기", exact: true }).click();
        }
        if (source === "demo" && menu === "조사 지도")
          await page.screenshot({
            path: "docs/screenshots/map-" + width + ".png",
            fullPage: true,
          });
      }
      const opener = page.getByRole("button", { name: "메뉴 열기" });
      if (await opener.isVisible()) await opener.click();
      await page
        .getByRole("button", { name: "프로젝트 개요", exact: true })
        .click();
    }
    mkdirSync("docs/validation", { recursive: true });
    writeFileSync(
      "docs/validation/2026-10-13-render-" + width + ".json",
      JSON.stringify(report, null, 2),
    );
  });
}
