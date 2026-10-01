import { z } from "zod";
import {
  analysisMetadataSchema,
  bboxSchema,
  judgmentSchema,
} from "../domain/schema";
export const analysisSchema = analysisMetadataSchema
  .extend({
    observations: z
      .array(judgmentSchema.extend({ bbox: bboxSchema }).strict())
      .max(100),
  })
  .strict();
export type AnalysisResult = z.infer<typeof analysisSchema>;
export const LOCAL_VISION_URL = "http://127.0.0.1:8765";
export async function analyzePhoto(
  photo: Blob,
  token: string,
  request: typeof fetch = fetch,
): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const body = new FormData();
    body.append(
      "photo",
      photo,
      "photo." +
        (photo.type === "image/png"
          ? "png"
          : photo.type === "image/webp"
            ? "webp"
            : "jpg"),
    );
    const response = await request(LOCAL_VISION_URL + "/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body,
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        "AI 응답을 받지 못했습니다. 수동 검수를 계속할 수 있습니다.",
      );
    return analysisSchema.parse(await response.json());
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "AI 분석이 60초를 초과했습니다. 수동 검수를 계속할 수 있습니다.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
