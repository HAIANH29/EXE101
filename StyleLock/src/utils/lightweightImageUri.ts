import { Platform } from 'react-native';

/**
 * Trên web, camera / image picker thường trả ảnh dạng data URL base64 (có thể vài MB).
 * React Navigation đưa mọi tham số route vào URL của trình duyệt, nên truyền thẳng data URL qua
 * navigation.navigate(...) sẽ nhét một URL khổng lồ vào thanh địa chỉ và làm trình duyệt đứng
 * ("Page unresponsive"). Hàm này đổi data URL thành blob: URL ngắn (cùng ảnh, cùng nguồn gốc).
 * Native và URL không phải data: được trả về nguyên vẹn.
 */
export async function toLightweightImageUri(uri: string): Promise<string> {
  if (Platform.OS !== 'web' || !uri.startsWith('data:')) return uri;
  try {
    const blob = await (await fetch(uri)).blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn('Could not convert data URL to blob URL, using original', error);
    return uri;
  }
}
