import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { LocalRepository } from "../../src/storage/indexeddb";
import { toCsv } from "../../src/domain/export";
const setup = async () => {
  const repo = new LocalRepository("review-" + crypto.randomUUID());
  await repo.loadDemo();
  const p = await repo.exportProject();
  const target = p.observations.find((o) => !o.final)!;
  return { repo, id: target.id, p };
};
const judgment = {
  kind: "shared-scooter" as const,
  status: "danger" as const,
  risks: ["tactile" as const],
  fallen: false,
  reason: "점자블록 위",
};
it("hides other and AI verdicts before independent submission", async () => {
  const { repo, id } = await setup();
  await repo.submitJudgment(id, "A", judgment);
  const view = await repo.getReviewView(id, "B");
  expect(view.judgments.A).toBeUndefined();
  expect(view.judgments.AI).toBeUndefined();
  const own = await repo.getReviewView(id, "A");
  expect(own.judgments.A).toEqual(judgment);
  expect(own.final).toBeUndefined();
  expect(own.history).toEqual([]);
});
it("preserves original judgments and rejects overwriting", async () => {
  const { repo, id } = await setup();
  await repo.submitJudgment(id, "A", judgment);
  await expect(
    repo.submitJudgment(id, "A", { ...judgment, status: "normal" }),
  ).rejects.toThrow();
  expect(
    (await repo.exportProject()).observations.find((o) => o.id === id)!
      .judgments.A!.status,
  ).toBe("danger");
});
it("requires both original judgments before resolution", async () => {
  const { repo, id } = await setup();
  await repo.submitJudgment(id, "A", judgment);
  await expect(repo.resolveJudgment(id, judgment)).rejects.toThrow();
  await repo.submitJudgment(id, "B", {
    ...judgment,
    status: "normal",
    risks: [],
  });
  await repo.resolveJudgment(id, judgment);
  expect(
    (await repo.exportProject()).observations.find((o) => o.id === id)!.final!
      .status,
  ).toBe("danger");
});
it("rejects invalid duplicate links", async () => {
  const { repo, id } = await setup();
  await expect(repo.linkDuplicate(id, "missing")).rejects.toThrow();
});
it("escapes spreadsheet formula and retains source in csv", async () => {
  const { p } = await setup();
  p.sessions[0].place = '=HYPERLINK("bad")';
  const csv = toCsv(p);
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("demo");
});
