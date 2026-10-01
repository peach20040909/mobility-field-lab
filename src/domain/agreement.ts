import type { Judgment } from "./schema";
export type JudgmentPair = { left?: Judgment; right?: Judgment };
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
    (p) => p.left!.status === p.right!.status && p.left!.kind === p.right!.kind,
  ).length;
  return {
    matched,
    total: valid.length,
    excluded: pairs.length - valid.length,
    rate: valid.length ? matched / valid.length : null,
  };
}
