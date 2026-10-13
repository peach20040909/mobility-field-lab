import type { Segment, Observation } from "./schema";
export function computeMetrics(
  segments: Segment[],
  observations: Observation[],
) {
  if (segments.some((s) => !Number.isFinite(s.lengthM) || s.lengthM <= 0))
    throw new Error("측정 거리는 0보다 커야 합니다");
  const scope = new Map(segments.map((s) => [s.id, s.sessionId]));
  const unique = new Map<string, Observation>();
  for (const o of observations) {
    if (!scope.has(o.segmentId)) continue;
    const key = scope.get(o.segmentId) + "/" + o.canonicalDeviceId;
    if (o.id === o.canonicalDeviceId) unique.set(key, o);
  }
  const candidates = [...unique.values()].filter(
    (o) => o.countMode !== "group",
  );
  const rows = candidates.filter(
    (o) => o.final && ["shared-scooter", "shared-ebike"].includes(o.final.kind),
  );
  const judged = rows.filter(
    (o) => o.final && o.final.status !== "unassessable",
  );
  const bad = judged.filter(
    (o) => o.final!.status === "obstruction" || o.final!.status === "danger",
  );
  const risks: Record<string, number> = {};
  for (const o of judged)
    for (const r of new Set(o.final!.risks)) risks[r] = (risks[r] ?? 0) + 1;
  const distance = segments.reduce((n, s) => n + s.lengthM, 0);
  return {
    total: rows.length,
    distance,
    density: distance ? (rows.length / distance) * 100 : 0,
    ratio: judged.length ? bad.length / judged.length : null,
    judged: judged.length,
    bad: bad.length,
    unreviewed: candidates.filter((o) => !o.final).length,
    unassessable: rows.filter((o) => o.final?.status === "unassessable").length,
    risks,
    fallen: judged.filter((o) => o.final!.fallen).length,
  };
}
