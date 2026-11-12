import replicate

from config import REPLICATE_API_TOKEN, REPLICATE_HAIR_MODEL


def _extract_output_url(output) -> str:
    """
    Tùy phiên bản SDK, replicate.run() có thể trả về: str URL, FileOutput (có .url),
    list[...] hoặc dict. Chuẩn hóa về 1 URL ảnh duy nhất.
    """
    if output is None:
        raise RuntimeError("Replicate không trả về ảnh kết quả")
    if isinstance(output, (list, tuple)):
        if not output:
            raise RuntimeError("Replicate trả về danh sách rỗng")
        return _extract_output_url(output[-1])
    if isinstance(output, dict):
        for key in ("image", "output", "result", "url"):
            if output.get(key):
                return _extract_output_url(output[key])
        raise RuntimeError(f"Không đọc được output Replicate: {output}")
    url = getattr(output, "url", None)
    if url:
        return url() if callable(url) else str(url)
    return str(output)


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
    if not REPLICATE_API_TOKEN:
        raise RuntimeError(
            "Thiếu REPLICATE_API_TOKEN cho ai-tryon-service (thêm vào ai-tryon-service/.env hoặc exe/.env)"
        )

    input_params = {
        "face_image": face_image_url,
        "hair_image": hair_image_url,
        "color_image": color_image_url or hair_image_url,
    }

    output = replicate.run(
        REPLICATE_HAIR_MODEL,
        input=input_params,
    )
    return _extract_output_url(output)
