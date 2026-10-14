"use client";
import { useEffect, useRef } from "react";
import styles from "./CampusCase.module.css";

export default function CampusCase() {
  const section = useRef<HTMLElement>(null);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  useEffect(() => {
    if (window.location.hash === "#campus")
      section.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);
  return (
    <section
      ref={section}
      id="campus-case"
      className={styles.card}
      aria-label="명지대 앞 버스정류장 관찰 사례"
    >
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            추가 현장 사례 · 명지대 앞 버스정류장
          </span>
          <h2>우리 학교 앞에서도 마주친 문제</h2>
        </div>
        <span className={styles.badge}>통행 방해 관찰 사례</span>
      </div>
      <p className={styles.lead}>
        사람이 많이 지나는 정류장 앞 보도에 놓인 자전거. 사진 두 장으로 기기
        배치와 주변 보행 상황을 함께 기록했습니다.
      </p>
      <div className={styles.photos}>
        <figure>
          <img
            src={base + "/campus/bus-stop-1.jpg"}
            alt="명지대 앞 정류장 보도에 놓인 자전거와 주변 보행자"
            width={1080}
            height={1440}
          />
          <figcaption>정류장 앞 보도 · 기기와 보행 공간</figcaption>
        </figure>
        <figure>
          <img
            src={base + "/campus/bus-stop-2.jpg"}
            alt="명지대 버스정류장 표지 옆 자전거와 혼잡한 보도를 반대 각도에서 본 사진"
            width={1440}
            height={1080}
          />
          <figcaption>반대쪽에서 본 배치 · 정류장 표지와 보행자</figcaption>
        </figure>
      </div>
      <div className={styles.evidence}>
        <div>
          <h3>사진에서 확인한 내용</h3>
          <p>
            돌담 옆 자전거가 보행 공간 일부를 차지하고 있습니다. 정류장 표지와
            주변 보행자도 함께 보입니다.
          </p>
        </div>
        <div>
          <h3>촬영자의 현장 설명</h3>
          <p>
            효준이는 정류장 앞에서 통행 공간이 부족해 불편을 겪었다고
            전했습니다. 팀은 사람들이 기기를 피해 돌아가는 상황을 현장 사례로
            기록했습니다.
          </p>
        </div>
      </div>
      <blockquote>
        “홍대뿐 아니라 실제 명지대 앞에서도 이런 배치를 볼 수 있었습니다. 기기가
        보행 공간을 차지할 때 사람들이 겪는 불편까지 기록하겠습니다.”
      </blockquote>
      <p className={styles.caption}>
        예시 데이터 · 팀 제공 실제 사진과 현장 설명으로 정리한 관찰 사례입니다.
        홍대 대표 사진의 대수·거리 집계와는 별도로 보관합니다.
      </p>
    </section>
  );
}
