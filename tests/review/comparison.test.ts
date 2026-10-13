import { it, expect } from "vitest";
import { getReviewStatus, computeAgreement } from "../../src/domain/agreement";
import { reviewDemoProject } from "../../src/data/demo";
const a = {
  kind: "shared-scooter" as const,
  status: "normal" as const,
  risks: [] as ("tactile" | "exit")[],
  fallen: false,
  reason: "A reason",
};
it("keeps incomplete pairs pending", () =>
  expect(getReviewStatus({ A: a })).toBe("pending"));
it("compares all categorical fields but ignores free text and risk ordering", () => {
  expect(getReviewStatus({ A: a, B: { ...a, reason: "B reason" } })).toBe(
    "matched",
  );
  expect(getReviewStatus({ A: a, B: { ...a, risks: ["exit"] } })).toBe(
    "mismatch",
  );
  expect(getReviewStatus({ A: a, B: { ...a, fallen: true } })).toBe("mismatch");
  expect(
    getReviewStatus({
      A: { ...a, risks: ["exit", "tactile"] },
      B: { ...a, risks: ["tactile", "exit"] },
    }),
  ).toBe("matched");
  expect(
    computeAgreement([{ left: a, right: { ...a, fallen: true } }]).matched,
  ).toBe(0);
});
it("short demonstration has 3 matches and 2 unresolved disagreements", () => {
  const p = reviewDemoProject();
  expect(
    computeAgreement(
      p.observations.map((o) => ({
        left: o.judgments.A,
        right: o.judgments.B,
      })),
    ),
  ).toMatchObject({ matched: 3, total: 5, rate: 0.6 });
  const disagreements = p.observations.filter(
    (o) => getReviewStatus(o.judgments) === "mismatch",
  );
  expect(disagreements).toHaveLength(2);
  expect(disagreements.every((o) => !o.final)).toBe(true);
});
