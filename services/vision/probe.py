"""Run real local inference; keep all results out of version control."""
import argparse, json, time, hashlib
from pathlib import Path
from PIL import Image
from engine import VisionEngine
from contract import MODEL_ID, MODEL_REVISION

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("photo",type=Path)
    args = parser.parse_args()
    engine = VisionEngine()
    started = time.monotonic()
    try:
        result, raw = engine.analyze(Image.open(args.photo))
        parsed, count = result.model_dump(), len(result.observations)
    except Exception as error:
        raw, parsed, count = getattr(engine,"last_raw",""), {"error":str(error)}, None
    payload = {"modelId":MODEL_ID,"modelVersion":MODEL_REVISION,"seconds":round(time.monotonic()-started,2),"inputHash":hashlib.sha256(args.photo.read_bytes()).hexdigest(),"result":parsed,"raw":raw}
    dest = Path(__file__).with_name("results")
    dest.mkdir(exist_ok=True)
    (dest/"probe.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"seconds":payload["seconds"],"observations":count}))
