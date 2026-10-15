import "fake-indexeddb/auto";
import { test, expect } from "vitest";
import { LocalRepository } from "../../src/storage/indexeddb";
import { HONGDAE_DEMO_ID } from "../../src/data/hongdae";
test("prepared Hongdae seed keeps human changes and survives JSON backup restore", async () => {
  const repo = new LocalRepository(
    "hongdae-" + crypto.randomUUID(),
    async () => {},
  );
  await repo.loadHongdaeDemo();
  const p = await repo.exportProject();
  expect(p.photos.length).toBe(25);
  expect(p.observations.length).toBe(4);
  expect(p.sessions[0].source).toBe("demo");
  const original = p.observations.find(
    (o) => o.id === HONGDAE_DEMO_ID + "-03",
  )!;
  await repo.resolveJudgment(original.id, {
    ...original.judgments.B!,
    reason: "Human saved review",
  });
  await repo.loadHongdaeDemo();
  const saved = await repo.exportProject();
  const updated = saved.observations.find((o) => o.id === original.id)!;
  expect(updated.judgments.A).toEqual(original.judgments.A);
  expect(updated.judgments.AI).toEqual(original.judgments.AI);
  expect(updated.final?.reason).toBe("Human saved review");
  const restored = new LocalRepository(
    "hongdae-restore-" + crypto.randomUUID(),
    async () => {},
  );
  await restored.importProject(JSON.parse(JSON.stringify(saved)));
  expect((await restored.exportProject()).observations).toEqual(
    saved.observations,
  );
  const bad = JSON.parse(JSON.stringify(p));
  bad.photos[0].dataUrl = "/private.png";
  await expect(
    new LocalRepository(
      "hongdae-invalid-" + crypto.randomUUID(),
      async () => {},
    ).importProject(bad),
  ).rejects.toThrow();
});
