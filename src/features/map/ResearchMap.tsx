"use client";
import { useEffect, useRef } from "react";
import type { Session, Segment, Observation } from "@/domain/schema";
import { computeMetrics } from "@/domain/metrics";
import { HONGDAE_DEMO_ID } from "@/data/hongdae";
import "leaflet/dist/leaflet.css";
export default function ResearchMap({
  sessions,
  segments,
  observations,
}: {
  sessions: Session[];
  segments: Segment[];
  observations: Observation[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    void import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, {
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      }).setView([47, 8], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      const points: [number, number][] = [];
      sessions.forEach((s) => {
        const localSegments = segments.filter((g) => g.sessionId === s.id);
        const m = computeMetrics(localSegments, observations);
        const fmt = (n: number) =>
          n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
        points.push([s.latitude, s.longitude]);
        const content = document.createElement("div");
        content.textContent =
          s.place +
          " · " +
          (s.id === HONGDAE_DEMO_ID
            ? "홍대 사전 판정 예시 · 위치·거리 시연 설정"
            : s.source === "demo"
              ? "합성 예시"
              : "실제 조사") +
          " · " +
          s.lengthM +
          "m · 확정 공유 " +
          m.total +
          "대 · 100m당 " +
          fmt(m.density) +
          "대 · 방해·위험 " +
          (m.ratio === null ? "산출 불가" : fmt(m.ratio * 100) + "%") +
          " · 미확정 " +
          m.unreviewed +
          "대";
        const marker = L.circleMarker([s.latitude, s.longitude], {
          radius: 9,
          color: "#315948",
          fillColor: m.bad ? "#b85c42" : m.judged ? "#315948" : "#9da79a",
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map!)
          .bindPopup(content);
        const element = marker.getElement();
        element?.setAttribute("role", "button");
        element?.setAttribute("tabindex", "0");
        element?.setAttribute("aria-label", s.place + " 판정 집계");
        element?.addEventListener("keydown", (event) => {
          if (
            (event as KeyboardEvent).key === "Enter" ||
            (event as KeyboardEvent).key === " "
          ) {
            event.preventDefault();
            marker.openPopup();
          }
        });
      });
      if (points.length)
        map.fitBounds(L.latLngBounds(points), {
          padding: [35, 35],
          maxZoom: 14,
          animate: false,
        });
    });
    return () => {
      cancelled = true;
      map?.stop();
      map?.remove();
    };
  }, [sessions, segments, observations]);
  return (
    <div
      ref={ref}
      className="research-map"
      role="img"
      aria-label="조사 위치 지도"
    />
  );
}
