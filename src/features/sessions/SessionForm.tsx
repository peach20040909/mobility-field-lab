"use client";
import { useState } from "react";
import { cities } from "@/data/cities";
import type { SessionInput } from "@/domain/schema";
export default function SessionForm({
  onSave,
  onClose,
}: {
  onSave: (input: SessionInput) => Promise<void>;
  onClose: () => void;
}) {
  const [city, setCity] = useState("seoul");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = cities.find((x) => x.id === city)!;
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-session-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">NEW FIELD SESSION</span>
            <h2 id="new-session-title">새 조사 등록</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <p className="muted">기기가 없는 구간도 촬영하고 기록해 주세요.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              await onSave({
                city,
                place: String(form.get("place")),
                date: String(form.get("date")),
                time: String(form.get("time")),
                timezone:
                  city === "seoul"
                    ? "Asia/Seoul"
                    : city === "brussels"
                      ? "Europe/Brussels"
                      : city === "frankfurt"
                        ? "Europe/Berlin"
                        : city === "barcelona"
                          ? "Europe/Madrid"
                          : "Europe/Paris",
                weather: String(form.get("weather")),
                lengthM: Number(form.get("distance")),
                relation: form.get("relation") as SessionInput["relation"],
                latitude: Number(form.get("lat")),
                longitude: Number(form.get("lng")),
                source: "field",
              });
              onClose();
            } catch (error) {
              setError(error instanceof Error ? error.message : "저장 실패");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            도시
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            장소 이름
            <input
              key={city}
              name="place"
              placeholder={c.place}
              required
              maxLength={200}
            />
          </label>
          <div className="form-grid">
            <label>
              현지 조사 날짜
              <input
                type="date"
                name="date"
                defaultValue={new Date().toLocaleDateString("sv-SE", {
                  timeZone: "Asia/Seoul",
                })}
                required
              />
            </label>
            <label>
              현지 시각
              <input type="time" name="time" defaultValue="13:00" required />
            </label>
            <label>
              실제 측정 거리 (m)
              <input
                type="number"
                name="distance"
                defaultValue="400"
                min="1"
                max="100000"
                required
              />
            </label>
            <label>
              구간 관계
              <select name="relation">
                <option value="single">단일 구간</option>
                <option value="inside">금지 구역 안</option>
                <option value="outside">금지 구역 밖</option>
                <option value="near">주차구역 근처</option>
                <option value="far">주차구역 먼 곳</option>
              </select>
            </label>
            <label>
              날씨
              <select name="weather">
                <option>맑음</option>
                <option>흐림</option>
                <option>비</option>
                <option>눈</option>
              </select>
            </label>
            <div className="field-note">
              기본 400m · 비교 구간은 각각 200m
              <br />
              현지 기록 시각으로 저장합니다.
            </div>
            <label>
              위도
              <input
                key={city + "lat"}
                name="lat"
                type="number"
                step="any"
                defaultValue={c.lat}
                min="-90"
                max="90"
                required
              />
            </label>
            <label>
              경도
              <input
                key={city + "lng"}
                name="lng"
                type="number"
                step="any"
                defaultValue={c.lng}
                min="-180"
                max="180"
                required
              />
            </label>
          </div>
          <p className="small muted">
            좌표는 도시 중심 기본값입니다. 실제 조사 시작점으로 수정해 주세요.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="secondary" onClick={onClose}>
              취소
            </button>
            <button className="primary" disabled={busy}>
              {busy ? "저장 중…" : "조사 저장"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
