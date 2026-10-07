import os
from dotenv import load_dotenv

load_dotenv()

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
