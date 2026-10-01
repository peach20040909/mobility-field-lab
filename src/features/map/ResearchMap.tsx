"use client";
import { useEffect, useRef } from "react";
import type { Session } from "@/domain/schema";
import "leaflet/dist/leaflet.css";
export default function ResearchMap({ sessions }: { sessions: Session[] }) {
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
        points.push([s.latitude, s.longitude]);
        const content = document.createElement("div");
        content.textContent =
          s.place +
          " · " +
          (s.source === "demo" ? "합성 예시" : "실제 조사") +
          " · " +
          s.lengthM +
          "m";
        L.circleMarker([s.latitude, s.longitude], {
          radius: 9,
          color: "#315948",
          fillColor: s.source === "demo" ? "#cfab6c" : "#315948",
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map!)
          .bindPopup(content);
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
  }, [sessions]);
  return (
    <div
      ref={ref}
      className="research-map"
      role="img"
      aria-label="조사 위치 지도"
    />
  );
}
