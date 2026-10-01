import type { ProjectExport, Judgment } from "../domain/schema";
import { cities } from "./cities";
export function demoProject(): ProjectExport {
  const sessions = cities
    .slice(0, 5)
    .map((c) => ({
      id: "demo-" + c.id,
      city: c.id,
      place: c.place,
      date: "2026-10-01",
      time: "13:00",
      timezone: c.id === "seoul" ? "Asia/Seoul" : "Europe/Paris",
      weather: "맑음",
      source: "demo" as const,
      lengthM: 400,
      relation: "single" as const,
      latitude: c.lat,
      longitude: c.lng,
      createdAt: "2026-10-01T00:00:00Z",
    }));
  const segments = sessions.map((s) => ({
    id: s.id + "-segment",
    sessionId: s.id,
    lengthM: s.lengthM,
    relation: s.relation,
    latitude: s.latitude,
    longitude: s.longitude,
  }));
  const photos = segments.map((s, i) => ({
    id: "demo-photo-" + i,
    segmentId: s.id,
    name: "합성 관찰 도식",
    dataUrl: "/demo-street.svg",
    redacted: true,
    publicationReviewed: true,
  }));
  const observations = segments.flatMap((s, i) =>
    Array.from({ length: [12, 8, 10, 6, 4][i] }, (_, n) => {
      const status =
        n % 5 === 0 ? "danger" : n % 3 === 0 ? "obstruction" : "normal";
      const j: Judgment = {
        kind: n % 2 === 0 ? "shared-ebike" : "shared-scooter",
        status,
        risks: status === "danger" ? ["tactile"] : [],
        fallen: n % 7 === 0,
        reason: "흐름 시연을 위한 합성 판정 · 실제 조사 결과 아님",
      };
      return {
        id: "demo-device-" + i + "-" + n,
        photoId: photos[i].id,
        segmentId: s.id,
        canonicalDeviceId: "demo-device-" + i + "-" + n,
        kind: j.kind,
        judgments:
          n === 0
            ? {}
            : {
                A: j,
                B: { ...j, status: n === 2 ? "obstruction" : j.status },
                AI: j,
              },
        final: n === 0 ? undefined : j,
        history: [],
      };
    }),
  );
  return { version: 1, sessions, segments, photos, observations };
}
