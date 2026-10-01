import io, secrets, threading, time
from datetime import datetime, timezone
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from contract import MODEL_ID, MODEL_REVISION

ALLOWED = ["http://127.0.0.1:3000","http://localhost:3000","https://peach20040909.github.io"]
MAX_BYTES = 10*1024*1024
Image.MAX_IMAGE_PIXELS = 25_000_000

def create_app(engine=None, token=None):
    if not token or len(token) < 32:
        raise ValueError("A random local token of at least 32 characters is required")
    app = FastAPI()
    app.state.engine = engine
    gate = threading.Lock()
    app.add_middleware(CORSMiddleware, allow_origins=ALLOWED, allow_methods=["GET","POST"], allow_headers=["Authorization","Content-Type"])

    @app.middleware("http")
    async def approved_origin(request: Request, call_next):
        origin = request.headers.get("origin")
        if origin and origin not in ALLOWED:
            from starlette.responses import JSONResponse
            return JSONResponse({"detail":"Origin not allowed"},status_code=403)
        return await call_next(request)

    @app.get("/health")
    def health():
        return {"ready":app.state.engine is not None,"modelId":MODEL_ID,"modelVersion":MODEL_REVISION,"localOnly":True}

    @app.get("/connect")
    def connect(authorization: str | None = Header(default=None)):
        if not secrets.compare_digest(authorization or "", "Bearer "+token):
            raise HTTPException(401,"Local authorization required")
        if app.state.engine is None:
            raise HTTPException(503,"Model is not ready")
        return health()

    @app.post("/analyze")
    def analyze(photo: UploadFile = File(), authorization: str | None = Header(default=None)):
        if not secrets.compare_digest(authorization or "", "Bearer "+token):
            raise HTTPException(401,"Local authorization required")
        if app.state.engine is None:
            raise HTTPException(503,"Model is not ready")
        if photo.content_type not in ["image/jpeg","image/png","image/webp"]:
            raise HTTPException(400,"Unsupported photo format")
        data = photo.file.read(MAX_BYTES+1)
        if len(data) > MAX_BYTES:
            raise HTTPException(413,"Photo exceeds 10MB")
        try:
            image = Image.open(io.BytesIO(data))
            if image.format not in ["JPEG","MPO","PNG","WEBP"]:
                raise ValueError("format")
            image.load()
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
            raise HTTPException(400,"Photo cannot be decoded")
        if not gate.acquire(blocking=False):
            raise HTTPException(429,"Another analysis is running")
        started = time.monotonic()
        try:
            try:
                result, _ = app.state.engine.analyze(image)
            except Exception:
                raise HTTPException(502,"Model output could not be validated; manual review remains available")
            elapsed = time.monotonic()-started
            if elapsed > 60:
                raise HTTPException(504,"Analysis exceeded 60 seconds")
            return {"modelId":MODEL_ID,"modelVersion":MODEL_REVISION,"timestamp":datetime.now(timezone.utc).isoformat(),"seconds":round(elapsed,2),"observations":[o.model_dump() for o in result.observations],"warnings":["Experimental model output; independent human review required"]}
        finally:
            image.close()
            gate.release()
    return app
