/**
 * Tiện ích xử lý biến đổi ảnh (xoay, phóng to/thu nhỏ, dời vị trí)
 * Sử dụng HTML5 Canvas trên Web để kết xuất ảnh mới chuẩn xác gửi cho Model AI
 */
import { Platform } from 'react-native';

export interface TransformOptions {
  scale?: number;
  rotation?: number; // degrees
  offsetX?: number;
  offsetY?: number;
  isFlipped?: boolean;
  outputSize?: number; // Kích thước vuông mặc định (ví dụ 1024)
}

/**
 * Áp dụng transform (xoay, zoom, offset) lên ảnh và xuất ra chuỗi base64 Data URL (JPEG)
 */
export async function applyTransformToImage(
  imageUri: string,
  options: TransformOptions = {}
): Promise<string> {
  const {
    scale = 1.0,
    rotation = 0,
    offsetX = 0,
    offsetY = 0,
    isFlipped = false,
    outputSize = 1024
  } = options;

  // Nếu không có transform nào và không bị xoay/flip, trả về ảnh gốc
  const isIdentity =
    Math.abs(scale - 1.0) < 0.01 &&
    rotation % 360 === 0 &&
    Math.abs(offsetX) < 1 &&
    Math.abs(offsetY) < 1 &&
    !isFlipped;

  if (isIdentity) {
    return imageUri;
  }

  // Trên nền tảng Web: Sử dụng HTML5 Canvas
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = outputSize;
          canvas.height = outputSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(imageUri);
            return;
          }

          // Nền đen trung tính hoặc giữ nền ảnh
          ctx.fillStyle = '#1A1817';
          ctx.fillRect(0, 0, outputSize, outputSize);

          ctx.save();

          // Dời tâm canvas về giữa
          ctx.translate(outputSize / 2, outputSize / 2);

          // Áp dụng di chuyển (chuẩn hóa theo kích thước hiển thị ~ 380px sang outputSize)
          const ratio = outputSize / 380;
          ctx.translate(offsetX * ratio, offsetY * ratio);

          // Áp dụng xoay
          const rad = (rotation * Math.PI) / 180;
          ctx.rotate(rad);

          // Áp dụng phóng to / lật
          const scaleX = (isFlipped ? -scale : scale);
          const scaleY = scale;
          ctx.scale(scaleX, scaleY);

          // Tính toán kích thước vẽ để cover khung hình vuông
          const imgAspect = img.width / img.height;
          let drawWidth = outputSize;
          let drawHeight = outputSize;

          if (imgAspect > 1) {
            drawWidth = outputSize * imgAspect;
            drawHeight = outputSize;
          } else {
            drawWidth = outputSize;
            drawHeight = outputSize / imgAspect;
          }

          ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

          ctx.restore();

          const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(resultDataUrl);
        } catch (err) {
          console.warn('Canvas transform export failed, falling back to original image:', err);
          resolve(imageUri);
        }
      };

      img.onerror = () => {
        console.warn('Could not load image for transform, using original');
        resolve(imageUri);
      };

      img.src = imageUri;
    });
  }

  // Fallback trên native nếu chưa có native canvas
  return imageUri;
}
