import json
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

MODEL_ID = "Qwen/Qwen3-VL-2B-Instruct"
MODEL_REVISION = "89644892e4d85e24eaac8bacfd4f463576704203"

class Observation(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    kind: Literal["shared-scooter", "shared-ebike", "private", "unknown"]
    status: Literal["normal", "obstruction", "danger", "unassessable"]
    risks: list[Literal["tactile", "crosswalk", "exit", "bus", "road"]]
    fallen: bool
    reason: str = Field(min_length=1, max_length=2000)
    bbox: list[float] = Field(min_length=4, max_length=4)

    @model_validator(mode="after")
    def valid_box(self):
        x1,y1,x2,y2 = self.bbox
        if not (0 <= x1 < x2 <= 1 and 0 <= y1 < y2 <= 1):
            raise ValueError("bbox must have positive area and normalized coordinates")
        if len(self.risks) != len(set(self.risks)):
            raise ValueError("duplicate risks")
        return self

class ModelResult(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    observations: list[Observation] = Field(max_length=100)

def parse_result(text: str) -> ModelResult:
    text = text.strip()
    if text.startswith("```json\n") and text.endswith("\n```"):
        text = text[8:-4]
    return ModelResult.model_validate(json.loads(text))

def parse_model_result(text: str) -> ModelResult:
    text = text.strip()
    if text.startswith("```json\n") and text.endswith("\n```"):
        text=text[8:-4]
    items=json.loads(text)
    if not isinstance(items,list):
        raise ValueError("Model contract requires an array")
    for item in items:
        bbox=item.get("bbox")
        if not isinstance(bbox,list) or len(bbox)!=4 or any(isinstance(v,bool) or not isinstance(v,(int,float)) or not 0<=v<=1000 for v in bbox):
            raise ValueError("Model coordinates must be between 0 and 1000")
        item["bbox"]=[v/1000 for v in bbox]
    return ModelResult.model_validate({"observations":items})

def completed_result(raw: str, final_token: int, eos: int | list[int]) -> ModelResult:
    if final_token not in (eos if isinstance(eos,list) else [eos]):
        raise ValueError("Generation interrupted before EOS")
    return parse_model_result(raw)
