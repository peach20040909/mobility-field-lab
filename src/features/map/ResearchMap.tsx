"use client";
import { useEffect, useRef, useState } from "react";
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
  const latest = useRef({ sessions, segments, observations });
  const update = useRef<(() => void) | undefined>(undefined);
  const restore = useRef<(() => void) | undefined>(undefined);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    latest.current = { sessions, segments, observations };
    update.current?.();
  }, [sessions, segments, observations]);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    void import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      const motion = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      const instance = L.map(ref.current, {
        zoomAnimation: motion,
        fadeAnimation: motion,
        markerZoomAnimation: motion,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 180,
        wheelDebounceTime: 100,
        scrollWheelZoom: "center",
        minZoom: 1,
        maxZoom: 19,
        bounceAtZoomLimits: false,
      }).setView([47, 8], 4);
      map = instance;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(instance);
      L.control.scale({ imperial: false, maxWidth: 120 }).addTo(instance);
      const markers = L.layerGroup().addTo(instance);
      let scope: string | undefined;
      const fit = (animate: boolean) => {
        const points = latest.current.sessions.map(
          (s) => [s.latitude, s.longitude] as [number, number],
        );
        instance.stop();
        if (points.length)
          instance.fitBounds(L.latLngBounds(points), {
            padding: [35, 35],
            maxZoom: 14,
            animate: animate && motion,
          });
        else instance.setView([47, 8], 4, { animate: animate && motion });
      };
      instance.on("zoomend", () => setZoom(instance.getZoom()));
      restore.current = () => fit(true);
      const draw = () => {
        const data = latest.current;
        markers.clearLayers();
        data.sessions.forEach((s) => {
          const m = computeMetrics(
            data.segments.filter((g) => g.sessionId === s.id),
            data.observations,
          );
          const fmt = (n: number) =>
            n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
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
            (m.estimated ? "m · 추정 포함 공유 약 " : "m · 확정 공유 ") +
            m.total +
            (m.estimated ? "대 · 100m당 약 " : "대 · 100m당 ") +
            fmt(m.density) +
            (m.estimated ? "대 · 방해·위험 약 " : "대 · 방해·위험 ") +
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
            .addTo(markers)
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
        const next = data.sessions
          .map((s) => `${s.id}:${s.latitude}:${s.longitude}`)
          .sort()
          .join("|");
        if (next !== scope) {
          scope = next;
          fit(false);
        }
      };
      update.current = draw;
      draw();
      setZoom(instance.getZoom());
    });
    return () => {
      cancelled = true;
      update.current = undefined;
      restore.current = undefined;
      map?.stop();
      map?.remove();
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className="research-map"
        role="img"
        aria-label="조사 위치 지도"
      />
      <div className="map-view-controls">
        <span>
          확대 단계{" "}
          <output aria-label="지도 확대 단계">
            {zoom === null ? "—" : zoom.toFixed(1)}
          </output>
        </span>
        <button
          type="button"
          className="secondary"
          disabled={zoom === null}
          onClick={() => restore.current?.()}
        >
          조사 위치로 돌아가기
        </button>
      </div>
    </>
  );
}
