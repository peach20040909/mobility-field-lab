import io
from PIL import Image
from fastapi.testclient import TestClient
from contract import parse_result
from app import create_app

TOKEN = "test-token-" + "a"*32
class Engine:
    def analyze(self,image):
        return parse_result('{"observations":[]}'), '{"observations":[]}'

def photo():
    output = io.BytesIO()
    Image.new("RGB",(10,10)).save(output,format="PNG")
    return output.getvalue()

def client(engine=Engine()):
    return TestClient(create_app(engine=engine,token=TOKEN))

def test_requires_token():
    assert client().post("/analyze",files={"photo":("a.png",photo(),"image/png")}).status_code == 401

def test_connect_checks_token():
    assert client().get("/connect",headers={"Authorization":"Bearer wrong"}).status_code == 401
    assert client().get("/connect",headers={"Authorization":"Bearer "+TOKEN}).status_code == 200

def test_health_does_not_expose_token():
    c = client()
    assert TOKEN not in c.get("/health").text
    assert c.get("/health").json()["ready"]

def test_no_engine_is_unconnected():
    assert not client(None).get("/health").json()["ready"]
    assert client(None).post("/analyze",headers={"Authorization":"Bearer "+TOKEN},files={"photo":("a.png",photo(),"image/png")}).status_code == 503

def test_decode_failure_never_calls_engine():
    assert client().post("/analyze",headers={"Authorization":"Bearer "+TOKEN},files={"photo":("a.png",b"bad","image/png")}).status_code == 400

def test_actual_contract_metadata():
    res=client().post("/analyze",headers={"Authorization":"Bearer "+TOKEN},files={"photo":("a.png",photo(),"image/png")})
    assert res.status_code == 200
    assert res.json()["observations"] == []
    assert res.json()["modelVersion"]

def test_phone_mpo_jpeg_accepted():
    output=io.BytesIO()
    Image.new("RGB",(10,10)).save(output,format="MPO",save_all=True,append_images=[Image.new("RGB",(10,10))])
    assert Image.open(io.BytesIO(output.getvalue())).format == "MPO"
    res=client().post("/analyze",headers={"Authorization":"Bearer "+TOKEN},files={"photo":("phone.jpg",output.getvalue(),"image/jpeg")})
    assert res.status_code == 200

def test_failure_never_returns_demo():
    class Bad:
        def analyze(self,image): raise ValueError("sensitive raw")
    res=client(Bad()).post("/analyze",headers={"Authorization":"Bearer "+TOKEN},files={"photo":("a.png",photo(),"image/png")})
    assert res.status_code == 502
    assert "sensitive raw" not in res.text

def test_unapproved_origin_blocked():
    res=client().post("/analyze",headers={"Authorization":"Bearer "+TOKEN,"Origin":"https://evil.example"},files={"photo":("a.png",photo(),"image/png")})
    assert res.status_code == 403
