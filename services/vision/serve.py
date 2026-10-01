"""Bind only to loopback; token stays in an ignored local file."""
import secrets
from pathlib import Path
import uvicorn
from app import create_app
from engine import VisionEngine

if __name__ == "__main__":
    token_file = Path(__file__).with_name(".env")
    if token_file.exists():
        token = token_file.read_text(encoding="utf-8").strip()
    else:
        token = secrets.token_urlsafe(32)
        token_file.write_text(token,encoding="utf-8")
    engine = VisionEngine()
    app = create_app(engine,token)
    uvicorn.run(app,host="127.0.0.1",port=8765,access_log=False)
