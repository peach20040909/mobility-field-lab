import { test, expect } from "vitest";
import { computeMetrics } from "../../src/domain/metrics";
import { reviewDemoProject } from "../../src/data/demo";
test("an occluded device group is not counted as one measured device", () => {
  const p = reviewDemoProject();
  const group = { ...p.observations[0], countMode: "group" as const };
  const result = computeMetrics(p.segments, [group]);
  expect(result.total).toBe(0);
  expect(result.ratio).toBe(null);
});
