# Mobility Field Lab

해외탐방 면접 시연과 현장조사를 위한 공유 이동수단 조사 플랫폼.

서울과 유럽의 보도 위 공유 킥보드·공유 전기자전거를 같은 기준으로 기록하고, 사진 판정과 두 사람의 독립 검수를 바탕으로 지표와 지도를 제공하는 것을 목표로 합니다.

## 현재 상태

1차 면접 시연용 웹앱을 구현했습니다. 조사 등록, 사진 저장, A/B 독립 판정과 최종 조정, 중복 기기 연결·해제, 지표·지도, JSON 백업 및 CSV 내보내기를 제공합니다.

데이터는 현재 브라우저의 IndexedDB에 저장됩니다. 합성 예시와 실제 조사 기록을 분리합니다. AI 추론, 계정 기반 팀 동기화, 견인 원자료 연결은 후속 구현 항목입니다.

[웹앱](https://peach20040909.github.io/mobility-field-lab/)

## 실행 및 검증

Node.js 24 환경에서 `npm ci`, `npm run dev`로 실행합니다.

`npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`로 검증합니다. 브라우저 테스트 최초 실행 전 `npx playwright install chromium`이 필요합니다.

main에 반영하면 GitHub Actions에서 검증 후 GitHub Pages에 정적 배포합니다.

## 설계

[구현 설계서](docs/superpowers/specs/2026-10-01-mobility-research-design.md)

## 예정 흐름

사진·측정 구간 등록 → AI 판정 → 독립 검수 → 확정 판정 → 지표·지도 → CSV 내보내기.

원본 PDF, 개인정보가 포함된 제출 서류, 로컬 연구 자료, API 키는 저장소에 포함하지 않습니다.
