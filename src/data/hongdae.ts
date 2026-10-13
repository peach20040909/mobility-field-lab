import type { Judgment, ProjectExport } from "../domain/schema";

export const HONGDAE_DEMO_ID = "demo-hongdae-prepared-v1";
export const HONGDAE_ARTIFACT_URL =
  "https://claude.ai/artifact/FfrGvsceXDUMGp6PRXgvtd";
export const hongdaePhotos = [
  [
    "홍대입구역 8번 출구 앞",
    "출입구와 점자블록 주변에 여러 기기가 겹쳐 있습니다. 가려진 기기는 대수를 확정하지 않습니다.",
  ],
  [
    "8번 출구 앞 · 다른 각도",
    "첫 사진과 같은 장소의 다른 각도입니다. 같은 기기를 다시 세지 않도록 비교합니다.",
  ],
  [
    "안내 기둥 주변 · 보라색 기기",
    "보라색 기기와 자전거가 안내 기둥 주변에 놓여 있습니다. 기기별 보행 경로를 확인합니다.",
  ],
  [
    "상점 앞 · 보라색 기기",
    "기기 일부가 사진 밖에 있습니다. 전체 위치와 통행 영향을 확정하기 어렵습니다.",
  ],
  [
    "보행로의 보라색 기기",
    "기둥과 안내판 사이의 기기를 확인합니다. 남은 통행 공간은 현장에서 확인해야 합니다.",
  ],
  [
    "골목의 기기 줄",
    "가장자리의 기기 줄을 기록했습니다. 로고가 가려진 기기는 공유 여부를 보류합니다.",
  ],
  [
    "골목의 기기 줄 · 근접",
    "같은 골목의 근접 사진입니다. 앞 사진과 기기 중복 여부를 확인합니다.",
  ],
  [
    "골목 양쪽의 기기",
    "양쪽 기기 사이로 통행 경로가 보입니다. 배치와 보행 여유를 함께 확인합니다.",
  ],
  [
    "레드로드 안내판 주변",
    "안내판 주변에 자전거와 다른 기기가 있습니다. 개인·공유 기기를 구분해야 합니다.",
  ],
  [
    "상점 앞 기기 밀집",
    "기기 여러 대가 한곳에 모여 있습니다. 기기별 위치와 겹침을 구분해야 합니다.",
  ],
  [
    "화분과 시설물 사이의 SWING",
    "화분·시설물 사이 통행 방해 가능성이 있습니다. 정상으로 단정하지 않고 현장에서 확인합니다.",
  ],
  [
    "골목 가장자리의 노란 자전거",
    "가장자리에 모인 기기를 확인합니다. 차량 이동과 보행 영향을 분리해서 판단합니다.",
  ],
  [
    "레드로드 안 · SWING과 카카오T",
    "Claude 자료의 대표 사진 A입니다. 기둥·화분 쪽의 두 자전거를 정상으로 분류한 사전 판정 예시입니다.",
  ],
  [
    "교차 지점의 기기",
    "녹색 자전거와 다른 기기가 만나는 지점입니다. 진입·회전 경로를 막는지 확인합니다.",
  ],
  [
    "빨간 난간 옆 녹색 자전거",
    "난간 옆 자전거 두 대가 보입니다. 앞 사진과 같은 기기인지 비교합니다.",
  ],
  [
    "개인형 이동장치 주차구역 표시",
    "주차구역 안내를 기록한 사진입니다. 화면 안의 표지만으로 기기가 있다고 세지 않습니다.",
  ],
  [
    "화물차 앞의 흰 자전거",
    "차량과 자전거 배치를 함께 확인합니다. 가려진 부분의 보행 경로는 보류합니다.",
  ],
  [
    "횡단보도 근처 흰 자전거",
    "횡단보도 접근 경로 가까이 기기가 있습니다. 실제 보행 동선과 겹치는지 확인합니다.",
  ],
  [
    "버스와 나무 주변의 자전거",
    "나무 주변의 기기가 보도 여유 공간을 차지하는지 확인합니다. 버스 승하차 위치는 별도 확인합니다.",
  ],
  [
    "가로수 옆 파란 자전거",
    "가로수 옆 자전거의 공유 여부는 로고 확인이 필요합니다. 색상만으로 공유로 분류하지 않습니다.",
  ],
  [
    "나무 주변의 자전거 줄",
    "나무와 기기 사이의 경로를 확인합니다. 앞 사진과 동일 기기의 중복 기록 가능성이 있습니다.",
  ],
  [
    "기둥 주변 기기 밀집",
    "기둥 주변에 여러 기기가 겹쳐 있습니다. 가려진 기기는 한 장으로 대수를 확정하지 않습니다.",
  ],
  [
    "기둥 주변 기기 · 다른 각도",
    "앞 사진을 보완하는 다른 각도입니다. 같은 기기를 별도로 합산하지 않습니다.",
  ],
  [
    "녹색 기기의 로고·신고 안내",
    "브랜드와 신고 안내를 확인하는 근접 사진입니다. 새로운 기기 한 대로 별도 합산하지 않습니다.",
  ],
  [
    "나무 옆 SWING 자전거",
    "나무와 시설물 주변 기기를 확인합니다. 사진 밖으로 이어지는 통행 경로는 현장 확인이 필요합니다.",
  ],
].map(([title, note], index) => ({
  index,
  title,
  note,
  path: `/hongdae/photo-${String(index).padStart(2, "0")}.jpg`,
}));
export const HONGDAE_PHOTO_PATHS = new Set(hongdaePhotos.map((p) => p.path));
export const hongdaeCases: {
  key: string;
  photoIndex: number;
  title: string;
  judgment: Judgment;
  bbox: [number, number, number, number];
  group?: boolean;
}[] = [
  {
    key: "01",
    photoIndex: 12,
    title: "흰색 SWING 공유 전기자전거",
    judgment: {
      kind: "shared-ebike",
      status: "normal",
      risks: [],
      fallen: false,
      reason:
        "기둥·화분 쪽 가장자리에 놓여 보행 동선을 막지 않는 것으로 판정한 예시",
    },
    bbox: [0.1, 0.5, 0.556, 0.96],
  },
  {
    key: "02",
    photoIndex: 12,
    title: "노란 카카오T 공유 전기자전거",
    judgment: {
      kind: "shared-ebike",
      status: "normal",
      risks: [],
      fallen: false,
      reason: "기둥 쪽에 정렬되어 통행을 방해하지 않는 것으로 판정한 예시",
    },
    bbox: [0.58, 0.46, 0.89, 0.79],
  },
  {
    key: "03",
    photoIndex: 0,
    title: "녹색 공유 전기자전거",
    judgment: {
      kind: "shared-ebike",
      status: "danger",
      risks: ["exit", "tactile"],
      fallen: false,
      reason:
        "역 출구 계단·점자블록 접근 경로를 가릴 가능성이 있어 위험으로 분류",
    },
    bbox: [0.19, 0.48, 0.5, 0.74],
  },
  {
    key: "04",
    photoIndex: 0,
    title: "보라색 beam · 기기 형태 보류",
    judgment: {
      kind: "unknown",
      status: "unassessable",
      risks: [],
      fallen: false,
      reason: "기기 형태와 바닥 위치가 다른 기기에 가려져 판정 보류",
    },
    bbox: [0.45, 0.44, 0.64, 0.71],
  },
  {
    key: "05",
    photoIndex: 0,
    title: "노란 자전거 2대 이상 · 묶음",
    judgment: {
      kind: "shared-ebike",
      status: "danger",
      risks: ["exit"],
      fallen: false,
      reason:
        "출구 앞에 겹쳐 놓인 자전거 묶음. 정확한 대수는 추가 각도로 확인 필요",
    },
    bbox: [0.47, 0.625, 0.82, 0.795],
    group: true,
  },
  {
    key: "06",
    photoIndex: 0,
    title: "파란 프레임 자전거 · 공유 여부 보류",
    judgment: {
      kind: "unknown",
      status: "unassessable",
      risks: [],
      fallen: false,
      reason: "로고가 보이지 않아 개인·공유 여부를 확정할 수 없음",
    },
    bbox: [0.54, 0.68, 1, 0.915],
  },
];

export function hongdaeDemoProject(): ProjectExport {
  const segmentId = HONGDAE_DEMO_ID + "-segment";
  const session = {
    id: HONGDAE_DEMO_ID,
    city: "seoul",
    place: "홍대 사전조사 시연",
    date: "2026-09-28",
    time: "13:00",
    timezone: "Asia/Seoul",
    weather: "현장 기록 미기재",
    source: "demo" as const,
    lengthM: 200,
    relation: "single" as const,
    latitude: 37.5563,
    longitude: 126.9236,
    createdAt: "2026-10-14T00:00:00Z",
  };
  const segment = {
    id: segmentId,
    sessionId: session.id,
    lengthM: 200,
    relation: session.relation,
    latitude: session.latitude,
    longitude: session.longitude,
  };
  const photos = hongdaePhotos.map((p) => ({
    id: HONGDAE_DEMO_ID + "-photo-" + p.index,
    segmentId,
    name: p.title,
    dataUrl: p.path,
    redacted: true,
    publicationReviewed: true,
    preparedSource:
      p.index === 0 || p.index === 12
        ? "Claude 자료의 사전 판정 · 모델 버전·분석 시각 미기재"
        : "사진별 사전 검토 메모 · 기기별 판정 미확정",
    preparedNote: p.note,
  }));
  const observations = hongdaeCases.map((c) => {
    const id = HONGDAE_DEMO_ID + "-" + c.key;
    const a: Judgment =
      c.key === "03"
        ? {
            ...c.judgment,
            status: "normal",
            risks: [],
            reason: "시연 A 예시: 출구 옆에 있어 통행을 막지 않는 것으로 판단",
          }
        : { ...c.judgment, reason: "시연 A 예시: " + c.judgment.reason };
    const b: Judgment = {
      ...c.judgment,
      reason: "시연 B 예시: " + c.judgment.reason,
    };
    return {
      id,
      photoId: photos[c.photoIndex].id,
      segmentId,
      canonicalDeviceId: id,
      kind: c.judgment.kind,
      bbox: c.bbox,
      countMode: c.group ? ("group" as const) : ("device" as const),
      judgments: { A: a, B: b, AI: c.judgment },
      final:
        c.key === "03"
          ? undefined
          : {
              ...c.judgment,
              reason: "시연용 최종 판정 예시: " + c.judgment.reason,
            },
      history: [],
    };
  });
  return {
    version: 1,
    sessions: [session],
    segments: [segment],
    photos,
    observations,
  };
}
