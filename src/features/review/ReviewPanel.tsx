"use client";
import { useState } from "react";
import type { Observation, Photo, Judgment } from "@/domain/schema";
import { kindLabels, statusLabels, riskLabels } from "@/domain/schema";
import { getReviewStatus } from "@/domain/agreement";
import type { LocalRepository } from "@/storage/indexeddb";
export default function ReviewPanel({
  observation,
  photo,
  source,
  repo,
  onDone,
  onClose,
}: {
  observation: Observation;
  photo?: Photo;
  source: "demo" | "field";
  repo: LocalRepository;
  onDone: () => Promise<void>;
  onClose: () => void;
}) {
  const [role, setRole] = useState<"A" | "B" | "resolve">("A");
  const [j, setJ] = useState<Judgment>(
    observation.judgments.A ?? {
      kind: observation.kind,
      status: "normal",
      risks: [],
      fallen: false,
      reason: "",
    },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current =
    role === "resolve" ? observation.final : observation.judgments[role];
  const visible = !!observation.judgments.A && !!observation.judgments.B;
  const comparison = getReviewStatus(observation.judgments);
  const tabs = (
    <div className="tabs reviewer-tabs">
      {(["A", "B", "resolve"] as const).map((r) => (
        <button
          key={r}
          className={role === r ? "selected" : ""}
          disabled={busy || (r === "resolve" && !visible)}
          onClick={() => {
            setRole(r);
            setError("");
            setJ(
              (r === "resolve"
                ? observation.final
                : observation.judgments[r]) ?? {
                kind: observation.kind,
                status: "normal",
                risks: [],
                fallen: false,
                reason: "",
              },
            );
          }}
        >
          {r === "resolve" ? "최종 조정" : "판정자 " + r}
        </button>
      ))}
    </div>
  );
  return (
    <div className="modal-backdrop">
      <section
        className={
          "modal wide" + (photo?.preparedSource ? " prepared-review" : "")
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">INDEPENDENT REVIEW</span>
            <h2 id="review-title">사진 판정 · 검수</h2>
          </div>
          <button aria-label="닫기" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="notice">
          한 기기의 A/B 역할 전환입니다. 두 사람이 모두 제출한 뒤 결과를
          비교합니다. 기기 간 자동 공유는 없습니다.
        </p>
        {source === "demo" && (
          <p className="demo-notice">
            {photo?.preparedSource
              ? "예시 데이터 · 실제 홍대 사진 · 사전 판정과 A/B 역할 시연 예시이며 최종 측정 결과가 아닙니다"
              : "예시 데이터 · 합성 사진과 판정이며 실제 측정 결과가 아닙니다"}
          </p>
        )}
        {tabs}
        {visible && (
          <p
            className={
              comparison === "mismatch" ? "review-disagreement" : "notice"
            }
          >
            {comparison === "mismatch"
              ? observation.final
                ? "불일치 · 조정 완료"
                : "불일치 · 조정 대기"
              : "일치"}
          </p>
        )}
        <div className="review-grid">
          <div>
            <div className="bbox-frame">
              {photo ? (
                <img
                  className="review-image"
                  src={
                    photo.dataUrl.startsWith("/")
                      ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
                        photo.dataUrl
                      : photo.dataUrl
                  }
                  alt={photo.name}
                />
              ) : (
                <div className="empty">사진 없음</div>
              )}
              {photo && observation.bbox && (
                <span
                  aria-label="검수 대상 기기 영역"
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    border: "3px solid #268568",
                    left: observation.bbox[0] * 100 + "%",
                    top: observation.bbox[1] * 100 + "%",
                    width:
                      (observation.bbox[2] - observation.bbox[0]) * 100 + "%",
                    height:
                      (observation.bbox[3] - observation.bbox[1]) * 100 + "%",
                  }}
                />
              )}
            </div>
            {visible && photo?.analysis && (
              <p className="small muted">
                모델: {photo.analysis.modelId} ·{" "}
                {photo.analysis.modelVersion.slice(0, 12)} ·{" "}
                {photo.analysis.timestamp} · {photo.analysis.seconds}초
              </p>
            )}
            {photo?.preparedSource && (
              <p className="notice">
                {photo.preparedSource.replace(/^Claude 자료의/, "팀 자료의")}
                {observation.countMode === "group" &&
                  (observation.estimatedCount
                    ? " · 묶음 약 " +
                      observation.estimatedCount +
                      "대 추정: 개별 판정 없이 추정 통계에 포함"
                    : " · 여러 기기의 묶음: 대수·비율 집계 제외")}
              </p>
            )}
            <p className="small muted">
              사진에서 폭을 미터로 추정하지 않습니다. 애매하면 판정 불가로
              기록하세요.
            </p>
            <div className="criteria">
              <strong>관찰 기준</strong>
              <p>○ 가장자리 일렬 · 지정 주차구역 안</p>
              <p>△ 통행을 막음 · 쓰러져 있음</p>
              <p>× 점자블록 · 횡단보도 · 역 출구 · 정류소 · 차도</p>
            </div>
          </div>
          <div>
            {!visible && (
              <p className="small muted">
                독립 판정 전에는 AI와 상대 판정을 숨깁니다. 두 사람 모두 제출한
                뒤 공개합니다.
              </p>
            )}
            {visible && (
              <div className="verdicts">
                {(["A", "B", "AI"] as const).map((r) => (
                  <div key={r}>
                    {r}:{" "}
                    {observation.judgments[r]
                      ? statusLabels[observation.judgments[r]!.status]
                      : "미제출"}
                    {observation.judgments[r] && (
                      <>
                        <p>
                          {kindLabels[observation.judgments[r]!.kind]} · 위험
                          위치:{" "}
                          {observation.judgments[r]!.risks.map(
                            (x) => riskLabels[x],
                          ).join(", ") || "없음"}{" "}
                          · 쓰러짐:{" "}
                          {observation.judgments[r]!.fallen ? "예" : "아니오"}
                        </p>
                        <p>{observation.judgments[r]!.reason}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!visible && current && (
              <p className="notice">
                내 원판정: {statusLabels[current.status]} · {current.reason}
              </p>
            )}
            {role === "resolve" && visible && (
              <div className="button-group">
                {(["A", "B"] as const).map((r) => (
                  <button
                    type="button"
                    className="secondary"
                    key={r}
                    onClick={() =>
                      setJ({ ...observation.judgments[r]!, reason: "" })
                    }
                  >
                    {r} 판정 불러오기
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  if (role === "resolve")
                    await repo.resolveJudgment(observation.id, j);
                  else await repo.submitJudgment(observation.id, role, j);
                  await onDone();
                } catch (error) {
                  setError(
                    error instanceof Error ? error.message : "저장 실패",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <fieldset disabled={busy || (role !== "resolve" && !!current)}>
                <label>
                  기기 구분
                  <select
                    value={j.kind}
                    onChange={(e) =>
                      setJ({ ...j, kind: e.target.value as Judgment["kind"] })
                    }
                  >
                    {Object.entries(kindLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  주차 상태
                  <select
                    value={j.status}
                    onChange={(e) =>
                      setJ({
                        ...j,
                        status: e.target.value as Judgment["status"],
                      })
                    }
                  >
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>위험 위치 (복수 선택)</legend>
                  <div className="checkbox-grid">
                    {Object.entries(riskLabels).map(([k, v]) => (
                      <label key={k}>
                        <input
                          type="checkbox"
                          checked={j.risks.includes(
                            k as Judgment["risks"][number],
                          )}
                          onChange={(e) =>
                            setJ({
                              ...j,
                              risks: e.target.checked
                                ? [...j.risks, k as Judgment["risks"][number]]
                                : j.risks.filter((r) => r !== k),
                            })
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={j.fallen}
                    onChange={(e) => setJ({ ...j, fallen: e.target.checked })}
                  />
                  쓰러진 기기
                </label>
                <label>
                  판정 사유
                  <textarea
                    value={j.reason}
                    onChange={(e) => setJ({ ...j, reason: e.target.value })}
                    required
                    maxLength={2000}
                    placeholder="무엇을 보고 판단했는지 적어 주세요."
                  />
                </label>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
              </fieldset>
              {role !== "resolve" && current ? (
                <p className="notice">
                  원판정 제출 완료 · 수정하지 않고 보존합니다.
                </p>
              ) : (
                <button className="primary full" disabled={busy}>
                  {busy
                    ? "저장 중…"
                    : role === "resolve"
                      ? "확정 판정 저장"
                      : role + " 판정 제출"}
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
