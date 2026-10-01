import argparse, json, mimetypes
from pathlib import Path
import httpx

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("photo",type=Path)
    args=parser.parse_args()
    token=Path(__file__).with_name(".env").read_text(encoding="utf-8").strip()
    with args.photo.open("rb") as photo:
        response=httpx.post("http://127.0.0.1:8765/analyze",headers={"Authorization":"Bearer "+token},files={"photo":(args.photo.name,photo,mimetypes.guess_type(args.photo.name)[0])},timeout=65)
    if response.is_error:
        print(response.text)
    response.raise_for_status()
    data=response.json()
    Path(__file__).with_name("results").mkdir(exist_ok=True)
    Path(__file__).with_name("results").joinpath("http.json").write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"seconds":data["seconds"],"observations":len(data["observations"]),"modelId":data["modelId"]}))
