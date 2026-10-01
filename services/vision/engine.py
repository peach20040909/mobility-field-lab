from pathlib import Path
from PIL import Image, ImageOps
import torch
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration, BitsAndBytesConfig
from contract import MODEL_ID, MODEL_REVISION, completed_result

class VisionEngine:
    def __init__(self):
        if not torch.cuda.is_available():
            raise RuntimeError("Verified configuration requires a CUDA GPU")
        self.processor = AutoProcessor.from_pretrained(MODEL_ID, revision=MODEL_REVISION, min_pixels=128*32*32, max_pixels=384*32*32)
        self.model = Qwen3VLForConditionalGeneration.from_pretrained(
            MODEL_ID, revision=MODEL_REVISION,
            quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16, bnb_4bit_use_double_quant=True),
            device_map={"":0}, dtype=torch.float16, attn_implementation="sdpa",
        ).eval()
        self.prompt = Path(__file__).with_name("prompt.txt").read_text(encoding="utf-8")

    def analyze(self, image: Image.Image):
        image = ImageOps.exif_transpose(image).convert("RGB")
        messages = [{"role":"user","content":[{"type":"image","image":image},{"type":"text","text":self.prompt}]}]
        inputs = self.processor.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_dict=True, return_tensors="pt").to(self.model.device)
        with torch.inference_mode():
            output = self.model.generate(**inputs, max_new_tokens=1200, max_time=55, do_sample=False)
        raw = self.processor.batch_decode(output[:, inputs.input_ids.shape[-1]:], skip_special_tokens=True)[0]
        self.last_raw = raw
        result = completed_result(raw, output[0,-1].item(), self.model.generation_config.eos_token_id)
        return result, raw
