import { z } from "zod";
export const kindSchema = z.enum([
  "shared-scooter",
  "shared-ebike",
  "private",
  "unknown",
]);
export const statusSchema = z.enum([
  "normal",
  "obstruction",
  "danger",
  "unassessable",
]);
export const riskSchema = z.enum([
  "tactile",
  "crosswalk",
  "exit",
  "bus",
  "road",
]);
export const judgmentSchema = z.object({
  kind: kindSchema,
  status: statusSchema,
  risks: z.array(riskSchema),
  fallen: z.boolean(),
  reason: z.string().max(2000),
});
export type Judgment = z.infer<typeof judgmentSchema>;
export type DeviceKind = Judgment["kind"];
export type Status = Judgment["status"];
const coordinates = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};
export const sessionInputSchema = z.object({
  city: z.string().min(1),
  place: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
  weather: z.string().min(1),
  source: z.enum(["demo", "field"]),
  lengthM: z.number().positive().max(100000),
  relation: z.enum(["inside", "outside", "near", "far", "single"]),
  ...coordinates,
});
export type SessionInput = z.infer<typeof sessionInputSchema>;
export const sessionSchema = sessionInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;
export const segmentSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  lengthM: z.number().positive(),
  relation: sessionInputSchema.shape.relation,
  ...coordinates,
});
export type Segment = z.infer<typeof segmentSchema>;
export const bboxSchema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .refine(
    ([a, b, c, d]) => a >= 0 && b >= 0 && a < c && b < d && c <= 1 && d <= 1,
    "Invalid normalized bbox",
  );
export const analysisMetadataSchema = z.object({
  modelId: z.string().min(1),
  modelVersion: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  seconds: z.number().nonnegative().max(60),
  warnings: z.array(z.string()),
});
export const photoSchema = z.object({
  id: z.string(),
  segmentId: z.string(),
  name: z.string(),
  dataUrl: z.string().max(15000000),
  redacted: z.boolean(),
  publicationReviewed: z.boolean(),
  analysis: analysisMetadataSchema.optional(),
  preparedSource: z.string().max(1000).optional(),
  preparedNote: z.string().max(2000).optional(),
});
export type Photo = z.infer<typeof photoSchema>;
export const observationSchema = z.object({
  id: z.string(),
  photoId: z.string(),
  segmentId: z.string(),
  canonicalDeviceId: z.string(),
  kind: kindSchema,
  bbox: bboxSchema.optional(),
  countMode: z.enum(["device", "group"]).optional(),
  estimatedCount: z.number().int().min(1).max(100).optional(),
  judgments: z.object({
    A: judgmentSchema.optional(),
    B: judgmentSchema.optional(),
    AI: judgmentSchema.optional(),
  }),
  final: judgmentSchema.optional(),
  history: z
    .array(
      z.object({
        at: z.string(),
        action: z.string(),
        judgment: judgmentSchema,
      }),
    )
    .optional(),
});
export type Observation = z.infer<typeof observationSchema>;
export const projectSchema = z.object({
  version: z.literal(1),
  sessions: z.array(sessionSchema),
  segments: z.array(segmentSchema),
  photos: z.array(photoSchema),
  observations: z.array(observationSchema),
});
export type ProjectExport = z.infer<typeof projectSchema>;
export const kindLabels: Record<DeviceKind, string> = {
  "shared-scooter": "공유 킥보드",
  "shared-ebike": "공유 전기자전거",
  private: "개인 기기",
  unknown: "공유 여부 불명",
};
export const statusLabels: Record<Status, string> = {
  normal: "○ 정상",
  obstruction: "△ 통행 방해",
  danger: "× 위험",
  unassessable: "판정 불가",
};
export const riskLabels: Record<Judgment["risks"][number], string> = {
  tactile: "점자블록",
  crosswalk: "횡단보도",
  exit: "역 출구",
  bus: "정류소",
  road: "차도",
};
