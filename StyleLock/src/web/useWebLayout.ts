import { Platform, useWindowDimensions } from 'react-native';

/** Từ độ rộng này trở lên (chỉ trên web) app chuyển sang bố cục desktop. Mobile và web hẹp giữ nguyên. */
export const WEB_WIDE_BREAKPOINT = 900;
/** Độ rộng tối đa của vùng nội dung trên web rộng. */
export const WEB_CONTENT_MAX_WIDTH = 1200;

export type WebLayout = {
  /** true khi đang chạy trên trình duyệt VÀ cửa sổ đủ rộng để dùng bố cục desktop */
  isWide: boolean;
  /** true khi cửa sổ rất rộng (>= 1200) - dùng để thêm cột cho lưới */
  isXWide: boolean;
  width: number;
  /** Độ rộng thực của vùng nội dung (đã trừ phần căn giữa ở web rộng) - dùng để tính số cột lưới */
  contentWidth: number;
};

export function useWebLayout(): WebLayout {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    isWide: isWeb && width >= WEB_WIDE_BREAKPOINT,
    isXWide: isWeb && width >= 1200,
    width,
    contentWidth: Platform.OS === "web" && width >= WEB_WIDE_BREAKPOINT ? Math.min(width, WEB_CONTENT_MAX_WIDTH) : width
  };
}
