import styles from "./ProposalPreview.module.css";

export default function ProposalPreview() {
  const image =
    (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/proposal-preview.png";
  return (
    <section className={styles.card} aria-label="서울시 제안서 결과물 예시">
      <div className={styles.heading}>
        <div>
          <span className={styles.badge}>제안서 결과물 예시</span>
          <h2>이런 결과물로 서울시에 제안하겠습니다.</h2>
        </div>
        <a href={image} target="_blank" rel="noreferrer">
          제안서 크게 보기 ↗
        </a>
      </div>
      <p>
        조사 기록과 현장 판정을 종합해, 주차칸이 필요한 위치와 근거를 이런
        형태의 결과물로 정리하겠습니다.
      </p>
      <a
        className={styles.imageLink}
        href={image}
        target="_blank"
        rel="noreferrer"
        aria-label="서울시 제안서 예시 이미지 확대"
      >
        <img
          src={image}
          width={1102}
          height={766}
          alt="서울시 제안서 결과물 예시: 홍대입구역 주차칸 우선 후보지 지도와 A·B·C 후보의 근거"
        />
      </a>
      <p className={styles.caption}>
        팀 제공 결과물 미리보기입니다. 이미지의 후보 위치와 견인·위험 표시는
        제안서 형식을 보여주는 예시입니다.
      </p>
    </section>
  );
}
