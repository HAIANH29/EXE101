import replicate

from config import REPLICATE_HAIR_MODEL


def generate_hairswap(face_image_url: str, hair_image_url: str) -> str:
    """
    Gọi model hair-transfer trên Replicate (dựa trên kiến trúc HairFastGAN).
    Nhận URL ảnh mặt khách + URL ảnh mẫu tóc, trả về URL ảnh kết quả
    (ảnh được AI sinh/vẽ lại, không phải dán PNG đè lên).

    LƯU Ý: model do cộng đồng host trên Replicate (không phải chính thức
    từ tác giả paper), có thể bị gỡ hoặc đổi version theo thời gian.
    Nếu gặp lỗi 404/not found, kiểm tra lại REPLICATE_HAIR_MODEL trong .env
    trỏ đúng version hiện có trên replicate.com.
    """
    output = replicate.run(
        REPLICATE_HAIR_MODEL,
        input={
            "face_image": face_image_url,
            "hair_image": hair_image_url,
        },
    )
    # replicate.run() có thể trả về object FileOutput hoặc string tùy version
    # thư viện — ép về string URL cho thống nhất.
    return str(output)
