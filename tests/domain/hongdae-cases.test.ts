import { test, expect } from "vitest";
import { hongdaeCases, hongdaeDemoProject } from "../../src/data/hongdae";
import { computeMetrics } from "../../src/domain/metrics";
test("Hongdae shows normal, obstruction and danger with a single estimated cluster", () => {
  expect(hongdaeCases).toHaveLength(4);
  expect(hongdaeCases[1].judgment.status).toBe("obstruction");
  expect(hongdaeCases[3]).toMatchObject({
    key: "04",
    group: true,
    estimatedCount: 5,
  });
  const p = hongdaeDemoProject();
  const initial = computeMetrics(p.segments, p.observations);
  expect(initial).toMatchObject({
    total: 7,
    bad: 6,
    judged: 7,
    estimated: 5,
    unreviewed: 1,
  });
  expect(initial.density).toBeCloseTo(3.5);
  p.observations[2].final = p.observations[2].judgments.B;
  const final = computeMetrics(p.segments, p.observations);
  expect(final).toMatchObject({
    total: 8,
    bad: 7,
    density: 4,
    risks: { exit: 6, tactile: 1 },
  });
  expect(final.ratio).toBe(7 / 8);
});
