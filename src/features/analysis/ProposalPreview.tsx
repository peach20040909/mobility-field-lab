"use client";
import { useId, useRef } from "react";
import styles from "./ProposalPreview.module.css";
const candidates = [
  {
    id: "A",
    title: "8번 출구 옆 보도 안쪽",
    risk: "역 출구 · 점자블록",
    note: "9월 사전조사 사진에서 출구 앞 기기 방치를 관찰했습니다. 출입 동선을 피해 반납 공간을 두는 방안을 검토합니다.",
  },
  {
    id: "B",
    title: "홍익로 입구, 레드로드 경계 밖",
    risk: "통행 방해",
    note: "구역 경계에 기기가 몰리는지 확인하고, 보행 흐름을 막지 않는 반납 자리를 검토합니다.",
  },
  {
    id: "C",
    title: "홍익로 · 어울마당로 갈림길",
    risk: "횡단보도",
    note: "횡단보도 진입로와 모퉁이에서 떨어진 위치를 후보로 검토합니다.",
  },
];
function Report() {
  const gradientId = useId();
  return (
    <div className={styles.report}>
      <div className={styles.reportTitle}>
        <div>
          <span>결과물 미리보기 · 서울시·자치구 제안서 부록</span>
          <h3>홍대입구역, 주차칸은 어디에 먼저</h3>
        </div>
        <strong>예시 데이터 · 후보 위치는 가정</strong>
      </div>
      <div className={styles.equation}>
        <div>
          <span>서울 견인 기록 2022~2025</span>
          <b>어디에 몰리나</b>
          <small>수만 건 · 규모</small>
        </div>
        <em>＋</em>
        <div>
          <span>현장 사진 판정</span>
          <b>왜 위험한가</b>
          <small>역 출구 · 점자블록 · 횡단보도</small>
        </div>
        <em>＝</em>
        <div>
          <span>제안</span>
          <b>주차칸 우선 후보지</b>
          <small>둘 다 겹치는 곳부터</small>
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.mapFrame}>
          <svg
            viewBox="0 0 700 530"
            role="img"
            aria-label="홍대입구역 주변 주차칸 후보 A·B·C를 나타낸 예시 개념도"
            className={styles.map}
          >
            <defs>
              <radialGradient id={gradientId}>
                <stop stopColor="#d7b14b" stopOpacity=".65" />
                <stop offset="1" stopColor="#d7b14b" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="700" height="530" fill="#eff0e9" />
            <g stroke="white" strokeWidth="6" fill="none">
              <path d="M-30 100L170 530M20 0L275 530M160 0L430 530M360 0L690 530M540 0L740 320M-20 380L450 0M-20 520L560 0M145 530L700 130M390 530L700 325M-20 235L700 90M-20 90L700 390M20 480L700 430" />
              <path d="M0 170L135 135L230 155L325 80L440 45L570 55L700 100M0 440L110 400L180 325L310 300L450 235L570 225L700 250" />
            </g>
            <path d="M95 530L570 45" stroke="#fff" strokeWidth="30" />
            <path d="M95 530L570 45" stroke="#deded1" strokeWidth="2" />
            <path
              d="M210 375L410 530"
              stroke="#83a788"
              strokeOpacity=".6"
              strokeWidth="24"
            />
            <path
              d="M210 375L410 530"
              stroke="#547b58"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <g fill={`url(#${gradientId})`}>
              <circle cx="365" cy="245" r="80" />
              <circle cx="235" cy="380" r="75" />
              <circle cx="580" cy="130" r="70" />
            </g>
            <g fill="#5d6e61" fontSize="16" fontWeight="600">
              <text x="120" y="460" transform="rotate(-45 120 460)">
                양화로
              </text>
              <text x="315" y="470" transform="rotate(38 315 470)">
                홍익로
              </text>
              <text x="550" y="80">
                신촌로
              </text>
            </g>
            <g fill="#fff" stroke="#56776b" strokeWidth="2">
              {[
                ["1", 310, 310],
                ["3", 460, 80],
                ["4", 500, 110],
                ["5", 565, 125],
                ["6", 670, 210],
                ["7", 600, 190],
                ["8", 400, 235],
                ["9", 330, 345],
              ].map(([label, x, y]) => (
                <g key={label}>
                  <circle cx={Number(x)} cy={Number(y)} r="11" />
                  <text
                    x={Number(x)}
                    y={Number(y) + 4}
                    stroke="none"
                    fill="#35574a"
                    textAnchor="middle"
                    fontSize="12"
                  >
                    {label}
                  </text>
                </g>
              ))}
            </g>
            <g stroke="#ae4f38" strokeWidth="5" strokeLinecap="round">
              {[
                [420, 250],
                [340, 360],
                [580, 140],
                [235, 390],
              ].map(([x, y]) => (
                <path key={x} d={`M${x - 7} ${y - 7}l14 14m0-14l-14 14`} />
              ))}
            </g>
            <g fill="#365a49" stroke="white" strokeWidth="3">
              {[
                ["A", 375, 215],
                ["B", 215, 360],
                ["C", 310, 425],
              ].map(([label, x, y]) => (
                <g key={label}>
                  <path
                    d={`M${x} ${Number(y) + 28}l-16-22a20 20 0 1 1 32 0z`}
                  />
                  <text
                    x={Number(x)}
                    y={Number(y)}
                    fill="white"
                    stroke="none"
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="700"
                  >
                    {label}
                  </text>
                </g>
              ))}
            </g>
            <rect
              x="326"
              y="270"
              width="130"
              height="30"
              rx="15"
              fill="#365a49"
            />
            <text
              x="391"
              y="291"
              textAnchor="middle"
              fill="white"
              fontSize="16"
              fontWeight="700"
            >
              홍대입구역
            </text>
            <text x="18" y="510" fill="#576657" fontSize="13">
              위치 관계를 설명하는 개념도 · 실제 지도와 거리 측정 아님
            </text>
          </svg>
          <div className={styles.legend}>
            <span>🟡 견인 집중 예시</span>
            <span>✕ 위험 위치 예시</span>
            <span>● 주차칸 후보</span>
            <span>━ 레드로드 일대</span>
          </div>
        </div>
        <div className={styles.candidates}>
          {candidates.map((c) => (
            <article key={c.id}>
              <h4>
                <span>{c.id}</span>
                {c.title}
              </h4>
              <div className={styles.tags}>
                <span>견인 많음 · 예시</span>
                <span>{c.risk}</span>
              </div>
              <p>{c.note}</p>
            </article>
          ))}
          <p className={styles.note}>
            견인 규모와 보행 위험을 함께 보고 우선순위를 정합니다. 실제 후보지는
            견인 원자료와 현장 측정 결과를 대조한 뒤 선정하겠습니다.
          </p>
        </div>
      </div>
      <p className={styles.caption}>
        인도지킴이들 · 장민준 · 김효준 | 제안서 형식 예시입니다. 현재 대시보드
        통계로 산출한 후보지가 아닙니다.
      </p>
    </div>
  );
}
export default function ProposalPreview() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <section className={styles.card} aria-label="서울시 제안서 결과물 예시">
      <div className={styles.heading}>
        <div>
          <span className={styles.badge}>제안서 결과물 예시</span>
          <h2>이런 결과물로 서울시에 제안하겠습니다.</h2>
        </div>
        <button type="button" onClick={() => dialog.current?.showModal()}>
          제안서 크게 보기 ↗
        </button>
      </div>
      <p>
        조사 기록과 현장 판정을 종합해, 주차칸이 필요한 위치와 근거를 이런
        형태의 결과물로 정리하겠습니다.
      </p>
      <Report />
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label="제안서 크게 보기"
      >
        <div className={styles.dialogHeader}>
          <b>서울시 제안서 결과물 예시</b>
          <button type="button" onClick={() => dialog.current?.close()}>
            닫기 ✕
          </button>
        </div>
        <Report />
      </dialog>
    </section>
  );
}
