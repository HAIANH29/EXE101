from typing import Optional
from pydantic import BaseModel


class TryOnRequest(BaseModel):
    imageUrl: str
    hairstyleId: int
    colorImageUrl: Optional[str] = None


class TryOnResponse(BaseModel):
    resultImageUrl: str

