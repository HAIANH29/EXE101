import secrets
import threading

from fastapi import FastAPI, HTTPException
from fastapi import Header
from pydantic import BaseModel, Field

from config import AI_TRYON_INTERNAL_TOKEN, AI_MAX_CONCURRENT_REQUESTS
from services.tryon_service import compute_overlay, merge_images


app = FastAPI(title="AI Try-On Service", version="1.0.0")
processing_slots = threading.BoundedSemaphore(AI_MAX_CONCURRENT_REQUESTS)


class TryOnRequest(BaseModel):
    imageUrl: str = Field(min_length=1)
    hairstyleId: int
    hairstyleImageUrl: str = Field(min_length=1)


class TryOnResponse(BaseModel):
    hairstyleImageUrl: str
    x: int
    y: int
    width: int
    height: int

class MergeRequest(BaseModel):
    imageUrl: str = Field(min_length=1)
    hairstyleImageUrl: str = Field(min_length=1)
    x: int
    y: int
    width: int
    height: int

class MergeResponse(BaseModel):
    base64Image: str


@app.get("/health")
def health() -> dict[str, str]:
    if not AI_TRYON_INTERNAL_TOKEN:
        return {"status": "DEGRADED", "reason": "internal authentication is not configured"}
    return {"status": "UP"}


@app.post("/tryon", response_model=TryOnResponse)
def try_on(request: TryOnRequest, x_internal_token: str | None = Header(default=None)) -> TryOnResponse:
    if AI_TRYON_INTERNAL_TOKEN and not x_internal_token:
        raise HTTPException(status_code=401, detail="Missing internal token")
    if AI_TRYON_INTERNAL_TOKEN and not secrets.compare_digest(
        x_internal_token, AI_TRYON_INTERNAL_TOKEN
    ):
        raise HTTPException(status_code=401, detail="Invalid internal token")
    if not processing_slots.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="AI service is busy")

    try:
        result = compute_overlay(
            request.imageUrl,
            request.hairstyleId,
            request.hairstyleImageUrl,
        )
        return TryOnResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI image processing failed") from exc
    finally:
        processing_slots.release()

@app.post("/merge", response_model=MergeResponse)
def merge(request: MergeRequest, x_internal_token: str | None = Header(default=None)) -> MergeResponse:
    if AI_TRYON_INTERNAL_TOKEN and not x_internal_token:
        raise HTTPException(status_code=401, detail="Missing internal token")
    if AI_TRYON_INTERNAL_TOKEN and not secrets.compare_digest(
        x_internal_token, AI_TRYON_INTERNAL_TOKEN
    ):
        raise HTTPException(status_code=401, detail="Invalid internal token")
    if not processing_slots.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="AI service is busy")

    try:
        base64_image = merge_images(
            request.imageUrl,
            request.hairstyleImageUrl,
            request.x,
            request.y,
            request.width,
            request.height
        )
        return MergeResponse(base64Image=base64_image)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI image merging failed") from exc
    finally:
        processing_slots.release()
