import type { Judgment } from "./schema";
export type JudgmentPair = { left?: Judgment; right?: Judgment };
export function getReviewStatus(judgments: { A?: Judgment; B?: Judgment }) {
  const { A, B } = judgments;
  if (!A || !B) return "pending";
  const risks = (j: Judgment) => [...new Set(j.risks)].sort().join("|");
  return A.kind === B.kind &&
    A.status === B.status &&
    A.fallen === B.fallen &&
    risks(A) === risks(B)
    ? "matched"
    : "mismatch";
}
export function computeAgreement(pairs: JudgmentPair[]) {
  const valid = pairs.filter(
    (p) =>
      p.left &&
      p.right &&
      p.left.status !== "unassessable" &&
      p.right.status !== "unassessable" &&
      p.left.kind !== "unknown" &&
      p.right.kind !== "unknown",
  );
  const matched = valid.filter(
    (p) => getReviewStatus({ A: p.left, B: p.right }) === "matched",
  ).length;
  return {
    matched,
    total: valid.length,
    excluded: pairs.length - valid.length,
    rate: valid.length ? matched / valid.length : null,
  };
}
