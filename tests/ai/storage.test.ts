import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { LocalRepository } from "../../src/storage/indexeddb";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/c2sAAAAASUVORK5CYII=";
const result = {
  modelId: "Qwen/Qwen3-VL-2B-Instruct",
  modelVersion: "rev",
  timestamp: new Date().toISOString(),
  seconds: 1,
  observations: [
    {
      kind: "unknown",
      status: "unassessable",
      risks: [],
      fallen: false,
      reason: "hidden",
      bbox: [0, 0, 1, 1],
    },
  ],
  warnings: [],
};
async function setup() {
  const repo = new LocalRepository("ai-" + crypto.randomUUID(), async () => {});
  await repo.createSession({
    city: "seoul",
    place: "test",
    date: "2026-10-01",
    time: "10:00",
    timezone: "Asia/Seoul",
    weather: "clear",
    source: "field",
    lengthM: 400,
    relation: "single",
    latitude: 37,
    longitude: 127,
  });
  const p = await repo.exportProject();
  const { photo } = await repo.registerPhoto({
    segmentId: p.segments[0].id,
    name: "a",
    dataUrl: png,
    redacted: false,
    publicationReviewed: false,
  });
  return { repo, photo };
}
it("saves model provenance and AI judgment without human or final labels", async () => {
  const { repo, photo } = await setup();
  await repo.saveAnalysis(photo.id, result);
  const p = await repo.exportProject();
  expect(p.observations[0].judgments.AI?.kind).toBe("unknown");
  expect(p.observations[0].final).toBeUndefined();
  expect(p.photos[0].analysis?.modelVersion).toBe("rev");
});
it("cannot reanalyze an existing manual or AI record", async () => {
  const { repo, photo } = await setup();
  await repo.addObservation(photo.id, "private");
  await expect(repo.saveAnalysis(photo.id, result)).rejects.toThrow();
  expect((await repo.exportProject()).observations).toHaveLength(1);
});
it("malformed output does not write anything", async () => {
  const { repo, photo } = await setup();
  await expect(
    repo.saveAnalysis(photo.id, { ...result, observations: [{}] }),
  ).rejects.toThrow();
  expect((await repo.exportProject()).observations).toHaveLength(0);
});
