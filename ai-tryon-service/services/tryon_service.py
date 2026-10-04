from services.face_landmark import FaceLandmarkDetector
from services.image_io import download_image, download_image_rgba

detector = FaceLandmarkDetector()

# Tỉ lệ chiều rộng ảnh tóc so với chiều rộng khuôn mặt — cần tinh chỉnh theo
# bộ 20 mẫu thực tế (mỗi mẫu có thể lệch tỉ lệ khác nhau tùy kiểu tóc).
HAIR_WIDTH_RATIO = 2.2
# Dịch ảnh tóc lên trên so với điểm đỉnh trán, tính theo % chiều cao ảnh tóc
# sau khi resize (âm = dịch lên trên, để tóc phủ đúng qua đỉnh đầu).
HAIR_Y_OFFSET_RATIO = -0.35


def compute_overlay(image_url: str, hairstyle_id: int, hairstyle_image_url: str) -> dict:
    """
    Chỉ TÍNH TOÁN vị trí/kích thước đặt tóc dựa trên landmark khuôn mặt,
    KHÔNG ghép ảnh, KHÔNG upload kết quả lên Cloudinary. FE nhận tọa độ này
    để tự vẽ layer tóc đè lên ảnh gốc và cho khách chỉnh lại nếu cần.
    """
    original_rgb = download_image(image_url)
    anchor = detector.get_anchor(original_rgb)

    if not hairstyle_image_url:
        raise ValueError(f"Không có ảnh mẫu tóc cho id={hairstyle_id}")

    # Vẫn cần tải ảnh tóc về để biết tỉ lệ khung hình gốc (width/height) của
    # PNG, dùng tính target_height tương ứng khi scale theo khuôn mặt.
    hairstyle_rgba = download_image_rgba(hairstyle_image_url)

    target_width = max(1, int(anchor["face_width_px"] * HAIR_WIDTH_RATIO))
    scale = target_width / hairstyle_rgba.width
    target_height = max(1, int(hairstyle_rgba.height * scale))

    paste_x = anchor["forehead_x"] - target_width // 2
    paste_y = anchor["forehead_y"] + int(target_height * HAIR_Y_OFFSET_RATIO)

    return {
        "hairstyleImageUrl": hairstyle_image_url,
        "x": paste_x,
        "y": paste_y,
        "width": target_width,
        "height": target_height,
    }
