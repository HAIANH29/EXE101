from services.image_io import download_image, upload_result_image
from services.replicate_client import generate_hairswap

# Map hairstyleId -> ảnh mẫu tóc. Dữ liệu tạm để demo — nên để Spring Boot
# truyền kèm hairstyleImageUrl luôn trong request (từ bảng `hairstyles`),
# tránh phải đồng bộ danh sách 20 mẫu này ở 2 nơi.
HAIRSTYLE_TEMPLATES = {
    1: "https://res.cloudinary.com/demo/image/upload/hairstyle_1.png",
    2: "https://res.cloudinary.com/demo/image/upload/hairstyle_2.png",
}


def process_tryon(image_url: str, hairstyle_id: int) -> str:
    hairstyle_url = HAIRSTYLE_TEMPLATES.get(hairstyle_id)
    if hairstyle_url is None:
        raise ValueError(f"Không tìm thấy mẫu tóc id={hairstyle_id}")

    # AI sinh ảnh kết quả thật (không phải dán PNG đè) — URL trả về từ
    # Replicate chỉ tồn tại tạm thời.
    replicate_output_url = generate_hairswap(image_url, hairstyle_url)

    # Tải về rồi upload lại Cloudinary để lưu vĩnh viễn.
    result_rgb = download_image(replicate_output_url)
    return upload_result_image(result_rgb)
