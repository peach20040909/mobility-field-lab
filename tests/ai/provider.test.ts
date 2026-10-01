import { it, expect, vi } from "vitest";
import { analyzePhoto, analysisSchema } from "../../src/ai/provider";
const item = {
  kind: "unknown",
  status: "unassessable",
  risks: [],
  fallen: false,
  reason: "branding hidden",
  bbox: [0.1, 0.2, 0.4, 0.8],
};
const result = {
  modelId: "Qwen/Qwen3-VL-2B-Instruct",
  modelVersion: "revision",
  timestamp: new Date().toISOString(),
  seconds: 1,
  observations: [item],
  warnings: [],
};
it("preserves unknown ownership", () =>
  expect(analysisSchema.parse(result).observations[0].kind).toBe("unknown"));
it.each([
  [0, 0, 2, 1],
  [0.5, 0, 0.1, 1],
  [0, 0, 0, 0],
])("rejects invalid bbox %j", (a, b, c, d) =>
  expect(() =>
    analysisSchema.parse({
      ...result,
      observations: [{ ...item, bbox: [a, b, c, d] }],
    }),
  ).toThrow(),
);
it("rejects malformed successful HTTP responses", async () => {
  const request = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ observations: [{}] })));
  await expect(
    analyzePhoto(new Blob(["x"]), "test", request),
  ).rejects.toThrow();
});
it("does not substitute demo on service failure", async () => {
  await expect(
    analyzePhoto(
      new Blob(["x"]),
      "test",
      vi.fn().mockResolvedValue(new Response("failure", { status: 503 })),
    ),
  ).rejects.toThrow("수동");
});
it("cancels after 60 seconds", async () => {
  vi.useFakeTimers();
  const request = vi.fn(
    (_url, options) =>
      new Promise<Response>((_resolve, reject) =>
        options.signal.addEventListener("abort", () =>
          reject(new Error("timeout")),
        ),
      ),
  );
  const pending = expect(
    analyzePhoto(new Blob(["x"]), "test", request),
  ).rejects.toThrow("60초");
  await vi.advanceTimersByTimeAsync(60000);
  await pending;
  vi.useRealTimers();
});
