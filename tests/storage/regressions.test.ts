import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { LocalRepository } from "../../src/storage/indexeddb";
import { computeMetrics } from "../../src/domain/metrics";
import type { Judgment } from "../../src/domain/schema";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/c2sAAAAASUVORK5CYII=";
const j: Judgment = {
  kind: "shared-scooter",
  status: "normal",
  risks: [],
  fallen: false,
  reason: "대표 기기",
};
const setup = async () => {
  const repo = new LocalRepository(
    "fix-" + crypto.randomUUID(),
    async () => {},
  );
  await repo.loadDemo();
  return { repo, p: await repo.exportProject() };
};
it("stale restore cannot erase newer judgments or history", async () => {
  const { repo, p } = await setup();
  const id = p.observations.find((o) => !o.final)!.id;
  await repo.submitJudgment(id, "A", j);
  await expect(repo.importProject(p)).rejects.toThrow();
  expect(
    (await repo.exportProject()).observations.find((o) => o.id === id)!
      .judgments.A,
  ).toEqual(j);
});
it("identical restore is idempotent", async () => {
  const { repo, p } = await setup();
  await repo.importProject(p);
  expect((await repo.exportProject()).observations).toHaveLength(
    p.observations.length,
  );
});
it.each([
  "https://tracker.invalid/photo",
  "//tracker.invalid/photo",
  "",
  "data:image/png;base64,AAAA",
  "data:image/svg+xml;base64,PHN2Zy8+",
])("rejects unsafe or invalid imported photo %s", async (url) => {
  const { repo, p } = await setup();
  p.photos[0].dataUrl = url;
  await expect(repo.importProject(p)).rejects.toThrow();
  expect((await repo.exportProject()).photos[0].dataUrl).toBe(
    "/demo-street.svg",
  );
});
it("rejects decoded image failure before writes", async () => {
  const repo = new LocalRepository(
    "decode-" + crypto.randomUUID(),
    async () => {
      throw new Error("cannot decode");
    },
  );
  const { p } = await setup();
  p.photos[0].dataUrl = png;
  await expect(repo.importProject(p)).rejects.toThrow();
  expect((await repo.exportProject()).sessions).toHaveLength(0);
});
it.each(["cycle", "chain", "cross-session"])(
  "rejects duplicate graph %s",
  async (mode) => {
    const { repo, p } = await setup();
    const [a, b, c] = p.observations;
    if (mode === "cycle") {
      a.canonicalDeviceId = b.id;
      b.canonicalDeviceId = a.id;
    } else if (mode === "chain") {
      a.canonicalDeviceId = b.id;
      b.canonicalDeviceId = c.id;
    } else
      a.canonicalDeviceId = p.observations.find(
        (o) => o.segmentId !== a.segmentId,
      )!.id;
    await expect(repo.importProject(p)).rejects.toThrow();
  },
);
it("canonical resolution determines metrics regardless of duplicate order", () => {
  const seg = {
    id: "s",
    sessionId: "a",
    lengthM: 100,
    relation: "single" as const,
    latitude: 37,
    longitude: 127,
  };
  const a = {
    id: "a",
    photoId: "p",
    segmentId: "s",
    canonicalDeviceId: "a",
    kind: "shared-scooter" as const,
    judgments: {},
    final: j,
  };
  const b = {
    ...a,
    id: "b",
    canonicalDeviceId: "a",
    final: { ...j, status: "danger" as const },
  };
  expect(computeMetrics([seg], [b, a]).ratio).toBe(0);
  expect(computeMetrics([seg], [a, b]).ratio).toBe(0);
  expect(
    computeMetrics([seg], [{ ...a, final: { ...j, kind: "private" } }, b])
      .total,
  ).toBe(0);
  expect(computeMetrics([seg], [{ ...a, final: undefined }, b]).judged).toBe(0);
});
it("link and unlink restores distinct device count after reopening", async () => {
  const { repo, p } = await setup();
  const [a, b] = p.observations;
  await repo.linkDuplicate(b.id, a.id);
  await repo.unlinkDuplicate(b.id);
  const fresh = await repo.exportProject();
  expect(fresh.observations.find((o) => o.id === b.id)!.canonicalDeviceId).toBe(
    b.id,
  );
});
it("photo-only registration produces no phantom shared device", async () => {
  const { repo, p } = await setup();
  const result = await repo.registerPhoto({
    segmentId: p.segments[0].id,
    name: "empty.png",
    dataUrl: png,
    redacted: false,
    publicationReviewed: false,
  });
  const fresh = await repo.exportProject();
  expect(fresh.photos.some((x) => x.id === result.photo.id)).toBe(true);
  expect(fresh.observations.some((x) => x.photoId === result.photo.id)).toBe(
    false,
  );
});
it("failed first-observation write also rolls back photo", async () => {
  const { repo, p } = await setup();
  const db = (
    repo as unknown as {
      db: { observations: { hook: (a: string, b: () => never) => void } };
    }
  ).db;
  db.observations.hook("creating", () => {
    throw new Error("QuotaExceededError");
  });
  await expect(
    repo.registerPhoto(
      {
        segmentId: p.segments[0].id,
        name: "test.png",
        dataUrl: png,
        redacted: false,
        publicationReviewed: false,
      },
      "shared-scooter",
    ),
  ).rejects.toThrow();
  expect((await repo.exportProject()).photos).toHaveLength(p.photos.length);
});
it("restores backups larger than 50MB without truncating photos", async () => {
  const { p } = await setup();
  const large =
    "data:image/jpeg;base64," +
    btoa("\xff\xd8" + "a".repeat(7 * 1024 * 1024) + "\xff\xd9");
  for (let i = 0; i < 6; i++)
    p.photos.push({
      id: "big-" + i,
      segmentId: p.segments[0].id,
      name: "large.jpg",
      dataUrl: large,
      redacted: false,
      publicationReviewed: false,
    });
  expect(JSON.stringify(p).length).toBeGreaterThan(50 * 1024 * 1024);
  const fresh = new LocalRepository(
    "big-" + crypto.randomUUID(),
    async () => {},
  );
  await fresh.importProject(p);
  expect((await fresh.exportProject()).photos).toHaveLength(p.photos.length);
});
