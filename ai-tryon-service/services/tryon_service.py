import numpy as np
from PIL import Image

from services.face_landmark import FaceLandmarkDetector
from services.image_io import download_image, download_image_rgba, upload_result_image

detector = FaceLandmarkDetector()

# Map hairstyleId -> ảnh mẫu tóc PNG (đã tách nền, có alpha channel).
# Đây là dữ liệu tạm để chạy demo. Trong thực tế nên để Spring Boot truyền kèm
# hairstyleImageUrl luôn trong request (thêm field vào TryOnRequest), tránh
# phải đồng bộ danh sách 20 mẫu này ở 2 nơi (DB bên Spring Boot và hardcode ở đây).
HAIRSTYLE_TEMPLATES = {
    1: "https://res.cloudinary.com/demo/image/upload/hairstyle_1.png",
    2: "https://res.cloudinary.com/demo/image/upload/hairstyle_2.png",
}

# Tỉ lệ chiều rộng ảnh tóc so với chiều rộng khuôn mặt — cần tinh chỉnh theo
# bộ 20 mẫu thực tế (mỗi mẫu có thể lệch tỉ lệ khác nhau tùy kiểu tóc).
HAIR_WIDTH_RATIO = 2.2
# Dịch ảnh tóc lên trên so với điểm đỉnh trán, tính theo % chiều cao ảnh tóc
# sau khi resize (âm = dịch lên trên, để tóc phủ đúng qua đỉnh đầu).
HAIR_Y_OFFSET_RATIO = -0.35


def process_tryon(image_url: str, hairstyle_id: int) -> str:
    original_rgb = download_image(image_url)
    anchor = detector.get_anchor(original_rgb)

    hairstyle_url = HAIRSTYLE_TEMPLATES.get(hairstyle_id)
    if hairstyle_url is None:
        raise ValueError(f"Không tìm thấy mẫu tóc id={hairstyle_id}")

    hairstyle_rgba = download_image_rgba(hairstyle_url)

    result = _overlay(original_rgb, hairstyle_rgba, anchor)
    return upload_result_image(result)


def _overlay(original_rgb: np.ndarray, hairstyle_rgba: Image.Image, anchor: dict) -> np.ndarray:
    base = Image.fromarray(original_rgb).convert("RGBA")

    target_width = max(1, int(anchor["face_width_px"] * HAIR_WIDTH_RATIO))
    scale = target_width / hairstyle_rgba.width
    target_height = max(1, int(hairstyle_rgba.height * scale))
    hairstyle_resized = hairstyle_rgba.resize((target_width, target_height), Image.LANCZOS)

    paste_x = anchor["forehead_x"] - target_width // 2
    paste_y = anchor["forehead_y"] + int(target_height * HAIR_Y_OFFSET_RATIO)

    # Dùng chính ảnh RGBA làm mask khi paste, để giữ đúng vùng trong suốt
    base.paste(hairstyle_resized, (paste_x, paste_y), hairstyle_resized)

    return np.array(base.convert("RGB"))
