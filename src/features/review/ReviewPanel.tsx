"use client";
import { useState } from "react";
import type { Observation, Photo, Judgment } from "@/domain/schema";
import { kindLabels, statusLabels, riskLabels } from "@/domain/schema";
import type { LocalRepository } from "@/storage/indexeddb";
export default function ReviewPanel({
  observation,
  photo,
  repo,
  onDone,
  onClose,
}: {
  observation: Observation;
  photo?: Photo;
  repo: LocalRepository;
  onDone: () => Promise<void>;
  onClose: () => void;
}) {
  const [role, setRole] = useState<"A" | "B" | "resolve">("A");
  const [j, setJ] = useState<Judgment>({
    kind: observation.kind,
    status: "normal",
    risks: [],
    fallen: false,
    reason: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current =
    role === "resolve" ? observation.final : observation.judgments[role];
  const visible = role === "resolve" || !!current;
  return (
    <div className="modal-backdrop">
      <section
        className="modal wide"
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
          로컬 역할 시연입니다. 실제 독립 검수는 서로 다른 계정의 서버 연결이
          필요합니다.
        </p>
        <div className="review-grid">
          <div>
            {photo ? (
              <img
                className="review-image"
                src={
                  photo.dataUrl.startsWith("/")
                    ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + photo.dataUrl
                    : photo.dataUrl
                }
                alt={photo.name}
              />
            ) : (
              <div className="empty">사진 없음</div>
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
            <div className="tabs">
              {(["A", "B", "resolve"] as const).map((r) => (
                <button
                  key={r}
                  className={role === r ? "selected" : ""}
                  onClick={() => {
                    setRole(r);
                    setError("");
                    setJ({
                      kind: observation.kind,
                      status: "normal",
                      risks: [],
                      fallen: false,
                      reason: "",
                    });
                  }}
                >
                  {r === "resolve" ? "최종 조정" : "검수자 " + r}
                </button>
              ))}
            </div>
            {!visible && (
              <p className="small muted">
                독립 판정 전에는 AI와 상대 판정을 숨깁니다.
              </p>
            )}
            {visible && (
              <div className="verdicts">
                {(["A", "B", "AI"] as const).map((r) => (
                  <span key={r}>
                    {r}:{" "}
                    {observation.judgments[r]
                      ? statusLabels[observation.judgments[r]!.status]
                      : "미제출"}
                  </span>
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
                    setJ({ ...j, status: e.target.value as Judgment["status"] })
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
