import { test, expect } from "vitest";
import { hongdaeDemoProject } from "../../src/data/hongdae";
import { toCsv } from "../../src/domain/export";
test("prepared CSV retains every photo-only review note without inventing device counts", () => {
  const p = hongdaeDemoProject();
  const csv = toCsv(p);
  expect(csv).toContain(p.photos[24].preparedNote);
  expect(csv).toContain("기기별 판정 미확정");
  expect(csv.split("\r\n").length).toBe(30);
});
