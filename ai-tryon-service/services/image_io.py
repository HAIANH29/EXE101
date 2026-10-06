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
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    return np.array(image)


def upload_result_image(image: np.ndarray, folder: str = "tryon/results") -> str:
    """
    Replicate chỉ host ảnh output tạm thời (URL có thể hết hạn), nên cần tải
    về rồi upload lại Cloudinary để lưu vĩnh viễn.
    """
    pil_image = Image.fromarray(image)
    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=92)
    buffer.seek(0)

    result = cloudinary.uploader.upload(buffer, folder=folder, resource_type="image")
    return result["secure_url"]
