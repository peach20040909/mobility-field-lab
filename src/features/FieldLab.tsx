"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Plus,
  Compass,
  NotebookPen,
  ScanLine,
  ChartNoAxesCombined,
  Map,
  BookOpen,
  Download,
  Check,
  Globe2,
  Leaf,
  ShieldCheck,
  Menu,
  Upload,
  Camera,
  Database,
  ChevronRight,
} from "lucide-react";
import { LocalRepository } from "@/storage/indexeddb";
import { computeMetrics } from "@/domain/metrics";
import { computeAgreement } from "@/domain/agreement";
import { toCsv } from "@/domain/export";
import { cities } from "@/data/cities";
import {
  kindLabels,
  statusLabels,
  type ProjectExport,
  type Observation,
  type SessionInput,
} from "@/domain/schema";
import SessionForm from "./sessions/SessionForm";
import ReviewPanel from "./review/ReviewPanel";
const ResearchMap = dynamic(() => import("./map/ResearchMap"), {
  ssr: false,
  loading: () => <div className="empty">지도를 준비하고 있습니다…</div>,
});
const empty: ProjectExport = {
  version: 1,
  sessions: [],
  segments: [],
  photos: [],
  observations: [],
};
const nav = [
  { id: "overview", label: "프로젝트 개요", icon: Compass },
  { id: "sessions", label: "조사 기록", icon: NotebookPen },
  { id: "review", label: "사진 판정 · 검수", icon: ScanLine },
  { id: "analysis", label: "분석 대시보드", icon: ChartNoAxesCombined },
  { id: "map", label: "조사 지도", icon: Map },
  { id: "guide", label: "조사 방법 · 면접", icon: BookOpen },
] as const;
type Page = (typeof nav)[number]["id"];
const number = (n: number) =>
  n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
const percent = (n: number | null) =>
  n === null ? "산출 불가" : number(n * 100) + "%";
const download = (content: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export default function FieldLab() {
  const [repo] = useState(() => new LocalRepository());
  const [data, setData] = useState<ProjectExport>(empty);
  const [page, setPage] = useState<Page>("overview");
  const [source, setSource] = useState<"field" | "demo">("field");
  const [modal, setModal] = useState(false);
  const [reviewId, setReviewId] = useState<string>();
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [uploadSession, setUploadSession] = useState("");
  const [kind, setKind] = useState<Observation["kind"]>("shared-scooter");
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const refresh = async () => {
    setData(await repo.exportProject());
  };
  useEffect(() => {
    repo
      .exportProject()
      .then(setData)
      .catch(() =>
        setError(
          "브라우저 저장소에 접근할 수 없습니다. 일반 브라우저 창에서 다시 시도해 주세요.",
        ),
      );
  }, [repo]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  const sessions = useMemo(
    () => data.sessions.filter((s) => s.source === source),
    [data, source],
  );
  const segments = useMemo(
    () =>
      data.segments.filter((s) => sessions.some((x) => x.id === s.sessionId)),
    [data, sessions],
  );
  const observations = useMemo(
    () =>
      data.observations.filter((o) =>
        segments.some((s) => s.id === o.segmentId),
      ),
    [data, segments],
  );
  const metrics = computeMetrics(segments, observations);
  const agreement = computeAgreement(
    observations.map((o) => ({ left: o.judgments.A, right: o.judgments.B })),
  );
  const aiAgreement = computeAgreement(
    observations.map((o) => ({ left: o.judgments.AI, right: o.final })),
  );
  const go = (p: Page) => {
    setPage(p);
    setMenu(false);
    setReviewId(undefined);
  };
  const action = async (fn: () => Promise<void>, message: string) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      await refresh();
      setToast(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "작업을 완료하지 못했습니다");
    } finally {
      setBusy(false);
    }
  };
  const loadDemo = () =>
    action(async () => {
      await repo.loadDemo();
      setSource("demo");
    }, "예시 데이터가 준비되었습니다");
  const save = async (input: SessionInput) => {
    await repo.createSession(input);
    await refresh();
    setSource("field");
    setToast("조사가 저장되었습니다");
  };
  const selected = reviewId
    ? data.observations.find((o) => o.id === reviewId)
    : undefined;
  const sourceControl = (
    <div className="tabs source-tabs">
      <button
        className={source === "field" ? "selected" : ""}
        onClick={() => setSource("field")}
      >
        실제 기록
      </button>
      <button
        className={source === "demo" ? "selected" : ""}
        onClick={() => setSource("demo")}
      >
        예시 데이터
      </button>
    </div>
  );
  const sourceNotice =
    source === "demo" ? (
      <p className="demo-notice">
        <span />
        합성 예시 데이터 · 실제 조사 결과가 아닙니다
      </p>
    ) : (
      <p className="small muted">이 브라우저의 실제 기록 · 서버 공유 미연결</p>
    );
  const filteredProject: ProjectExport = {
    version: 1,
    sessions,
    segments,
    observations,
    photos: data.photos.filter((p) =>
      segments.some((s) => s.id === p.segmentId),
    ),
  };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
        >
          <span className="brand-mark">
            <Leaf size={23} />
          </span>
          <span>
            Mobility<span className="brand-light">Field Lab</span>
          </span>
        </a>
        <div className="workspace-label">2026 WINTER EXPEDITION</div>
        <nav aria-label="주 메뉴">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className="pill">
            <span />
            B팀 · 해외탐방
          </span>
          <h3>
            더 나은 보도를 위한
            <br />
            작은 관찰.
          </h3>
          <p>독일 · 벨기에 · 프랑스 · 스페인</p>
          <div className="mini-route">
            DE <span>—</span> BE <span>—</span> FR <span>—</span> ES
          </div>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">M</span>
          <div>
            <strong>해외탐방 연구팀</strong>
            <span>장민준 · 김효준</span>
          </div>
          <ShieldCheck size={17} />
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <button
              className="menu-toggle"
              aria-label="메뉴 열기"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={22} />
            </button>
            <span className="muted">연구 공간</span>
            <ChevronRight size={14} />
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="header-right">
            <span className="connection">
              <span />
              로컬 저장
            </span>
            <a
              href="https://github.com/peach20040909/mobility-field-lab"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowUpRight size={14} />
            </a>
          </div>
        </header>
        <div className="content">
          {error && (
            <div role="alert" className="error global-error">
              {error}
              <button aria-label="오류 닫기" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}
          {toast && (
            <div className="toast" role="status">
              <Check size={18} />
              {toast}
            </div>
          )}
          {page === "overview" && (
            <>
              <div className="section-heading intro-line">
                <span className="eyebrow">
                  <span className="tiny-line" /> FIELD RESEARCH / 2026–2027
                </span>
                <span className="small muted">서울에서 시작해, 유럽으로.</span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <div className="tag">보행자를 위한 이동수단 연구</div>
                  <h1>
                    도시의 선택을,
                    <br />
                    거리의 기록으로.
                  </h1>
                  <p>
                    금지하면 사라질까, 옮겨갈까?
                    <br />
                    유럽의 서로 다른 답을 직접 걷고 기록해
                    <br />
                    서울의 보도를 위한 근거를 만듭니다.
                  </p>
                  <div className="hero-buttons">
                    <button
                      className="primary"
                      onClick={() => {
                        go("sessions");
                        setModal(true);
                      }}
                    >
                      <Plus size={17} />새 조사 시작
                    </button>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={loadDemo}
                    >
                      예시 데이터로 둘러보기
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="hero-foot">
                    <span className="small-dot" />
                    사진 → 독립 판정 → 검증 → 비교
                  </div>
                </div>
                <div className="hero-art">
                  <div className="art-label">
                    <Globe2 size={16} /> ONE QUESTION, DIFFERENT CITIES
                  </div>
                  <svg
                    viewBox="0 0 500 370"
                    role="img"
                    aria-label="유럽 탐방 도시를 잇는 개념 경로. 실제 지도가 아닙니다."
                  >
                    <path
                      d="M145 55L240 20L278 61L346 53L370 106L427 122L439 189L363 237L344 292L277 297L209 342L153 325L94 303L58 249L81 198L68 161L130 122Z"
                      fill="#dfe8d8"
                    />
                    <path
                      d="M134 223L181 157L265 93L306 142L207 279"
                      fill="none"
                      stroke="#77927e"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                    />
                    <g fill="#315948" stroke="#f5f4e9" strokeWidth="6">
                      <circle cx="181" cy="157" r="9" />
                      <circle cx="265" cy="93" r="9" />
                      <circle cx="306" cy="142" r="9" />
                      <circle cx="207" cy="279" r="9" />
                    </g>
                    <g fontFamily="sans-serif" fontSize="14" fill="#2f493b">
                      <text x="105" y="147">
                        파리
                      </text>
                      <text x="278" y="80">
                        브뤼셀
                      </text>
                      <text x="320" y="145">
                        프랑크푸르트
                      </text>
                      <text x="220" y="302">
                        바르셀로나
                      </text>
                    </g>
                    <circle cx="420" cy="305" r="32" fill="#f7f6ed" />
                    <path
                      d="M418 323L430 285L402 297L418 302Z"
                      fill="#315948"
                    />
                  </svg>
                  <div className="art-caption">
                    <span>4개 도시 정량 측정</span>
                    <span>개념 경로 · 지도 아님</span>
                  </div>
                </div>
              </section>
              <section className="overview-stats">
                <div>
                  <span>관찰의 범위</span>
                  <strong>
                    4<span>유럽 측정 도시</span>
                  </strong>
                  <p>금지 · 관리 · 불허</p>
                </div>
                <div>
                  <span>출국 전 검증</span>
                  <strong>
                    2<span>서울 조사 장소</span>
                  </strong>
                  <p>구역 안과 밖의 비교</p>
                </div>
                <div>
                  <span>공통 측정 단위</span>
                  <strong>
                    100<span>m당 공유 기기</span>
                  </strong>
                  <p>거리로 표준화한 기록</p>
                </div>
                <div>
                  <span>검증의 원칙</span>
                  <strong>
                    2<span>명의 독립 판정</span>
                  </strong>
                  <p>AI와 사람의 일치율 공개</p>
                </div>
              </section>
              <div className="two-columns">
                <section className="panel workflow-panel">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">THE RESEARCH FLOW</span>
                      <h2>사진 한 장이 근거가 되기까지.</h2>
                    </div>
                    <span className="step-count">01 — 04</span>
                  </div>
                  {[
                    {
                      n: "01",
                      title: "같은 기준으로 촬영",
                      desc: "정해진 구간의 공유 이동수단을 빠짐없이 기록합니다.",
                      icon: Camera,
                    },
                    {
                      n: "02",
                      title: "기기를 구분하고 판정",
                      desc: "공유 여부와 정상 · 통행 방해 · 위험을 분류합니다.",
                      icon: ScanLine,
                    },
                    {
                      n: "03",
                      title: "두 사람이 독립적으로 검수",
                      desc: "원판정을 보존하고, 불일치는 근거를 남겨 조정합니다.",
                      icon: ShieldCheck,
                    },
                    {
                      n: "04",
                      title: "숫자 세 개로 비교",
                      desc: "100m당 수 · 방해·위험 비율 · 위험 유형을 확인합니다.",
                      icon: ChartNoAxesCombined,
                    },
                  ].map((s) => (
                    <div className="flow-row" key={s.n}>
                      <span className="flow-number">{s.n}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                      <s.icon size={19} />
                    </div>
                  ))}
                </section>
                <section className="panel field-notes">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">RESEARCH NOTE</span>
                      <h2>킥보드만 세지 않습니다.</h2>
                    </div>
                    <NotebookPen size={20} />
                  </div>
                  <div className="note-diagram">
                    <img
                      src={
                        (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
                        "/demo-street.svg"
                      }
                      alt="공유 전기자전거와 킥보드를 보여주는 합성 관찰 도식"
                    />
                  </div>
                  <p>
                    금지 뒤에 다른 기기가 그 자리를 채울 수 있습니다.{" "}
                    <strong>공유 전기자전거까지 함께 관찰</strong>하고, 개인
                    기기는 지표에서 제외합니다.
                  </p>
                  <div className="note-footer">
                    <span>제출본 기준 조사 설계</span>
                    <button className="text-button" onClick={() => go("guide")}>
                      기준표 보기
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </section>
              </div>
              <section className="cities-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">FOUR CITIES, THREE ANSWERS</span>
                    <h2>같은 질문을, 다른 거리에서.</h2>
                  </div>
                  <button className="text-button" onClick={() => go("map")}>
                    탐방 지도
                    <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="city-cards">
                  {cities.slice(1, 5).map((c) => (
                    <article className="city-card" key={c.id}>
                      <div className="city-top">
                        <span>{c.flag}</span>
                        <span className="small muted">{c.date}</span>
                      </div>
                      <h3>{c.name}</h3>
                      <p>{c.place}</p>
                      <span className="policy">{c.policy}</span>
                      <div className="city-bottom">
                        <MapPin size={14} />
                        {c.role}
                      </div>
                    </article>
                  ))}
                </div>
                <p className="small muted">
                  도시 정책은 제출자료 기준입니다. 최신 공식 원문 재확인 전이며,
                  측정 결과로 도시 순위를 매기지 않습니다.
                </p>
              </section>
            </>
          )}
          {page === "sessions" && (
            <>
              <PageTitle
                eyebrow="FIELD SESSIONS"
                title="거리를 기록하는 첫 단계."
                desc="사진이 없는 구간도 조사 길이와 함께 기록합니다."
                action={
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={17} />새 조사 등록
                  </button>
                }
              />
              <div className="section-heading">
                {sourceControl}
                <div className="button-group">
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        JSON.stringify(data, null, 2),
                        "mobility-backup.json",
                        "application/json",
                      )
                    }
                  >
                    <Download size={16} />
                    전체 백업
                  </button>
                  <button
                    className="secondary"
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={16} />
                    백업 가져오기
                  </button>
                  <input
                    hidden
                    type="file"
                    accept=".json,application/json"
                    ref={importRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        void action(async () => {
                          if (f.size > 50 * 1024 * 1024)
                            throw new Error("백업은 50MB 이하여야 합니다");
                          await repo.importProject(JSON.parse(await f.text()));
                        }, "백업을 가져왔습니다");
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              {sourceNotice}
              {sessions.length ? (
                <div className="session-grid">
                  {sessions.map((s) => {
                    const c = cities.find((c) => c.id === s.city);
                    const ss = segments.filter((x) => x.sessionId === s.id);
                    const count = data.photos.filter((p) =>
                      ss.some((x) => x.id === p.segmentId),
                    ).length;
                    return (
                      <article className="panel session-card" key={s.id}>
                        <div className="section-heading">
                          <span className="pill">{c?.name ?? s.city}</span>
                          <span className="small muted">{s.date}</span>
                        </div>
                        <h2>{s.place}</h2>
                        <p>
                          {s.lengthM}m · {s.weather} · {s.time}
                        </p>
                        <div className="session-footer">
                          <span>
                            <Camera size={15} />
                            {count}장 기록
                          </span>
                          <button
                            className="text-button"
                            onClick={() => {
                              setUploadSession(s.id);
                              go("review");
                            }}
                          >
                            사진 등록
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  icon={NotebookPen}
                  title="아직 조사 기록이 없습니다."
                  desc="새 조사를 등록하거나 예시 데이터를 불러와 흐름을 확인하세요."
                  onClick={() => setModal(true)}
                  label="새 조사 등록"
                />
              )}
              <p className="notice">
                <Database size={16} />
                기록은 이 브라우저에 저장됩니다. 브라우저 데이터를 삭제하기 전에
                전체 백업을 내려받으세요.
              </p>
            </>
          )}
          {page === "review" && (
            <>
              <PageTitle
                eyebrow="PHOTO & INDEPENDENT REVIEW"
                title="판정마다 근거를 남깁니다."
                desc="AI 연결 전에도 두 사람의 원판정과 조정 결과를 기록할 수 있습니다."
              />
              {sourceControl}
              {sourceNotice}
              <div className="panel upload-panel">
                <div>
                  <h3>현장 사진 등록</h3>
                  <p className="small muted">
                    JPEG · PNG · WebP / 최대 10MB · 외부 서버로 전송하지
                    않습니다.
                  </p>
                </div>
                <select
                  aria-label="사진을 등록할 조사"
                  value={uploadSession}
                  onChange={(e) => setUploadSession(e.target.value)}
                >
                  <option value="">실제 조사 선택</option>
                  {data.sessions
                    .filter((s) => s.source === "field")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.place}
                      </option>
                    ))}
                </select>
                <label className="secondary upload-button">
                  <Camera size={16} />
                  사진 선택
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={!uploadSession || busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void action(async () => {
                          if (
                            file.size > 10 * 1024 * 1024 ||
                            !["image/jpeg", "image/png", "image/webp"].includes(
                              file.type,
                            )
                          )
                            throw new Error(
                              "JPEG/PNG/WebP 10MB 이하 사진만 등록할 수 있습니다",
                            );
                          const bitmap = await createImageBitmap(file);
                          bitmap.close();
                          const dataUrl = await new Promise<string>(
                            (resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = () =>
                                resolve(String(reader.result));
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            },
                          );
                          const segment = data.segments.find(
                            (s) => s.sessionId === uploadSession,
                          );
                          if (!segment)
                            throw new Error("조사 구간을 찾지 못했습니다");
                          const photo = await repo.savePhoto({
                            segmentId: segment.id,
                            name: file.name,
                            dataUrl,
                            redacted: false,
                            publicationReviewed: false,
                          });
                          await repo.addObservation(photo.id, kind);
                          setSource("field");
                        }, "사진과 첫 기기를 등록했습니다");
                      e.target.value = "";
                    }}
                  />
                </label>
                <select
                  aria-label="첫 기기 구분"
                  value={kind}
                  onChange={(e) =>
                    setKind(e.target.value as Observation["kind"])
                  }
                >
                  {Object.entries(kindLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <p className="notice">
                AI 미연결 · 자동 분석 결과는 없습니다. 예시 데이터의 AI 판정도
                합성값입니다. 한 사진에 여러 기기가 있으면 기기를 추가하세요.
              </p>
              {observations.length ? (
                <div className="observation-grid">
                  {observations.map((o, i) => {
                    const photo = data.photos.find((p) => p.id === o.photoId);
                    return (
                      <article className="panel observation-card" key={o.id}>
                        {photo && (
                          <img
                            src={
                              photo.dataUrl.startsWith("/")
                                ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
                                  photo.dataUrl
                                : photo.dataUrl
                            }
                            alt={photo.name}
                          />
                        )}
                        <div className="observation-body">
                          <div className="section-heading">
                            <span className="small muted">
                              관찰 #{String(i + 1).padStart(2, "0")}
                            </span>
                            <span
                              className={
                                "status " + (o.final?.status ?? "pending")
                              }
                            >
                              {o.final
                                ? statusLabels[o.final.status]
                                : "미검수"}
                            </span>
                          </div>
                          <h3>{kindLabels[o.final?.kind ?? o.kind]}</h3>
                          <p className="small muted">
                            A {o.judgments.A ? "완료" : "대기"} · B{" "}
                            {o.judgments.B ? "완료" : "대기"}
                            {o.canonicalDeviceId !== o.id ? " · 중복 연결" : ""}
                          </p>
                          <div className="button-group">
                            <button
                              className="secondary"
                              onClick={() => setReviewId(o.id)}
                            >
                              검수하기
                              <ArrowUpRight size={14} />
                            </button>
                            <button
                              className="text-button small"
                              onClick={() =>
                                void action(async () => {
                                  await repo.addObservation(o.photoId, kind);
                                }, "같은 사진에 기기를 추가했습니다")
                              }
                            >
                              기기 추가
                            </button>
                          </div>
                          <label className="duplicate-label">
                            동일 기기 연결
                            <select
                              value={
                                o.canonicalDeviceId === o.id
                                  ? ""
                                  : o.canonicalDeviceId
                              }
                              onChange={(e) => {
                                if (e.target.value)
                                  void action(
                                    () =>
                                      repo.linkDuplicate(o.id, e.target.value),
                                    "중복 기기를 연결했습니다",
                                  );
                              }}
                            >
                              <option value="">별도 기기</option>
                              {observations
                                .filter(
                                  (x) =>
                                    x.id !== o.id &&
                                    x.canonicalDeviceId === x.id &&
                                    data.segments.find(
                                      (s) => s.id === x.segmentId,
                                    )?.sessionId ===
                                      data.segments.find(
                                        (s) => s.id === o.segmentId,
                                      )?.sessionId,
                                )
                                .map((x) => (
                                  <option value={x.id} key={x.id}>
                                    관찰 #
                                    {String(
                                      observations.indexOf(x) + 1,
                                    ).padStart(2, "0")}
                                  </option>
                                ))}
                            </select>
                          </label>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  icon={ScanLine}
                  title="검수할 사진이 없습니다."
                  desc="실제 조사를 등록하고 사진을 추가하거나, 예시 데이터를 불러오세요."
                  onClick={loadDemo}
                  label="예시 데이터 불러오기"
                />
              )}
            </>
          )}
          {page === "analysis" && (
            <>
              <PageTitle
                eyebrow="EVIDENCE, NOT IMPRESSIONS"
                title="느낌을 넘어, 숫자로."
                desc="같은 기준으로 수집한 기록만 비교합니다. 비교는 정책 효과의 증명이 아닙니다."
                action={
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        toCsv(filteredProject),
                        "mobility-" + source + ".csv",
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    <Download size={16} />
                    CSV 내보내기
                  </button>
                }
              />
              {sourceControl}
              {sourceNotice}
              <div className="metric-grid">
                <Metric
                  label="100m당 공유 기기"
                  value={number(metrics.density)}
                  unit="대"
                  foot={metrics.total + "대 / " + metrics.distance + "m"}
                />
                <Metric
                  label="통행 방해 · 위험 비율"
                  value={percent(metrics.ratio)}
                  foot={metrics.bad + "대 / 판정 완료 " + metrics.judged + "대"}
                />
                <Metric
                  label="확정 판정 표본"
                  value={String(metrics.judged)}
                  unit="대"
                  foot={
                    "미검수 " +
                    metrics.unreviewed +
                    " · 판정 불가 " +
                    metrics.unassessable
                  }
                />
                <Metric
                  label="사람 간 일치율"
                  value={percent(agreement.rate)}
                  foot={
                    agreement.matched +
                    " / " +
                    agreement.total +
                    "쌍 · 제외 " +
                    agreement.excluded
                  }
                />
              </div>
              <section className="panel">
                <div className="section-heading">
                  <h2>조사별 비교</h2>
                  <span className="pill">기술 통계 · 순위 없음</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>도시 · 조사 장소</th>
                        <th>구간</th>
                        <th>100m당 수</th>
                        <th>방해·위험 비율</th>
                        <th>판정 완료</th>
                        <th>미검수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => {
                        const seg = segments.filter(
                          (x) => x.sessionId === s.id,
                        );
                        const m = computeMetrics(seg, observations);
                        return (
                          <tr key={s.id}>
                            <td>
                              <strong>
                                {cities.find((c) => c.id === s.city)?.name ??
                                  s.city}
                              </strong>
                              <span>{s.place}</span>
                            </td>
                            <td>
                              {
                                {
                                  single: "단일",
                                  inside: "안",
                                  outside: "밖",
                                  near: "근처",
                                  far: "먼 곳",
                                }[s.relation]
                              }
                            </td>
                            <td>{number(m.density)}대</td>
                            <td>
                              <div className="bar-cell">
                                <span>{percent(m.ratio)}</span>
                                <div>
                                  <i
                                    style={{
                                      width: (m.ratio ?? 0) * 100 + "%",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>{m.judged}대</td>
                            <td>{m.unreviewed}대</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!sessions.length && (
                    <p className="empty">
                      현재 선택한 자료에 조사 기록이 없습니다.
                    </p>
                  )}
                </div>
              </section>
              <div className="two-columns">
                <section className="panel">
                  <h2>위험 유형 분포</h2>
                  {Object.entries({
                    tactile: "점자블록",
                    crosswalk: "횡단보도",
                    exit: "역 출구",
                    bus: "정류소",
                    road: "차도",
                  }).map(([k, v]) => (
                    <div className="risk-row" key={k}>
                      <span>{v}</span>
                      <div>
                        <i
                          style={{
                            width:
                              Math.min(
                                ((metrics.risks[k] ?? 0) /
                                  Math.max(metrics.judged, 1)) *
                                  100,
                                100,
                              ) + "%",
                          }}
                        />
                      </div>
                      <strong>{metrics.risks[k] ?? 0}대</strong>
                    </div>
                  ))}
                  <p className="small muted">
                    복수 유형이 있으면 유형별 합이 기기 수보다 클 수 있습니다.
                    쓰러짐 {metrics.fallen}대는 별도 속성입니다.
                  </p>
                </section>
                <section className="panel">
                  <h2>판정 신뢰도</h2>
                  <div className="agreement-large">
                    {percent(aiAgreement.rate)}
                  </div>
                  <p>AI · 확정 판정 일치율 / {aiAgreement.total}쌍</p>
                  <p className="small muted">
                    {source === "demo"
                      ? "합성 판정값입니다. 모델 정확도를 의미하지 않습니다."
                      : "실제 AI 미연결 · 검증 표본이 수집되면 계산됩니다."}
                  </p>
                  <div className="criteria">
                    <strong>함께 읽어야 할 것</strong>
                    <p>
                      표본 수, 촬영 시각, 날씨, 구간 선택을 함께 공개합니다.
                      공유 여부 불명과 개인 기기는 지표에서 제외합니다.
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "map" && (
            <>
              <PageTitle
                eyebrow="WALKING THE SAME QUESTION"
                title="지도 위에 남기는 관찰."
                desc="조사 시작점만 표시합니다. 실제 보행 경로 또는 주차칸 설치 후보지는 아닙니다."
              />
              {sourceControl}
              {sourceNotice}
              <section className="panel map-panel">
                <ResearchMap sessions={sessions} />
                <div className="map-legend">
                  <span className="legend-dot" />
                  조사 시작점
                  <span className="small muted">
                    기본 좌표를 사용했다면 실제 위치로 수정하세요.
                  </span>
                </div>
              </section>
              <div className="city-cards">
                {cities.map((c) => (
                  <article className="city-card" key={c.id}>
                    <div className="city-top">
                      <span>{c.flag}</span>
                      <span className="small muted">{c.role}</span>
                    </div>
                    <h3>{c.name}</h3>
                    <p>{c.place}</p>
                    <span className="policy">{c.policy}</span>
                    <p className="small">{c.note}</p>
                    <a
                      className="city-bottom"
                      href={c.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      공식 홈페이지
                      <ArrowUpRight size={14} />
                    </a>
                  </article>
                ))}
              </div>
              <p className="notice">
                견인 원자료는 아직 연결되지 않았습니다. 근거 없는 주차칸
                후보지를 생성하지 않습니다.
              </p>
            </>
          )}
          {page === "guide" && (
            <>
              <PageTitle
                eyebrow="METHOD & INTERVIEW"
                title="우리가 지키는 관찰의 기준."
                desc="무엇을 만들었고, 무엇을 아직 검증하지 않았는지 함께 설명합니다."
              />
              {[
                {
                  title: "01 · 면접 3분 시연",
                  content:
                    "연구 질문(30초) → 예시와 실제 자료 구분(20초) → 사진 등록과 두 사람의 독립 판정(70초) → 지표·지도·CSV 확인(40초) → 한계와 현장 계획(20초).",
                },
                {
                  title: "02 · 현장 측정",
                  content:
                    "관리형 도시는 주차구역 근처·먼 곳 각각 200m. 주차구역이 없는 도시는 400m 한 구간. 같은 날 11–15시에 연속 측정하고 시각·날씨를 남깁니다. 기기가 없는 구간도 빠짐없이 기록합니다.",
                },
                {
                  title: "03 · 개인과 공유를 구분",
                  content:
                    "공유 킥보드와 공유 전기자전거를 집계합니다. 로고·QR 등 근거가 부족하면 불명으로 기록합니다. 개인과 불명 기기는 지표에서 제외합니다. 같은 기기의 반복 사진은 대표 기기로 연결합니다.",
                },
                {
                  title: "04 · 세 단계 판정",
                  content:
                    "○ 정상: 가장자리 일렬·지정 주차구역 안. △ 통행 방해: 보도 가운데 막음·쓰러짐. × 위험: 점자블록·횡단보도·역 출구·정류소·차도. 사진만으로 보도 폭을 미터로 추정하거나 현지 법 위반을 단정하지 않습니다.",
                },
                {
                  title: "05 · 원판정과 검증",
                  content:
                    "두 사람이 따로 판정한 원래 기록을 보존하고, 불일치는 최종 조정 사유와 함께 저장합니다. 로컬 역할 시연은 보안상 분리된 계정이 아닙니다. 실제 AI 정확도는 독립 라벨 사진과 비교한 뒤 보고합니다.",
                },
                {
                  title: "06 · 지금의 구현 상태",
                  content:
                    "로컬 조사 등록·사진 저장·수동 판정·역할별 검수·지표·지도·백업·CSV가 구현되어 있습니다. 실제 공개 모델 추론, 팀 계정 공동 저장, 자동 가림 처리, 견인 원자료 분석은 미연결입니다. 원본 사진은 이 브라우저에만 남고 공개 서버로 전송하지 않습니다.",
                },
                {
                  title: "07 · 결과 해석과 공개",
                  content:
                    "도시 비교는 거리 모습에 대한 기술 통계입니다. 정책의 인과 효과나 도시 순위를 주장하지 않습니다. 공개할 사진은 얼굴·번호판 가림과 사람 확인을 마친 뒤 사용합니다. 실제 조사 기록은 브라우저 삭제 전에 백업하세요.",
                },
              ].map((s) => (
                <section className="panel guide-card" key={s.title}>
                  <h2>{s.title}</h2>
                  <p>{s.content}</p>
                </section>
              ))}
            </>
          )}
          <footer className="footer">
            <span>Mobility Field Lab</span>
            <span>작은 관찰이 만드는, 더 나은 보도.</span>
            <span>2026–2027 · B팀</span>
          </footer>
        </div>
      </main>
      {modal && <SessionForm onSave={save} onClose={() => setModal(false)} />}{" "}
      {selected && (
        <ReviewPanel
          observation={selected}
          photo={data.photos.find((p) => p.id === selected.photoId)}
          repo={repo}
          onDone={async () => {
            await refresh();
            setToast("판정이 저장되었습니다");
          }}
          onClose={() => setReviewId(undefined)}
        />
      )}
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  unit,
  foot,
}: {
  label: string;
  value: string;
  unit?: string;
  foot: string;
}) {
  return (
    <article className="panel metric">
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <p>{foot}</p>
    </article>
  );
}
function Empty({
  icon: Icon,
  title,
  desc,
  onClick,
  label,
}: {
  icon: typeof NotebookPen;
  title: string;
  desc: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={30} />
      </span>
      <h2>{title}</h2>
      <p>{desc}</p>
      <button className="primary" onClick={onClick}>
        {label}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
