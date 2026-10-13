import os
from pathlib import Path

from dotenv import load_dotenv

# Service không có .env riêng -> trước đây load_dotenv() không tìm thấy gì, nên
# REPLICATE_API_TOKEN / CLOUDINARY_* bị rỗng và mọi request /tryon đều lỗi 500.
# Thứ tự ưu tiên: biến môi trường hệ thống > ai-tryon-service/.env > exe/.env (backend).
_SERVICE_DIR = Path(__file__).resolve().parent
for _env_file in (_SERVICE_DIR / ".env", _SERVICE_DIR.parent / "exe" / ".env"):
    if _env_file.is_file():
        load_dotenv(_env_file, override=False)

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# Thư viện replicate tự đọc biến REPLICATE_API_TOKEN từ môi trường,
# không cần truyền tay — chỉ cần đảm bảo .env có khai báo và load_dotenv()
# đã chạy trước khi import replicate ở nơi khác.
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

# Model hair-transfer trên Replicate — để trong biến môi trường cho dễ đổi
# nếu model bị gỡ hoặc bạn muốn thử model khác.
REPLICATE_HAIR_MODEL = os.getenv(
    "REPLICATE_HAIR_MODEL",
    "subhash25rawat/custom-hair:d4e9506ab3dd3d2d47384d78118f708ff6a79fe19a5013b9614021f0355543b9",
)
