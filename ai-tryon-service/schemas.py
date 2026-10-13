from pydantic import BaseModel


class TryOnRequest(BaseModel):
    imageUrl: str
    hairstyleId: int


class TryOnResponse(BaseModel):
    resultImageUrl: str
