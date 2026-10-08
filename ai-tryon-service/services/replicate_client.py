import replicate

from config import REPLICATE_HAIR_MODEL


def generate_hairswap(
    face_image_url: str,
    hair_image_url: str,
    color_image_url: str = None
) -> str:
    """
    Gọi model hair-transfer trên Replicate (kiến trúc HairFastGAN: StyleGAN2 + Latent Space blending).
    Nhận:
      - face_image: URL ảnh khuôn mặt khách (face-cropped)
      - hair_image: URL ảnh mẫu tóc để trích xuất Hair Shape latent code
      - color_image: URL ảnh màu tóc để trích xuất Color latent code (mặc định lấy từ hair_image)
    
    Model thực hiện:
      1. Latent Encoding (StyleGAN2 W+ space)
      2. Shape & Color separation
      3. Inpainting (Xóa tóc gốc)
      4. Pose Alignment & Latent Blending
      5. StyleGAN2 Generation tạo ảnh chân thực có bóng đổ & texture tự nhiên.
    """
    input_params = {
        "face_image": face_image_url,
        "hair_image": hair_image_url,
    }
    if color_image_url:
        input_params["color_image"] = color_image_url
    else:
        input_params["color_image"] = hair_image_url

    output = replicate.run(
        REPLICATE_HAIR_MODEL,
        input=input_params,
    )
    return str(output)

