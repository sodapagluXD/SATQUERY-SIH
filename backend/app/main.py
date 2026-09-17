import os
from typing import Optional

import nest_asyncio
import uvicorn
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok

from app.bhoonidhi import fetch_satellite_data
from app.local_vlm import ask_satellite_image

app = FastAPI(title="SatQuery AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/v1/query")
async def process_query(
    bbox: str = Form(...),
    date_range: str = Form(...),
    query: str = Form(...),
):
    if not bbox or not query:
        raise HTTPException(status_code=400, detail="bbox and query are required")

    img_path = fetch_satellite_data(bbox, date_range)
    answer = ask_satellite_image(img_path, query)

    return {
        "status": "success",
        "evidence_grounded_answer": answer,
        "model_used": "Qwen2.5-VL-7B-Instruct (4-bit Quantized)"
    }


def start_server(ngrok_token: Optional[str] = None, host: str = "0.0.0.0", port: int = 8000):
    token = ngrok_token or os.getenv("NGROK_AUTH_TOKEN")

    if token:
        ngrok.set_auth_token(token)
        tunnel = ngrok.connect(port)
        print("🚀 Ngrok URL:", tunnel.public_url)
    else:
        print(f"🚀 Starting local backend on http://{host}:{port}")

    nest_asyncio.apply()
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    start_server(os.getenv("NGROK_AUTH_TOKEN"))