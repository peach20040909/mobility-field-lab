import Dexie, { type Table } from "dexie";
import {
  sessionInputSchema,
  projectSchema,
  photoSchema,
  judgmentSchema,
  type Session,
  type SessionInput,
  type Segment,
  type Photo,
  type Observation,
  type Judgment,
  type ProjectExport,
} from "../domain/schema";
import { demoProject } from "../data/demo";
import { imagePayload, decodePhoto } from "../domain/photo";
import { analysisSchema } from "../ai/provider";
import type { ResearchRepository } from "./repository";
class Database extends Dexie {
  sessions!: Table<Session>;
  segments!: Table<Segment>;
  photos!: Table<Photo>;
  observations!: Table<Observation>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({
      sessions: "id,source",
      segments: "id,sessionId",
      photos: "id,segmentId",
      observations: "id,photoId,segmentId",
    });
  }
}
export class LocalRepository implements ResearchRepository {
  private db: Database;
  constructor(
    name = "mobility-field-lab-v1",
    private decoder: (url: string) => Promise<void> = decodePhoto,
  ) {
    this.db = new Database(name);
  }
  async saveAnalysis(photoId: string, input: unknown) {
    const clean = analysisSchema.parse(input);
    await this.db.transaction(
      "rw",
      [
        this.db.photos,
        this.db.observations,
        this.db.segments,
        this.db.sessions,
      ],
      async () => {
        const photo = await this.db.photos.get(photoId);
        if (
          !photo ||
          photo.analysis ||
          (await this.db.observations.where("photoId").equals(photoId).count())
        )
          throw new Error(
            "이미 기록된 사진에는 AI 판정을 다시 추가할 수 없습니다",
          );
        const segment = await this.db.segments.get(photo.segmentId);
        const session =
          segment && (await this.db.sessions.get(segment.sessionId));
        if (session?.source !== "field")
          throw new Error("실제 사진만 분석할 수 있습니다");
        const { observations, ...metadata } = clean;
        await this.db.photos.update(photoId, { analysis: metadata });
        for (const item of observations) {
          const id = crypto.randomUUID();
          const { bbox, ...judgment } = item;
          await this.db.observations.add({
            id,
            photoId,
            segmentId: photo.segmentId,
            canonicalDeviceId: id,
            kind: "unknown",
            bbox,
            judgments: { AI: judgment },
            history: [{ at: clean.timestamp, action: "AI", judgment }],
          });
        }
      },
    );
  }
  async createSession(input: SessionInput) {
    const clean = sessionInputSchema.parse(input);
    const session = {
      ...clean,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const segment = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      lengthM: clean.lengthM,
      relation: clean.relation,
      latitude: clean.latitude,
      longitude: clean.longitude,
    };
    await this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.segments,
      async () => {
        await this.db.sessions.add(session);
        await this.db.segments.add(segment);
      },
    );
    return session;
  }
  async exportProject(): Promise<ProjectExport> {
    return this.db.transaction(
      "r",
      this.db.sessions,
      this.db.segments,
      this.db.photos,
      this.db.observations,
      async () => ({
        version: 1,
        sessions: await this.db.sessions.toArray(),
        segments: await this.db.segments.toArray(),
        photos: await this.db.photos.toArray(),
        observations: await this.db.observations.toArray(),
      }),
    );
  }
  async importProject(input: unknown) {
    const p = projectSchema.parse(input);
    const unique = (xs: { id: string }[]) =>
      new Set(xs.map((x) => x.id)).size === xs.length;
    if (![p.sessions, p.segments, p.photos, p.observations].every(unique))
      throw new Error("중복 ID가 있습니다");
    for (const s of p.segments)
      if (!p.sessions.some((x) => x.id === s.sessionId))
        throw new Error("잘못된 구간 참조");
    const validatedImages = new Set<string>();
    for (const photo of p.photos) {
      const segment = p.segments.find((s) => s.id === photo.segmentId);
      if (!segment) throw new Error("잘못된 사진 참조");
      const source = p.sessions.find((s) => s.id === segment.sessionId)!.source;
      if (photo.dataUrl === "/demo-street.svg" && source === "demo") continue;
      imagePayload(photo.dataUrl);
      if (!validatedImages.has(photo.dataUrl)) {
        await this.decoder(photo.dataUrl);
        validatedImages.add(photo.dataUrl);
      }
    }
    for (const o of p.observations) {
      if (
        !p.photos.some((x) => x.id === o.photoId && x.segmentId === o.segmentId)
      )
        throw new Error("잘못된 관찰 참조");
      const target = p.observations.find((x) => x.id === o.canonicalDeviceId);
      if (!target) throw new Error("잘못된 중복 참조");
      const ownSession = p.segments.find(
        (s) => s.id === o.segmentId,
      )!.sessionId;
      const targetSession = p.segments.find(
        (s) => s.id === target.segmentId,
      )!.sessionId;
      if (
        target.canonicalDeviceId !== target.id ||
        ownSession !== targetSession
      )
        throw new Error("같은 조사 안의 대표 기기만 연결할 수 있습니다");
    }
    await this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.segments,
      this.db.photos,
      this.db.observations,
      async () => {
        const stable = (value: unknown): string =>
          JSON.stringify(value, (_key, val) =>
            val && typeof val === "object" && !Array.isArray(val)
              ? Object.keys(val)
                  .sort()
                  .reduce((out, key) => ({ ...out, [key]: val[key] }), {})
              : val,
          );
        for (const [table, rows] of [
          [this.db.sessions, p.sessions],
          [this.db.segments, p.segments],
          [this.db.photos, p.photos],
          [this.db.observations, p.observations],
        ] as const) {
          for (const row of rows) {
            const existing = await table.get(row.id);
            if (existing && stable(existing) !== stable(row))
              throw new Error(
                "기존 기록과 충돌하는 백업입니다. 최신 판정을 보호하기 위해 가져오지 않았습니다. 빈 브라우저에서 복원해 비교하세요.",
              );
          }
        }
        await this.db.sessions.bulkPut(p.sessions);
        await this.db.segments.bulkPut(p.segments);
        await this.db.photos.bulkPut(p.photos);
        await this.db.observations.bulkPut(p.observations);
      },
    );
  }
  async loadDemo() {
    const p = demoProject();
    const ids = p.sessions.map((s) => s.id);
    const existing = await this.db.sessions.bulkGet(ids);
    if (existing.every(Boolean)) return;
    await this.importProject(p);
  }
  async savePhoto(input: Omit<Photo, "id">) {
    const photo = photoSchema.parse({ ...input, id: crypto.randomUUID() });
    if (!(await this.db.segments.get(photo.segmentId)))
      throw new Error("구간을 찾지 못했습니다");
    imagePayload(photo.dataUrl);
    await this.decoder(photo.dataUrl);
    await this.db.photos.add(photo);
    return photo;
  }
  async registerPhoto(
    input: Omit<Photo, "id">,
    firstKind?: Observation["kind"],
  ) {
    const photo = photoSchema.parse({ ...input, id: crypto.randomUUID() });
    imagePayload(photo.dataUrl);
    await this.decoder(photo.dataUrl);
    return this.db.transaction(
      "rw",
      this.db.photos,
      this.db.observations,
      this.db.segments,
      async () => {
        if (!(await this.db.segments.get(photo.segmentId)))
          throw new Error("구간을 찾지 못했습니다");
        await this.db.photos.add(photo);
        const observation = firstKind
          ? await this.addObservation(photo.id, firstKind)
          : undefined;
        return { photo, observation };
      },
    );
  }
  async unlinkDuplicate(id: string) {
    await this.db.transaction("rw", this.db.observations, async () => {
      const o = await this.observation(id);
      await this.db.observations.put({ ...o, canonicalDeviceId: o.id });
    });
  }
  async addObservation(photoId: string, kind: Observation["kind"]) {
    const photo = await this.db.photos.get(photoId);
    if (!photo) throw new Error("사진을 찾지 못했습니다");
    const id = crypto.randomUUID();
    const observation: Observation = {
      id,
      photoId,
      segmentId: photo.segmentId,
      canonicalDeviceId: id,
      kind,
      judgments: {},
      history: [],
    };
    await this.db.observations.add(observation);
    return observation;
  }
  private async observation(id: string) {
    const o = await this.db.observations.get(id);
    if (!o) throw new Error("기기를 찾지 못했습니다");
    return o;
  }
  async submitJudgment(id: string, reviewer: "A" | "B", input: Judgment) {
    const j = judgmentSchema.parse(input);
    await this.db.transaction("rw", this.db.observations, async () => {
      const o = await this.observation(id);
      if (o.judgments[reviewer])
        throw new Error("이미 제출된 원판정은 변경할 수 없습니다");
      await this.db.observations.put({
        ...o,
        judgments: { ...o.judgments, [reviewer]: j },
        history: [
          ...(o.history ?? []),
          { at: new Date().toISOString(), action: reviewer, judgment: j },
        ],
      });
    });
  }
  async resolveJudgment(id: string, input: Judgment) {
    const j = judgmentSchema.parse(input);
    if (!j.reason.trim()) throw new Error("확정 사유를 기록해 주세요");
    await this.db.transaction("rw", this.db.observations, async () => {
      const o = await this.observation(id);
      if (!o.judgments.A || !o.judgments.B)
        throw new Error("두 사람의 판정을 먼저 제출해 주세요");
      await this.db.observations.put({
        ...o,
        kind: j.kind,
        final: j,
        history: [
          ...(o.history ?? []),
          { at: new Date().toISOString(), action: "resolve", judgment: j },
        ],
      });
    });
  }
  async getReviewView(id: string, reviewer: "A" | "B") {
    const o = await this.observation(id);
    if (o.judgments[reviewer]) return o;
    return { ...o, judgments: {}, final: undefined, history: [] };
  }
  async linkDuplicate(id: string, canonicalId: string) {
    await this.db.transaction(
      "rw",
      this.db.observations,
      this.db.segments,
      async () => {
        const o = await this.observation(id);
        const target = await this.observation(canonicalId);
        if (target.canonicalDeviceId !== target.id || target.id === id)
          throw new Error("대표 기기에만 연결할 수 있습니다");
        const a = await this.db.segments.get(o.segmentId),
          b = await this.db.segments.get(target.segmentId);
        if (a?.sessionId !== b?.sessionId)
          throw new Error("같은 조사 안의 기기만 연결할 수 있습니다");
        if (
          await this.db.observations
            .filter((x) => x.id !== id && x.canonicalDeviceId === id)
            .count()
        )
          throw new Error("다른 기기의 대표는 연결할 수 없습니다");
        await this.db.observations.put({ ...o, canonicalDeviceId: target.id });
      },
    );
  }
}
