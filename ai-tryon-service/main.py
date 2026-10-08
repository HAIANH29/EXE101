from fastapi import FastAPI, HTTPException

from schemas import TryOnRequest, TryOnResponse
from services.tryon_service import process_tryon

app = FastAPI(title="AI TryOn Service")


@app.post("/tryon", response_model=TryOnResponse)
def tryon(request: TryOnRequest):
    try:
        result_url = process_tryon(
            request.imageUrl,
            request.hairstyleId,
            request.colorImageUrl
        )
        return TryOnResponse(resultImageUrl=result_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/health")
def health():
    return {"status": "ok"}
