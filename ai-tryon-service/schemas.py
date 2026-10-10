from typing import Optional
from pydantic import BaseModel


class TryOnRequest(BaseModel):
    imageUrl: str
    hairstyleId: int
    # Ảnh mẫu tóc (shape). Nếu không gửi -> dùng template theo hairstyleId.
    hairImageUrl: Optional[str] = None
    # Ảnh mẫu màu tóc (color). Nếu không gửi -> lấy màu từ ảnh mẫu tóc.
    colorImageUrl: Optional[str] = None


class TryOnResponse(BaseModel):
    resultImageUrl: str

