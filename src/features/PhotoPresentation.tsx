"use client";

import { useEffect, useRef, useState } from "react";
import {
  analyzePhoto,
  LOCAL_VISION_URL,
  type AnalysisResult,
} from "@/ai/provider";
import { kindLabels, statusLabels, riskLabels } from "@/domain/schema";
import styles from "./PhotoPresentation.module.css";

export default function PhotoPresentation() {
  const [photo, setPhoto] = useState<File>();
  const [preview, setPreview] = useState("");
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult>();
  const [place, setPlace] = useState("홍대 사전조사");
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef(0);
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);
  useEffect(() => {
    if (!busy) return;
    const start = Date.now();
    const interval = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [busy]);

  async function choose(file?: File) {
    const generation = ++selection.current;
    setResult(undefined);
    setPhoto(undefined);
    setPreview("");
    setError("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("JPEG·PNG·WebP 사진을 10MB 이하로 선택해 주세요.");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      URL.revokeObjectURL(url);
      if (generation === selection.current)
        setError("사진을 열 수 없습니다. 다른 사진을 선택해 주세요.");
      return;
    }
    if (generation !== selection.current) {
      URL.revokeObjectURL(url);
      return;
    }
    setPhoto(file);
    setPreview(url);
  }
  async function connect() {
    setConnecting(true);
    setReady(false);
    setError("");
    try {
      const response = await fetch(LOCAL_VISION_URL + "/connect", {
        headers: { Authorization: "Bearer " + token },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok || !(await response.json()).ready) throw new Error();
      setReady(true);
    } catch {
      setError(
        "AI 연결 실패: 이 PC의 AI 서버 실행과 연결 토큰을 확인해 주세요. 브라우저가 요청하면 로컬 네트워크 접근을 허용하세요.",
      );
    } finally {
      setConnecting(false);
    }
  }
  async function analyze() {
    if (!photo || !ready || busy) return;
    setBusy(true);
    setElapsed(0);
    setError("");
    setResult(undefined);
    try {
      setResult(await analyzePhoto(photo, token));
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("60초")
          ? e.message
          : "분석에 실패했습니다. 서버 연결을 확인하거나 다른 사진으로 다시 시도해 주세요. 결과를 임의로 채우지 않습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!result || !photo) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              place,
              photoName: photo.name,
              source: "local-model-live-analysis",
              ...result,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "indojikimi-analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const observations = result?.observations ?? [];
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href={base + "/"} className={styles.brand}>
          <img src={base + "/team-logo.svg"} alt="" width={40} height={40} />
          인도지킴이들
        </a>
        <a href={base + "/"} className={styles.controls}>
          조사 도구로 돌아가기 ↗
        </a>
      </header>
      <section className={styles.intro}>
        <span className={styles.eyebrow}>현장 사진 · 로컬 AI 분석</span>
        <h1>사진 한 장, 거리의 문제를 보다.</h1>
        <p>사진을 넣고 → AI가 기기를 찾고 → 판정과 근거를 함께 봅니다.</p>
      </section>
      <details
        className={`${styles.connection} ${styles.controls}`}
        open={!ready}
      >
        <summary>
          {ready ? "● AI 연결 완료 · 연결 설정" : "시작 전 · 이 PC의 AI 연결"}
        </summary>
        <p>
          분석은 이 화면을 여는 PC의 서버에서 실행됩니다. 사진·결과는 이
          화면에서만 유지됩니다. 새로고침 전에 결과를 저장해 주세요.
        </p>
        <div className={styles.connectionRow}>
          <label>
            로컬 AI 연결 토큰
            <input
              type="password"
              autoComplete="off"
              value={token}
              disabled={busy || connecting}
              onChange={(e) => {
                setToken(e.target.value);
                setReady(false);
              }}
            />
          </label>
          <button
            disabled={!token.trim() || busy || connecting}
            onClick={connect}
          >
            {connecting ? "연결 확인 중…" : "AI 연결 확인"}
          </button>
        </div>
      </details>
      <div className={`${styles.toolbar} ${styles.controls}`}>
        <label>
          조사 장소
          <input
            value={place}
            disabled={busy}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={200}
          />
        </label>
        <label className={styles.upload}>
          조사 사진 선택
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => void choose(e.target.files?.[0])}
          />
        </label>
        <button
          className={styles.primary}
          disabled={!photo || !ready || busy}
          onClick={analyze}
        >
          {busy ? "AI 분석 중…" : "AI 분석 시작"}
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.stage}>
        <section className={styles.photoPanel}>
          <h2>{place || "조사 사진"}</h2>
          {preview ? (
            <div className={styles.photo}>
              <img src={preview} alt="선택한 조사 사진" />
              {observations.map((o, i) => (
                <div
                  key={i}
                  aria-label={`기기 ${i + 1} 영역`}
                  className={`${styles.box} ${styles[o.status]}`}
                  style={{
                    left: `${o.bbox[0] * 100}%`,
                    top: `${o.bbox[1] * 100}%`,
                    width: `${(o.bbox[2] - o.bbox[0]) * 100}%`,
                    height: `${(o.bbox[3] - o.bbox[1]) * 100}%`,
                  }}
                >
                  <span>{i + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              01
              <br />
              <strong>현장에서 찍은 사진을 선택하세요.</strong>
              <p>JPEG · PNG · WebP / 최대 10MB</p>
            </div>
          )}
          {photo && <p className={styles.filename}>{photo.name}</p>}
        </section>
        <section className={styles.results} aria-live="polite" aria-busy={busy}>
          {busy ? (
            <div className={styles.loading}>
              <span className={styles.spinner} />
              <h2>사진 속 기기를 분석하고 있습니다.</h2>
              <strong>{elapsed}초 경과</strong>
              <p>
                기기 종류·위치·통행 영향을 한 번에 분석합니다.
                <br />
                최대 60초까지 기다려 주세요.
              </p>
            </div>
          ) : result ? (
            <>
              <span className={styles.badge}>
                실제 업로드 사진 · AI 예비 판정
              </span>
              <h2>
                AI가 찾은 기기 <b>{observations.length}</b>건
              </h2>
              <div className={styles.counts}>
                <div>
                  <strong>
                    {observations.filter((o) => o.status === "normal").length}
                  </strong>
                  <span>정상 추정</span>
                </div>
                <div>
                  <strong>
                    {
                      observations.filter((o) =>
                        ["danger", "obstruction"].includes(o.status),
                      ).length
                    }
                  </strong>
                  <span>방해·위험</span>
                </div>
                <div>
                  <strong>
                    {
                      observations.filter((o) => o.status === "unassessable")
                        .length
                    }
                  </strong>
                  <span>판정 불가</span>
                </div>
              </div>
              <p className={styles.note}>
                탐지 누락·중복이 있을 수 있습니다. 사람의 검수 전 결과이며,
                사진만으로 실제 보도 폭을 측정하지 않습니다. 조사 통계에 자동
                반영되지 않습니다.
              </p>
              {observations.length === 0 && (
                <p>
                  이 사진에서 AI가 기기를 찾지 못했습니다. 사람이 사진을 확인해
                  주세요.
                </p>
              )}
              <ol className={styles.list}>
                {observations.map((o, i) => (
                  <li key={i}>
                    <div className={styles.row}>
                      <strong>
                        #{i + 1} {kindLabels[o.kind]}
                      </strong>
                      <span className={`${styles.status} ${styles[o.status]}`}>
                        {o.status === "normal"
                          ? "○ 정상 추정"
                          : statusLabels[o.status]}
                      </span>
                    </div>
                    <p>{o.reason || "판정 근거가 제공되지 않았습니다."}</p>
                    {(o.risks.length > 0 || o.fallen) && (
                      <small>
                        {o.risks.map((r) => riskLabels[r]).join(" · ")}
                        {o.fallen && " · 쓰러짐"}
                      </small>
                    )}
                  </li>
                ))}
              </ol>
              {result.warnings.map((w, i) => (
                <p key={i} className={styles.note}>
                  {w}
                </p>
              ))}
              <div className={styles.provenance}>
                <strong>분석 기록</strong>
                <br />
                {result.modelId}
                <br />
                <span>{result.modelVersion}</span>
                <br />
                {new Date(result.timestamp).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}{" "}
                (한국 시간) · {result.seconds.toFixed(1)}초
              </div>
              <div className={`${styles.actions} ${styles.controls}`}>
                <button onClick={() => window.print()}>결과 인쇄 / PDF</button>
                <button onClick={download}>결과 JSON 저장</button>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              02
              <br />
              <strong>분석 결과가 여기에 나타납니다.</strong>
              <p>사진 속 번호와 판정 근거를 바로 비교하세요.</p>
            </div>
          )}
        </section>
      </div>
      <footer className={styles.footer}>
        인도지킴이들 · 현장 사진 분석 기록 · AI 판정은 사람의 최종 검수가
        필요합니다.
      </footer>
    </main>
  );
}
