import type { ProjectExport } from "./schema";
const cell = (s: unknown) => {
  let t = String(s ?? "");
  if (/^[=+\-@\t\r\n]/.test(t)) t = "'" + t;
  return '"' + t.replaceAll('"', '""') + '"';
};
export function toCsv(p: ProjectExport) {
  const header = [
    "source",
    "city",
    "place",
    "date",
    "segment_id",
    "distance_m",
    "device_id",
    "canonical_id",
    "kind",
    "final_status",
    "risks",
    "fallen",
    "A_status",
    "B_status",
    "AI_status",
    "reason",
    "AI_reason",
    "model_id",
    "model_version",
    "bbox",
    "count_mode",
    "prepared_source",
    "prepared_note",
    "photo_name",
  ];
  const rows = p.observations.map((o) => {
    const segment = p.segments.find((s) => s.id === o.segmentId);
    const session = p.sessions.find((s) => s.id === segment?.sessionId);
    const photo = p.photos.find((s) => s.id === o.photoId);
    return [
      session?.source,
      session?.city,
      session?.place,
      session?.date,
      o.segmentId,
      segment?.lengthM,
      o.id,
      o.canonicalDeviceId,
      o.final?.kind ?? o.kind,
      o.final?.status,
      o.final?.risks.join("|"),
      o.final?.fallen,
      o.judgments.A?.status,
      o.judgments.B?.status,
      o.judgments.AI?.status,
      o.final?.reason,
      o.judgments.AI?.reason,
      photo?.analysis?.modelId,
      photo?.analysis?.modelVersion,
      o.bbox?.join("|"),
      o.countMode ?? "device",
      photo?.preparedSource,
      photo?.preparedNote,
      photo?.name,
    ]
      .map(cell)
      .join(",");
  });
  for (const photo of p.photos) {
    if (p.observations.some((o) => o.photoId === photo.id)) continue;
    const segment = p.segments.find((s) => s.id === photo.segmentId);
    const session = p.sessions.find((s) => s.id === segment?.sessionId);
    const fields = Array<unknown>(header.length).fill("");
    const values: Record<string, unknown> = {
      source: session?.source,
      city: session?.city,
      place: session?.place,
      date: session?.date,
      segment_id: segment?.id,
      distance_m: segment?.lengthM,
      reason: "기기별 판정 미확정 · 사진 검토 메모",
      prepared_source: photo.preparedSource,
      prepared_note: photo.preparedNote,
      photo_name: photo.name,
    };
    header.forEach((key, index) => {
      if (key in values) fields[index] = values[key];
    });
    rows.push(fields.map(cell).join(","));
  }
  for (const segment of p.segments) {
    if (p.observations.some((o) => o.segmentId === segment.id)) continue;
    if (p.photos.some((photo) => photo.segmentId === segment.id)) continue;
    const session = p.sessions.find((s) => s.id === segment.sessionId);
    rows.push(
      [
        session?.source,
        session?.city,
        session?.place,
        session?.date,
        segment.id,
        segment.lengthM,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "기록된 기기 0대",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]
        .map(cell)
        .join(","),
    );
  }
  return "\uFEFF" + [header.join(","), ...rows].join("\r\n");
}
