import io

import cloudinary
import cloudinary.uploader
import numpy as np
import requests
from PIL import Image

from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)


def download_image(url: str) -> np.ndarray:
    """Tải ảnh khách hàng — luôn convert về RGB (không cần alpha)."""
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    return np.array(image)


def download_image_rgba(url: str) -> Image.Image:
    """Tải ảnh mẫu tóc PNG — giữ nguyên alpha channel để overlay trong suốt đúng."""
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content)).convert("RGBA")


def upload_result_image(image: np.ndarray, folder: str = "tryon/results") -> str:
    pil_image = Image.fromarray(image)
    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)

    result = cloudinary.uploader.upload(buffer, folder=folder, resource_type="image")
    return result["secure_url"]
