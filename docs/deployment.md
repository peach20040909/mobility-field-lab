# 배포 및 실행

## 로컬

Node 24 환경에서 `npm ci`, `npm run dev` 실행 후 http://127.0.0.1:3000 접속.

검증: `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`, `npm run build`.

## GitHub Pages

main push 시 GitHub Actions가 테스트·타입 검사·모바일/시연 E2E를 실행한 뒤 정적 출력물을 배포합니다. Pages Source는 GitHub Actions입니다. CI에서 NEXT_PUBLIC_BASE_PATH=/mobility-field-lab 설정으로 경로를 일치시킵니다.

사이트: https://peach20040909.github.io/mobility-field-lab/

2026-10-01 GitHub Actions의 웹앱 검증·Python AI 계약 검증·Pages 배포 성공을 확인했다. 배포 URL의 데스크톱·모바일 화면과 실제 로컬 AI 연결 흐름도 별도 브라우저에서 확인했다. AI 연결은 로컬 접근 허용 여부에 따라 달라지며, 허용하지 않으면 로컬 웹앱을 사용할 수 있다.

공식 배포 동작: https://github.com/actions/deploy-pages

## 저장 경계

이 배포는 브라우저별 IndexedDB를 사용합니다. 사진을 공개 저장소 또는 서버로 보내지 않습니다. 다른 기기·다른 브라우저와 자동 공유하지 않습니다. 전체 백업 JSON으로 보존하고 가져올 수 있습니다. 백업에는 실제 사진이 포함될 수 있으므로 사용자가 보관합니다.

실제 AI는 이 PC에서 실행하는 별도 로컬 서버와 연결합니다. GitHub Pages 자체는 AI 서버를 제공하지 않습니다. 인증된 팀 공동 저장, 자동 가림 처리, 견인 원자료 분석은 미연결입니다. 예시 데이터와 예시 AI 판정은 합성값이며 실제 조사 또는 성능 증거가 아닙니다.

## 다음 연결 조건

실제 AI: 사용 가능한 조사 사진, 모델 라이선스 및 실행 자원 검증. 팀 서버: 인증·비공개 저장소·DB를 실행할 호스팅 환경. 견인 분석: 원자료 CSV와 열 정의. 연결 전까지 해당 기능이 작동한다고 보고하지 않습니다.

