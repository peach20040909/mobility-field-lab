"use client";
import {
  HONGDAE_DEMO_ID,
  hongdaePhotos,
  hongdaeCases,
  HONGDAE_ARTIFACT_URL,
} from "@/data/hongdae";
import { statusLabels, type Observation } from "@/domain/schema";
import styles from "./HongdaePrepared.module.css";
import CampusCase from "./CampusCase";

export default function HongdaePrepared({
  observations,
  onReview,
  onAnalysis,
  onMap,
}: {
  observations: Observation[];
  onReview: (id: string) => void;
  onAnalysis: () => void;
  onMap: () => void;
}) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <section className={styles.prepared}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>홍대 · 2026.9.28 · 저장된 결과</span>
          <h2>홍대 사진으로 준비한 사전 분석</h2>
          <p>사진 25장 · 대표 사진 2장 · 사전 판정 항목 6건</p>
        </div>
        <div className={styles.actions}>
          <button
            onClick={() =>
              document
                .getElementById("campus-case")
                ?.scrollIntoView({ behavior: "instant", block: "start" })
            }
          >
            명지대 앞 사례 보기
          </button>
          <button onClick={() => onReview(HONGDAE_DEMO_ID + "-03")}>
            불일치 조정 시연
          </button>
          <button onClick={onAnalysis}>숫자 보기 →</button>
          <button onClick={onMap}>지도 보기 →</button>
        </div>
      </div>
      <p className={styles.caption}>
        실제 홍대 사진에 자료의 표시 영역을 옮겼습니다. A/B와 최종 판정은 흐름
        설명용 예시이며, 실제 두 사람의 조사 판정이 아닙니다. 나머지 사진은 사전
        검토 메모와 함께 보관합니다.
      </p>
      <div className={styles.photoPair}>
        {[12, 0].map((index, i) => {
          const p = hongdaePhotos[index];
          return (
            <figure key={index}>
              <div className={styles.frame}>
                <img
                  src={base + p.path}
                  alt={p.title}
                  width={index === 12 ? 1200 : 900}
                  height={index === 12 ? 900 : 1200}
                />
                {hongdaeCases
                  .filter((c) => c.photoIndex === index)
                  .map((c) => (
                    <span
                      key={c.key}
                      aria-label={`사전 판정 ${c.key} 표시 영역`}
                      className={`${styles.box} ${styles[c.judgment.status]}`}
                      style={{
                        left: c.bbox[0] * 100 + "%",
                        top: c.bbox[1] * 100 + "%",
                        width: (c.bbox[2] - c.bbox[0]) * 100 + "%",
                        height: (c.bbox[3] - c.bbox[1]) * 100 + "%",
                      }}
                    >
                      <b>{c.key}</b>
                    </span>
                  ))}
              </div>
              <figcaption>
                <strong>
                  {i === 0 ? "A · 레드로드 안" : "B · 홍대입구역 8번 출구 앞"}
                </strong>
                <span>
                  {i === 0
                    ? "사진 속 기기 2대"
                    : "사진 속 기기 5대 이상 · 겹침 포함"}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className={styles.summaries}>
        <div>
          <b>2</b>
          <span>정상 · 사전 판정 항목</span>
        </div>
        <div>
          <b>2</b>
          <span>위험 · 묶음 1건 포함</span>
        </div>
        <div>
          <b>2</b>
          <span>판정 보류 · 사람 확인</span>
        </div>
      </div>
      <p className={styles.caption}>
        위험 항목에는 노란 자전거 2대 이상을 묶은 05번이 포함됩니다. 6건은 기기
        대수가 아닌 판정 항목 수입니다. 묶음은 정확한 대수 확인 전까지
        대시보드의 대수·비율에서 제외합니다.
      </p>
      <div className={styles.tableWrap}>
        <table aria-label="홍대 사전 판정 결과">
          <thead>
            <tr>
              <th>번호·기기</th>
              <th>사전 판정</th>
              <th>근거</th>
              <th>A/B 검수 시연</th>
            </tr>
          </thead>
          <tbody>
            {hongdaeCases.map((c) => {
              const o = observations.find(
                (x) => x.id === HONGDAE_DEMO_ID + "-" + c.key,
              );
              return (
                <tr key={c.key}>
                  <th>
                    {c.key} · {c.title}
                  </th>
                  <td>
                    <strong className={styles[c.judgment.status]}>
                      {c.judgment.status === "unassessable"
                        ? "? 판정 보류"
                        : statusLabels[c.judgment.status]}
                    </strong>
                  </td>
                  <td>{c.judgment.reason}</td>
                  <td>
                    <button
                      onClick={() => onReview(HONGDAE_DEMO_ID + "-" + c.key)}
                    >
                      {c.key} 독립 판정 보기
                    </button>
                    <small>
                      {c.key === "03"
                        ? o?.final
                          ? "불일치 조정 완료"
                          : "불일치 조정 대기"
                        : "일치 예시"}
                    </small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.caption}>
        출처:{" "}
        <a href={HONGDAE_ARTIFACT_URL} target="_blank" rel="noreferrer">
          팀 제공 사전 분석 자료
        </a>{" "}
        · 모델 버전과 분석 시각은 자료에 없습니다. 법적 위반·실제 보도
        폭·정확도를 확정하는 결과가 아닙니다.
      </p>
      <CampusCase />
      <details className={styles.galleryDetails}>
        <summary>사전조사 사진 전체 25장 · 메모 보기</summary>
        <div className={styles.gallery} aria-label="홍대 사전조사 사진 모음">
          {hongdaePhotos.map((p) => (
            <figure key={p.index}>
              <img
                src={base + p.path}
                alt={`홍대 사진 ${String(p.index + 1).padStart(2, "0")} · ${p.title}`}
                loading="lazy"
              />
              <figcaption>
                <strong>
                  {String(p.index + 1).padStart(2, "0")} · {p.title}
                </strong>
                <p>{p.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </details>
    </section>
  );
}
