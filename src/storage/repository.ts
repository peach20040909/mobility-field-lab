import type {
  SessionInput,
  Session,
  Photo,
  Observation,
  Judgment,
  ProjectExport,
} from "../domain/schema";
export interface ResearchRepository {
  createSession(input: SessionInput): Promise<Session>;
  exportProject(): Promise<ProjectExport>;
  importProject(input: unknown): Promise<void>;
  loadDemo(): Promise<void>;
  savePhoto(input: Omit<Photo, "id">): Promise<Photo>;
  addObservation(
    photoId: string,
    kind: Observation["kind"],
  ): Promise<Observation>;
  submitJudgment(
    id: string,
    reviewer: "A" | "B",
    judgment: Judgment,
  ): Promise<void>;
  resolveJudgment(id: string, judgment: Judgment): Promise<void>;
  getReviewView(id: string, reviewer: "A" | "B"): Promise<Observation>;
  linkDuplicate(id: string, canonicalId: string): Promise<void>;
}
