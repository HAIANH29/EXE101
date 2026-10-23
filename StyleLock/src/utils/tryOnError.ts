import { ApiError } from '../services/apiClient';

const DEFAULT_MESSAGE = 'Không thể thử tóc bằng AI lúc này. Vui lòng thử lại sau.';

/**
 * Đổi lỗi kỹ thuật khi gọi /api/tryon thành câu người dùng hiểu và biết làm gì tiếp.
 */
export function describeTryOnError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử lại.';
    }
    if (error.status === 413) {
      return 'Ảnh quá lớn (tối đa 5MB). Vui lòng chọn ảnh nhỏ hơn.';
    }
    if (error.status >= 500) {
      return 'Dịch vụ AI đang bận hoặc chưa sẵn sàng. Vui lòng thử lại sau ít phút.';
    }
    return error.message || DEFAULT_MESSAGE;
  }

  const message = error instanceof Error ? error.message : '';
  if (/network request failed|failed to fetch|network error|timed? ?out/i.test(message)) {
    return 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại (máy chủ có thể cần khoảng 30 giây để khởi động).';
  }
  return message || DEFAULT_MESSAGE;
}
