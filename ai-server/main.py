
import os
import time
from io import BytesIO
from pathlib import Path
from threading import Lock

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from ultralytics import YOLO

app = FastAPI(title="DaNang Recycle AI - Fast Detection")
model = YOLO(str(Path(__file__).resolve().parent / "best.pt"))
model_lock = Lock()

# Tối ưu tốc độ AI
IMG_SIZE = int(os.getenv("AI_IMG_SIZE", "320"))
CONF = float(os.getenv("AI_CONF", "0.40"))
MAX_BYTES = 3 * 1024 * 1024

DEVICE = 0 if torch.cuda.is_available() else "cpu"

if DEVICE == "cpu":
    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))

# Warm-up model để giảm độ trễ lượt đầu tiên
try:
    import numpy as np

    with model_lock:
        model.predict(
            np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8),
            imgsz=IMG_SIZE,
            device=DEVICE,
            conf=CONF,
            verbose=False,
            max_det=10,
        )
except Exception as exc:
    print(f"Warmup skipped: {exc}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "imgsz": IMG_SIZE,
        "classes": model.names,
    }


@app.post("/detect")
def detect(file: UploadFile = File(...)):
    started = time.perf_counter()

    raw = file.file.read(MAX_BYTES + 1)

    if not raw or len(raw) > MAX_BYTES:
        raise HTTPException(413, "Image empty or too large")

    try:
        with Image.open(BytesIO(raw)) as original:
            if original.width * original.height > 16_000_000:
                raise HTTPException(
                    413, "Image dimensions too large"
                )

            img = ImageOps.exif_transpose(original).convert("RGB")

    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(400, f"Invalid image: {exc}")

    decoded = time.perf_counter()
    width, height = img.size

    with model_lock:
        result = model.predict(
            img,
            imgsz=IMG_SIZE,
            device=DEVICE,
            conf=CONF,
            iou=0.50,
            max_det=10,
            verbose=False,
        )[0]

    predicted = time.perf_counter()
    detections = []

    for box in result.boxes:
        x1, y1, x2, y2 = (
            float(v) for v in box.xyxy[0].tolist()
        )

        cls = int(box.cls[0].item())

        detections.append({
            "class_id": cls,
            "label": str(model.names[cls]),
            "confidence": round(
                float(box.conf[0].item()), 4
            ),
            "box": {
                "x1": max(0.0, min(1.0, x1 / width)),
                "y1": max(0.0, min(1.0, y1 / height)),
                "x2": max(0.0, min(1.0, x2 / width)),
                "y2": max(0.0, min(1.0, y2 / height)),
            },
        })

    return {
        "detections": detections,
        "count": len(detections),
        "image_width": width,
        "image_height": height,
        "decode_ms": round(
            (decoded - started) * 1000, 1
        ),
        "inference_ms": round(
            (predicted - decoded) * 1000, 1
        ),
        "server_ms": round(
            (time.perf_counter() - started) * 1000, 1
        ),
    }
