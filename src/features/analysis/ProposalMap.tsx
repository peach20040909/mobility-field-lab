"use client";
import { useId } from "react";
import styles from "./ProposalPreview.module.css";

export default function ProposalMap() {
  const gradient = useId();
  return (
    <svg
      viewBox="0 0 1000 620"
      role="img"
      aria-label="홍대입구역 주변 주차칸 후보 A·B·C를 나타낸 예시 개념도"
      className={styles.map}
    >
      <defs>
        <radialGradient id={gradient}>
          <stop stopColor="#e2be57" stopOpacity=".65" />
          <stop offset="1" stopColor="#e2be57" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="620" fill="#f0eee7" />
      <g fill="#e5e2d8">
        <path d="M0 0H410L310 100L0 270Z" />
        <path d="M410 0H690L640 120L550 160Z" />
        <path d="M760 0H1000V130L760 110Z" />
        <path d="M0 340L280 155L380 265L120 465L0 520Z" />
        <path d="M780 230L1000 240V360L860 395Z" />
        <path d="M480 400L630 320L765 440L620 520Z" />
        <path d="M760 515L1000 425V620H850Z" />
        <path d="M0 575L300 445L355 620H0Z" />
      </g>
      <g stroke="white" strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M30 200L300 0M60 300L360 100M120 380L420 170M80 120L210 310M190 30L320 230M300 0L380 160M360 320L90 520M290 620L230 440M415 620L355 470M740 0L790 120M860 0L880 140M940 0L960 140M800 345L1000 310M760 405L1000 425M620 380L700 550M520 400L600 620" />
      </g>
      <path
        d="M380 -30L665 220"
        stroke="#b7d2a2"
        strokeWidth="35"
        fill="none"
      />
      <path
        d="M690 250L940 495"
        stroke="#cde0bd"
        strokeWidth="25"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30 620L700 150L1010 170"
        stroke="white"
        strokeWidth="34"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M30 620L700 150L1010 170"
        stroke="#d9d3c1"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M260 630L1000 155" stroke="white" strokeWidth="8" fill="none" />
      <path d="M635 630L1000 385" stroke="white" strokeWidth="10" fill="none" />
      <path
        d="M428 620L455 480L435 405"
        stroke="#edc1af"
        strokeWidth="18"
        fill="none"
      />
      <path
        d="M428 620L455 480L435 405"
        stroke="#b7462c"
        strokeWidth="2.5"
        strokeDasharray="8 6"
        fill="none"
      />
      <g fill={`url(#${gradient})`}>
        <ellipse cx="550" cy="345" rx="105" ry="75" />
        <ellipse cx="410" cy="410" rx="90" ry="70" />
        <ellipse cx="710" cy="210" rx="75" ry="60" />
      </g>
      <g fill="#989c8d" fontSize="24" fontWeight="700">
        <text x="200" y="110">
          연남동
        </text>
        <text x="820" y="80">
          동교동
        </text>
        <text x="150" y="430">
          서교동
        </text>
      </g>
      <g fill="#64705d" fontSize="16" fontWeight="600">
        <text x="860" y="145">
          신촌로
        </text>
        <text x="710" y="180" fontSize="13">
          동교동삼거리
        </text>
        <text x="780" y="540" transform="rotate(-34 780 540)">
          와우산로
        </text>
        <text x="210" y="550" transform="rotate(-34 210 550)">
          양화로
        </text>
        <text x="470" y="580" transform="rotate(-82 470 580)">
          홍익로
        </text>
        <text x="280" y="610" transform="rotate(-33 280 610)">
          어울마당로
        </text>
        <text x="700" y="65" transform="rotate(-82 700 65)">
          동교로
        </text>
        <text x="466" y="62" transform="rotate(42 466 62)">
          경의선숲길 (연트럴파크)
        </text>
        <text x="760" y="350" transform="rotate(43 760 350)">
          경의선책거리
        </text>
        <text x="300" y="585" fontSize="13">
          홍익대학교
        </text>
        <text x="20" y="600" fontSize="13">
          ← 합정
        </text>
        <text x="940" y="200" fontSize="13">
          신촌 →
        </text>
      </g>
      <g transform="translate(510 285) rotate(-35)">
        <rect
          x="-115"
          y="-23"
          width="230"
          height="46"
          rx="23"
          fill="#3d8b49"
          stroke="white"
          strokeWidth="3"
        />
        <text
          y="7"
          textAnchor="middle"
          fill="white"
          fontSize="21"
          fontWeight="700"
        >
          홍대입구역 ②
        </text>
      </g>
      {[
        [1, 365, 315],
        [2, 555, 185],
        [3, 630, 165],
        [4, 670, 115],
        [5, 715, 195],
        [6, 665, 280],
        [7, 700, 250],
        [8, 605, 255],
        [9, 425, 380],
      ].map(([n, x, y]) => (
        <g key={n}>
          <circle
            cx={x}
            cy={y}
            r="13"
            fill="white"
            stroke={n >= 3 && n <= 5 ? "#0079ba" : "#408951"}
            strokeWidth="2.5"
          />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#326647"
          >
            {n}
          </text>
        </g>
      ))}
      <g stroke="#b63c26" strokeWidth="5" strokeLinecap="round">
        {[
          [685, 210],
          [630, 310],
          [430, 400],
          [440, 490],
        ].map(([x, y]) => (
          <path key={y} d={`M${x - 8} ${y - 8}l16 16m0-16l-16 16`} />
        ))}
      </g>
      {[
        ["A", 560, 330],
        ["B", 375, 410],
        ["C", 470, 480],
      ].map(([label, x, y]) => (
        <g key={label} transform={`translate(${x} ${y})`}>
          <path
            d="M0 27L-19 3a24 24 0 1 1 38 0Z"
            fill="#315c49"
            stroke="white"
            strokeWidth="3"
          />
          <text
            y="-5"
            textAnchor="middle"
            fill="white"
            fontSize="23"
            fontWeight="700"
          >
            {label}
          </text>
        </g>
      ))}
      <rect
        x="14"
        y="14"
        width="395"
        height="29"
        rx="7"
        fill="white"
        fillOpacity=".92"
      />
      <text x="27" y="34" fill="#62705e" fontSize="13">
        제공 자료의 도로 배치를 단순화한 개념도 · 축척·거리 측정 아님
      </text>
    </svg>
  );
}
