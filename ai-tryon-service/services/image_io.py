import io
import ipaddress
import socket
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
import numpy as np
import requests
from PIL import Image

from config import (
    AI_ALLOWED_IMAGE_HOSTS,
    AI_MAX_IMAGE_BYTES,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
)

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)


def _download(url: str) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("Image URL must use HTTPS")

    hostname = parsed.hostname.lower()
    if hostname not in AI_ALLOWED_IMAGE_HOSTS:
        raise ValueError("Image host is not allowlisted")

    for address in socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM):
        ip = ipaddress.ip_address(address[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("Image host resolves to a private or reserved address")

    response = requests.get(url, timeout=15, stream=True)
    response.raise_for_status()
    content_length = response.headers.get("content-length")
    if content_length and int(content_length) > AI_MAX_IMAGE_BYTES:
        raise ValueError("Image is too large")

    data = bytearray()
    for chunk in response.iter_content(chunk_size=64 * 1024):
        data.extend(chunk)
        if len(data) > AI_MAX_IMAGE_BYTES:
            raise ValueError("Image is too large")
    return bytes(data)


def download_image(url: str) -> np.ndarray:
    """Tải ảnh khách hàng — luôn convert về RGB (không cần alpha)."""
    image = Image.open(io.BytesIO(_download(url))).convert("RGB")
    return np.array(image)


def download_image_rgba(url: str) -> Image.Image:
    """Tải ảnh mẫu tóc PNG — giữ nguyên alpha channel để overlay trong suốt đúng."""
    return Image.open(io.BytesIO(_download(url))).convert("RGBA")


def upload_result_image(image: np.ndarray, folder: str = "tryon/results") -> str:
    pil_image = Image.fromarray(image)
    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)

    result = cloudinary.uploader.upload(buffer, folder=folder, resource_type="image")
    return result["secure_url"]
