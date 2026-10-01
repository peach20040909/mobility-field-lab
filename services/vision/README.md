# 로컬 공개 모델 AI 서버

Qwen/Qwen3-VL-2B-Instruct를 NF4 4bit로 실행한다. 모델 revision은 89644892e4d85e24eaac8bacfd4f463576704203으로 고정했다. 모델 라이선스는 Apache 2.0이다.

공식 자료: [모델 카드](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct), [Windows bitsandbytes 지원](https://huggingface.co/docs/bitsandbytes/main/en/installation).

현재 시험 환경은 Windows, RTX 3050 Laptop 4GB, NVIDIA driver 545.92, PyTorch 2.5.1 CUDA 12.1이다. 최초 실행 시 모델 약 4.3GB를 내려받는다. 사진은 외부 추론 서비스로 전송하지 않는다.

## 실행

저장소 루트에서:

```powershell
uv venv services/vision/.venv --python 3.12
uv pip install --python services/vision/.venv/Scripts/python.exe torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu121
uv pip install --python services/vision/.venv/Scripts/python.exe -r services/vision/requirements.txt
services/vision/.venv/Scripts/python.exe services/vision/serve.py
```

서버는 127.0.0.1:8765에서만 수신한다. 자동 생성된 services/vision/.env 파일의 토큰을 사진 검수 화면에 입력한다. 토큰 파일과 모델 시험 결과는 Git에서 제외된다. 현재 화면의 토큰은 영구 브라우저 저장소에 저장하지 않는다.

GitHub Pages에서 로컬 주소 접근을 브라우저가 허용하지 않으면 로컬 웹앱에서 시험한다. 공유 서버나 팀 인증의 대체 기능은 아니다.

## 검증

```powershell
services/vision/.venv/Scripts/python.exe -m pytest services/vision/test_contract.py services/vision/test_api.py -q
services/vision/.venv/Scripts/python.exe services/vision/probe.py "실제 사진 경로"
```

정상 JSON·좌표만 저장하며 빈 장면은 기기 0대다. 모델 오류·시간 초과 시 자동 판정이나 예시로 대체하지 않는다. 기존 수동 또는 AI 기기 기록이 있는 사진은 중복 분석을 거부한다. 독립 A/B 검수 전 모델의 공유 여부는 기본 입력에 반영하지 않는다.

전체 사진의 독립 정답 라벨이 아직 없으므로 정확도는 보고하지 않는다.
