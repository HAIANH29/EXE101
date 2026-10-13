import logging

from fastapi import FastAPI, HTTPException

from schemas import TryOnRequest, TryOnResponse
from services.tryon_service import process_tryon

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-tryon")

app = FastAPI(title="AI TryOn Service")


@app.post("/tryon", response_model=TryOnResponse)
def tryon(request: TryOnRequest):
    logger.info(
        "TryOn request: hairstyleId=%s face=%s hair=%s color=%s",
        request.hairstyleId, request.imageUrl, request.hairImageUrl, request.colorImageUrl,
    )
    try:
        result_url = process_tryon(
            request.imageUrl,
            request.hairstyleId,
            request.colorImageUrl,
            request.hairImageUrl,
        )
        logger.info("TryOn done: %s", result_url)
        return TryOnResponse(resultImageUrl=result_url)
    except ValueError as e:
        logger.warning("TryOn bad request: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("TryOn failed")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/health")
def health():
    return {"status": "ok"}
