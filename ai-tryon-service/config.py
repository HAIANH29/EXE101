import os


AI_TRYON_INTERNAL_TOKEN = os.getenv("AI_TRYON_INTERNAL_TOKEN", "")
AI_ALLOWED_IMAGE_HOSTS = {
	host.strip().lower()
	for host in os.getenv("AI_ALLOWED_IMAGE_HOSTS", "res.cloudinary.com").split(",")
	if host.strip()
}
AI_MAX_IMAGE_BYTES = int(os.getenv("AI_MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
AI_MAX_CONCURRENT_REQUESTS = int(os.getenv("AI_MAX_CONCURRENT_REQUESTS", "2"))

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
