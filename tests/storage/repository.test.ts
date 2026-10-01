import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { LocalRepository } from "../../src/storage/indexeddb";
import { projectSchema } from "../../src/domain/schema";
const input = {
  city: "seoul",
  place: "홍대",
  date: "2026-10-01",
  time: "13:00",
  timezone: "Asia/Seoul",
  weather: "맑음",
  lengthM: 400,
  relation: "inside" as const,
  latitude: 37.55,
  longitude: 126.92,
  source: "field" as const,
};
it("persists a session after reopening the database", async () => {
  const name = "persist-" + crypto.randomUUID();
  const a = new LocalRepository(name);
  await a.createSession(input);
  const b = new LocalRepository(name);
  expect((await b.exportProject()).sessions[0].place).toBe("홍대");
});
it("rejects invalid registration without writing", async () => {
  const repo = new LocalRepository("invalid-" + crypto.randomUUID());
  await expect(repo.createSession({ ...input, lengthM: 0 })).rejects.toThrow();
  expect((await repo.exportProject()).sessions).toHaveLength(0);
});
it("stores demo separately from real sessions", async () => {
  const repo = new LocalRepository("demo-" + crypto.randomUUID());
  await repo.createSession(input);
  await repo.loadDemo();
  const project = await repo.exportProject();
  expect(project.sessions.filter((s) => s.source === "field")).toHaveLength(1);
  expect(project.sessions.some((s) => s.source === "demo")).toBe(true);
  await repo.loadDemo();
  expect((await repo.exportProject()).sessions.length).toBe(
    project.sessions.length,
  );
});
it("rejects an invalid import without modifying existing records", async () => {
  const repo = new LocalRepository("import-" + crypto.randomUUID());
  await repo.createSession(input);
  await expect(
    repo.importProject({
      version: 1,
      sessions: [],
      segments: [{ latitude: 200 }],
      photos: [],
      observations: [],
    }),
  ).rejects.toThrow();
  expect((await repo.exportProject()).sessions).toHaveLength(1);
});
it("project export is versioned and importable", async () => {
  const repo = new LocalRepository("export-" + crypto.randomUUID());
  await repo.createSession(input);
  expect(projectSchema.safeParse(await repo.exportProject()).success).toBe(
    true,
  );
});
