from typing import Optional
from services.image_io import download_image, upload_result_image
from services.replicate_client import generate_hairswap

# Map hairstyleId -> ảnh mẫu tóc cho demo
HAIRSTYLE_TEMPLATES = {
    1: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600",
    2: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600",
    3: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600",
    4: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    5: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600",
}


def process_tryon(image_url: str, hairstyle_id: int, color_image_url: Optional[str] = None) -> str:
    hairstyle_url = HAIRSTYLE_TEMPLATES.get(hairstyle_id, HAIRSTYLE_TEMPLATES[1])

    # Pipeline HairFastGAN: Encode -> Shape/Color Split -> Inpainting -> Alignment -> Latent Blend -> StyleGAN2 Generator
    replicate_output_url = generate_hairswap(
        face_image_url=image_url,
        hair_image_url=hairstyle_url,
        color_image_url=color_image_url
    )

    # Tải về rồi upload lại Cloudinary để lưu vĩnh viễn.
    result_rgb = download_image(replicate_output_url)
    return upload_result_image(result_rgb)

