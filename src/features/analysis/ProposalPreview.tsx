"use client";
import { useRef } from "react";
import ProposalMap from "./ProposalMap";
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
          <ProposalMap />
          <div className={styles.legend}>
            <span>🟡 견인 집중 예시</span>
            <span>✕ 위험 위치 예시</span>
            <span>● 주차칸 후보</span>
            <span>┄ 레드로드</span>
            <span>▪ 경의선숲길</span>
            <span>② 2호선 · 공항철도 · 경의중앙선 출구 번호</span>
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
        </div>
      </div>
      <p className={styles.note}>
        견인 규모와 보행 위험을 함께 보고 우선순위를 정합니다. 실제 후보지는
        견인 원자료와 현장 측정 결과를 대조한 뒤 선정하겠습니다.
      </p>
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
