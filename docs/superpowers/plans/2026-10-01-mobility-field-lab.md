# Mobility Field Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 면접에서 사진 등록부터 독립 검수·지표·지도까지 시연하고 현장조사에도 사용할 한국어 웹앱을 배포한다.

**Architecture:** Next.js 웹앱에 조사 도메인과 지표 계산을 독립 TypeScript 모듈로 둔다. 초기 시연은 브라우저 IndexedDB에 저장해 계정 없이 실행하고, 공동 조사는 PostgreSQL과 비공개 이미지 저장소를 사용하는 서버 저장소로 확장한다. AI 추론은 웹 서버가 호출하는 별도 공개 모델 서비스로 분리한다.

**Tech Stack:** Next.js App Router, TypeScript, CSS, Zod, Dexie/IndexedDB, Vitest, Playwright, Leaflet. 공동 조사 단계는 PostgreSQL·Prisma·S3 호환 비공개 저장소, 공개 모델 서비스는 FastAPI. 의존성 버전은 실행 시 공식 지원 범위를 확인하고 lockfile로 고정한다.

**Spec:** ../specs/2026-10-01-mobility-research-design.md

## Global Constraints

- 한국어 반응형 화면: 연구 개요, 조사 기록, 사진 판정, 검수, 비교 분석, 지도, 면접 시연 안내.
- 정상 ○, 통행 방해 △, 위험 ×, 판정 불가를 지원한다.
- AI와 검수자 A/B의 원래 판정을 보존한다.
- 각 검수자는 상대와 AI 판정을 보기 전에 독립 판정을 입력하며, 이후 불일치를 조정한 확정 판정을 별도로 저장한다.
- 사진만으로 보도 폭을 미터 단위로 추정하거나 현지 법 위반을 단정하지 않는다.
- 기기가 없으면 밀도는 0, 비율 분모가 0이면 ‘산출 불가’로 표시한다.
- 도시 간 비교는 기술 통계로 제시한다. 정책 효과나 인과관계, 도시 순위를 주장하지 않는다.
- 실제 사진 검증 없이 정확도 수치를 제시하지 않는다.
- 공개 화면은 가림 처리 및 사람 확인이 끝난 사진만 사용한다.

## Review Focus

1. 새로고침·저장 공간 부족: 성공 표시 전에 저장 완료를 확인하고 기록이 손실되지 않아야 한다 (Task 2).
2. 빈 파일·잘못된 좌표·손상된 가져오기: 기존 자료를 변경하지 않고 오류를 표시해야 한다 (Tasks 2, 6).
3. 같은 기기의 반복 사진·미확정 공유 여부: 중복 계수와 잘못된 분모를 만들지 않아야 한다 (Tasks 1, 3).
4. 추론 서버 장애·잘못된 모델 JSON: 실제 AI 결과를 조작하거나 샘플 결과로 대체하지 않아야 한다 (Task 5).
5. 직접 API 접근·검수자 역할 전환: 비공개 사진과 타인의 미제출 판정이 노출되지 않아야 한다 (Task 4).

## 실행 환경 확인 및 배포 경로

현재 Node 24.15.0, npm 11.12.1, Python 3.12.10. Python 환경에 torch/transformers가 없다. GitHub CLI는 미로그인 상태다.

먼저 유료 자원 없이 로컬 시연을 완성한다. 첫 배포는 Next.js 호스팅 계정에 공개 시연 모드를 배포하며 업로드 사진은 각 사용자 브라우저에만 보관한다. 실제 팀 공동 조사에는 서버 저장소와 로그인 계정을 연결한 후 배포한다. 비용이 발생하는 GPU 서비스는 사용자가 비용 조건을 선택한 뒤 연결한다. 계정 미연결을 배포 성공으로 보고하지 않는다.

AI 후보는 Qwen 공개 비전 모델이며 구체적 모델은 GPU 메모리와 라이선스를 확인해 고정한다. 예를 들어 Qwen2.5-VL-3B는 연구 라이선스 조건이 있으므로 단순히 Apache 라이선스로 간주하지 않는다. 환경이 준비되기 전에는 ‘AI 미연결’과 수동 판정을 제공한다. 실제 추론 성공·실패와 모델 버전은 기록한다.

## 파일 구조

- `src/domain/{schema,metrics,agreement}.ts`: 입력 계약, 계산, 일치율.
- `src/storage/{repository,indexeddb,server}.ts`: 저장소 인터페이스와 구현.
- `src/features/{sessions,observations,review,analysis,map}/`: 각 화면과 해당 기능.
- `src/app/`: 페이지, 인증 및 분석 API 라우트.
- `src/ai/{schema,provider,prompt}.ts`: 공개 모델 요청·응답 계약.
- `src/data/demo.ts`: 명시적 합성 시연 데이터.
- `services/vision/`: FastAPI 추론 서비스와 모델 실행 설명.
- `prisma/schema.prisma`: 공동 조사 데이터 구조.
- `tests/{domain,storage,review,ai,import}/`: 동작 검증.
- `e2e/`: 사용자 흐름 검증.

### Task 1: 조사 데이터 계약과 정확한 계산

**Files:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/domain/schema.ts`, `src/domain/metrics.ts`, `src/domain/agreement.ts`, `tests/domain/metrics.test.ts`, `tests/domain/agreement.test.ts`.

**Interfaces:** `DeviceKind = 'shared-scooter' | 'shared-ebike' | 'private' | 'unknown'`; `Status = 'normal' | 'obstruction' | 'danger' | 'unassessable'`. `Observation`은 id, segmentId, canonicalDeviceId, deviceKind, ai/A/B/final 판정, 위험 유형, fallen을 가진다. `Segment`는 id, sessionId, lengthM, relation, latitude/longitude를 가진다. `computeMetrics(segments: Segment[], observations: Observation[]): Metrics`; `computeAgreement(pairs: JudgmentPair[]): {matched:number,total:number,rate:number|null}`.

- [ ] `density_normalizes_400m` 테스트: 확정 공유 기기 8대/400m → 2대/100m. △·× 3대/판정 완료 6대 → 0.5; 미검수와 판정 불가 각각 표시.
- [ ] `empty_denominator`, `private_unknown_excluded`, `duplicate_device`, `invalid_length`, `multiple_risks`, `agreement_only_paired` 테스트 작성. 중복은 같은 세션 안 canonicalDeviceId당 한 번, 거리 0은 입력 오류, 서로 다른 세션의 기기는 별도 표본.
- [ ] `npm.cmd run test -- tests/domain` 실행해 구현 부재로 실패 확인.
- [ ] Zod 스키마 및 순수 계산 구현. 판정 불가 쌍은 일치율에서 제외하고 제외 수를 반환하도록 계약 확장.
- [ ] 같은 명령으로 통과 확인 후 `feat: add research domain and metrics` 커밋.

### Task 2: 기록이 보존되는 조사 등록 흐름

**Files:** `src/app/{layout,page}.tsx`, `src/app/globals.css`, `src/storage/{repository,indexeddb}.ts`, `src/features/sessions/SessionForm.tsx`, `src/features/observations/PhotoUpload.tsx`, `src/data/demo.ts`, `tests/storage/repository.test.ts`, `e2e/session.spec.ts`.

**Interfaces:** `ResearchRepository.createSession(input): Promise<Session>`; `savePhoto(input: PhotoInput): Promise<Photo>`; `listSessions(): Promise<Session[]>`; `exportProject(): Promise<ProjectExport>`. 사진은 Blob으로 저장하며 JPEG/PNG/WebP, 최대 10MB, 디코딩 성공을 검증한다. 날짜는 현지 기록 문자열과 IANA 시간대를 별도로 보존한다.

- [ ] `persists_after_reload`, `quota_failure_no_success`, `rejects_invalid_photo`, `demo_never_merges_into_real` 테스트 작성. 합성 예시는 `source:'demo'`, 실제 등록은 `source:'field'`이며 집계 전환에 따라 분리한다.
- [ ] 저장소 테스트 실패 확인 후 IndexedDB 저장소와 원자적 등록 구현.
- [ ] 한국어 레이아웃·등록 폼·업로드·모바일 탐색 구현. 빈 데이터 상태는 미수집으로 표시하고 합성 예시 불러오기는 명시적 버튼으로 제공.
- [ ] 저장소 테스트와 `npm.cmd run test:e2e -- e2e/session.spec.ts` 통과. 등록 후 새로고침으로 날짜·거리·사진 유지 확인.
- [ ] `feat: add persistent field registration` 커밋.

### Task 3: 수동 판정·중복 연결·내보내기

**Files:** `src/features/observations/{ObservationEditor,DeduplicationPanel}.tsx`, `src/features/review/ReviewPanel.tsx`, `src/storage/repository.ts`, `tests/review/workflow.test.ts`, `e2e/review.spec.ts`.

**Interfaces:** `submitJudgment(observationId, reviewer:'A'|'B', judgment): Promise<void>`; `resolveJudgment(observationId, judgment, reason): Promise<void>`; `linkDuplicate(observationId, canonicalDeviceId): Promise<void>`; `toCsv(project:ProjectExport): string`.

- [ ] `blind_before_submission`, `original_judgments_preserved`, `resolution_requires_both`, `duplicate_cycle_rejected`, `csv_formula_escaped` 테스트 작성. 제출 후 원판정은 불변이며 변경은 새 이력으로 남긴다.
- [ ] 테스트 실패 확인 후 공유 여부·상태·위험 유형·쓰러짐·판정 사유 입력 구현.
- [ ] 같은 브라우저의 A/B 전환은 ‘역할 시연’이라고 표시. 화면에서 상대 판정 숨김은 보안 보장이 아니며 실제 독립 검수는 Task 4에서 계정으로 강제한다.
- [ ] 조정 화면과 JSON 백업·CSV 내보내기 구현. source, 모델 연결 상태, 측정 거리, 제외 이유를 함께 내보낸다.
- [ ] 테스트 및 E2E 통과 후 `feat: add auditable review workflow` 커밋.

### Task 4: 실제 팀 공동 조사와 비공개 저장

**Files:** `prisma/schema.prisma`, `src/storage/server.ts`, `src/app/api/research/route.ts`, `src/app/api/photos/route.ts`, `src/auth/authorization.ts`, `tests/review/authorization.test.ts`, `.env.example`.

**Interfaces:** 서버는 프로젝트별 membership과 reviewer role을 인증 세션에서 결정한다. `authorize(projectId, userId, action): Promise<Permission>`; `getReviewView(observationId,userId): Promise<ReviewView>`; `publishPhoto(photoId,userId): Promise<void>`.

- [ ] `cannot_read_other_project`, `reviewer_cannot_impersonate`, `unsubmitted_peer_hidden_in_api`, `original_photo_not_public`, `unreviewed_redaction_not_publishable` 테스트 작성.
- [ ] 실패 확인 후 PostgreSQL 저장소, 별개 계정 A/B, 권한 검사 구현. 클라이언트가 넘긴 역할을 신뢰하지 않는다.
- [ ] 비공개 이미지 업로드와 서명 URL, 수동 가림 편집을 구현. 자동 가림 결과가 있다면 별도 저장하고 사람 확인 전에는 공개 금지.
- [ ] 팀 계정과 DB/저장소 미연결 시 비활성 상태와 로컬 시연을 명확히 표시.
- [ ] 권한 테스트 통과 후 `feat: add private collaborative research storage` 커밋.

### Task 5: 실제 공개 모델 추론 연결

**Files:** `src/ai/{schema,provider,prompt}.ts`, `src/app/api/analyze/route.ts`, `services/vision/{app.py,requirements.txt,README.md}`, `tests/ai/provider.test.ts`.

**Interfaces:** `analyzePhoto(photoId:string): Promise<AnalysisResult>`; 결과는 modelId, modelVersion, timestamp, observations, warnings. 각 관찰은 공유 여부·상태·근거·상대 좌표 bbox를 반환하고 스키마를 검증한다. 정상 HTTP 응답이라도 검증 실패면 판정 저장 금지.

- [ ] `timeout_keeps_manual_path`, `malformed_output_rejected`, `demo_not_used_on_failure`, `unknown_device_not_forced_shared`, `invalid_bbox_rejected` 테스트 작성.
- [ ] 실패 확인 후 서버 전용 추론 클라이언트 구현. 60초 제한, 입력 사진 크기 제한, 호출 권한 확인, 중복 요청 방지, 비밀값 비노출.
- [ ] 실제 환경의 GPU·메모리·모델 라이선스를 확인하고 지원 모델을 고정해 FastAPI 서비스 구현. 준비되지 않았으면 실제 추론은 ‘미연결’ 상태로 유지한다.
- [ ] 실제 사진은 제공된 사용 가능한 이미지로만 검증한다. 최소 20장의 독립 라벨 자료가 준비되면 유형별 표본 수·일치율·실패 예시를 `docs/validation/vision-baseline.md`에 기록한다. 20장은 초기 시험이며 일반화된 정확도로 표현하지 않는다.
- [ ] provider 테스트와 실제 서비스 요청을 확인한 뒤 `feat: connect open vision inference` 커밋. 실제 추론 미검증이면 이 작업 완료 처리 금지.

### Task 6: 비교 분석·지도·견인 원자료

**Files:** `src/features/analysis/{MetricsDashboard,ComparisonPanel}.tsx`, `src/features/map/ResearchMap.tsx`, `src/features/map/towing-import.ts`, `tests/import/towing.test.ts`, `e2e/analysis.spec.ts`.

**Interfaces:** `parseTowingCsv(text:string,mapping:ColumnMapping): ImportResult`; 위치·일자 없는 행은 지도 표본에서 제외하고 이유를 보고한다. `buildCandidateEvidence(towing:TowingRecord[], observations:Observation[]): CandidateEvidence[]`는 근거 행과 관찰을 연결하며 설치 타당성 점수를 만들지 않는다.

- [ ] `bad_coordinates_no_mutation`, `missing_columns_reported`, `duplicate_towing_rows`, `demo_filter_applies_to_map_and_metrics`, `unknown_policy_visible` 테스트 작성.
- [ ] 실패 확인 후 견인 CSV 열 매핑·미리보기·원자적 가져오기 구현. 주소만 있는 데이터는 자동으로 임의 좌표를 만들지 않는다.
- [ ] Task 1 지표와 표본 수·분모를 연결해 도시 안 비교와 도시 간 참고 비교 구현. 지도는 조사 위치·측정 구간·근거 있는 후보지만 표시한다.
- [ ] 정책 메타데이터에는 출처·확인일·확인 상태를 표시한다. 실제 규제 수치는 공식 원문 확인 전 ‘제출자료 기준·재확인 필요’로 둔다.
- [ ] 테스트 및 E2E 통과 후 `feat: add evidence-based analysis and maps` 커밋.

### Task 7: 면접 시연·검증·GitHub·배포

**Files:** `src/features/interview/DemoGuide.tsx`, `e2e/interview.spec.ts`, `docs/deployment.md`, `docs/interview-demo.md`, `README.md`, CI 설정.

- [ ] E2E `demo_full_flow` 작성: 예시 선택 → 조사 등록 → 기기 판정 → A/B 검수 → 확정 → 지표·지도 → CSV. 실제/예시를 혼합하지 않는지 확인.
- [ ] 3분 시연 안내에 연구 질문, 방법, 검증, 결과 활용, 아직 미완료인 연결을 포함. 실제 성능과 정책 효과를 과장하지 않는다.
- [ ] `npm.cmd run test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:e2e` 실행. 390px와 1440px 화면 및 키보드 조작 확인.
- [ ] GitHub 로그인 후 비공개 `mobility-field-lab` 저장소 생성, origin 연결 및 push. 원문 PDF·research·환경 비밀값 제외 확인.
- [ ] 연결된 호스팅 계정으로 시연 배포, 서버 공동 조사 자원이 준비되면 해당 환경 배포. 사용자가 고르지 않은 유료 플랜은 구매하지 않는다.
- [ ] 배포 URL에서 새 브라우저 세션으로 시연과 저장을 재확인하고 실제 AI 연결 여부를 기록.
- [ ] `docs: document verified deployment and interview demo` 커밋. 결과를 URL, 검증 내용, 남은 실제 자료/AI 연결 조건과 함께 보고.

## 자체 검토 결과

설계의 화면·기록·판정·지표·지도·내보내기·공개 사진 기준을 Tasks 1~7에 연결했다. 미완료 실제 AI를 완료된 제품 기능으로 표시하지 않는다. 초기 공개 시연과 인증된 공동 조사의 저장·권한 차이를 명시했다. 입력 실패·중복·추론 오류·권한 노출 다섯 조건을 각 작업의 테스트에 연결했다. 완료 조건은 배포 후 검증까지이며, 계정이나 실사진이 필요한 작업은 준비 상태를 명확히 보고한다.

## 실행 방식 검토

권장: 이 채팅에서 직접 순차 구현. 작업 간 도메인·저장소·판정 계약을 계속 공유하므로 한 구현자가 작은 단위로 검증하는 방식이 적합하다. 다른 선택은 작업별 구현·검토 에이전트를 사용하는 방식이다. 사용자가 계획과 실행 방식을 확인한 뒤 구현을 시작한다.
