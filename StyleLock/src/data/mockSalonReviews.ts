import type { BackendReview, BackendReviewSummary } from '../services/backendApi';

const REVIEWER_NAMES = [
  'Nguyễn Minh Anh',
  'Trần Quốc Bảo',
  'Lê Thảo Vy',
  'Phạm Hoàng Nam',
  'Võ Khánh Linh',
  'Đặng Gia Huy',
  'Bùi Ngọc Hân',
  'Hoàng Tuấn Kiệt',
  'Đỗ Phương Thảo',
  'Ngô Đức Mạnh',
  'Huỳnh Thanh Trúc',
  'Phan Quang Minh',
  'Lý Hải Yến',
  'Trịnh Minh Quân',
  'Vũ Mỹ Duyên',
  'Dương Anh Tuấn',
  'Nguyễn Bảo Trâm',
  'Lê Nhật Hào',
  'Trần Khánh Vy',
  'Phạm Tiến Đạt'
];

const FIVE_STAR_COMMENTS = [
  'Thợ cắt rất tỉ mỉ và tư vấn kiểu tóc hợp với khuôn mặt mình. Không gian sạch sẽ, đặt lịch trước nên tới là làm luôn không phải chờ.',
  'Trải nghiệm tuyệt vời, nhân viên thân thiện và gội đầu siêu thư giãn. Cắt xong về nhà vuốt lại vẫn vào form rất đẹp!',
  'Mình thử tóc AI trên StyleLock rồi mang ảnh ra salon, anh thợ cắt giống tới 95%. Rất hài lòng, chắc chắn sẽ quay lại lần sau.',
  'Giá cả minh bạch, không chèo kéo thêm dịch vụ. Thợ làm cẩn thận từng chi tiết, tạo kiểu xong nhìn sáng mặt hẳn.',
  'Salon sạch đẹp, đúng giờ hẹn. Nhân viên chăm sóc chu đáo, tư vấn chăm sóc tóc tại nhà rất có tâm. Đáng 5 sao!',
  'Lần đầu đặt lịch qua StyleLock mà ưng ý ngoài mong đợi. Cắt đẹp, gội massage dễ chịu, tóc mềm mượt thơm lâu.',
  'Anh stylist có tay nghề cao, nghe kỹ yêu cầu của khách rồi góp ý thêm để hợp chất tóc hơn. Rất chuyên nghiệp!',
  'Không gian thoáng mát, dụng cụ gọn gàng sạch sẽ. Mình làm combo cắt gội mà giá rất hợp lý, chất lượng vượt mong đợi.',
  'Thợ cắt nhanh nhưng cực kỳ chuẩn form, về tự sấy cũng dễ vào nếp. Phục vụ nhiệt tình từ lúc bước vào tới lúc về.',
  'Đặt lịch rất tiện, tới nơi được tiếp đón niềm nở. Kiểu tóc mới ai cũng khen trẻ trung hơn hẳn, sẽ giới thiệu cho bạn bè.',
  'Mình khá kỹ tính chuyện cắt tóc nhưng làm ở đây rất ưng. Phần mái và side fade xử lý mượt, không bị cứng.',
  'Nhân viên dễ thương, tư vấn kỹ trước khi làm. Tóc sau khi hoàn thiện rất tự nhiên và bồng bềnh, rất đáng trải nghiệm!'
];

/** Tạo số giả ngẫu nhiên ổn định theo seed để mỗi salon luôn có cùng 3-5 đánh giá cố định. */
function seededNext(seed: number): () => number {
  let state = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickUniqueIndices(total: number, count: number, nextRand: () => number): number[] {
  const pool = Array.from({ length: total }, (_, i) => i);
  const picked: number[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(nextRand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

/**
 * Sinh dữ liệu đánh giá mẫu (random 3..5 người, 5 sao, có bình luận) cho từng salon.
 * Chỉ hiển thị phía frontend để không ảnh hưởng số liệu thực tế trong cơ sở dữ liệu.
 */
export function getMockReviewsForSalon(salonId: number): BackendReview[] {
  const safeSalonId = Number.isFinite(salonId) ? Math.abs(Math.trunc(salonId)) : 1;
  const nextRand = seededNext(safeSalonId * 7919 + 104729);
  const count = 3 + Math.floor(nextRand() * 3); // 3, 4 hoặc 5 đánh giá

  const nameIndices = pickUniqueIndices(REVIEWER_NAMES.length, count, nextRand);
  const commentIndices = pickUniqueIndices(FIVE_STAR_COMMENTS.length, count, nextRand);

  // Mốc thời gian cố định gần đây (lùi 2..45 ngày theo từng review, sắp mới nhất trước)
  const dayOffsets = Array.from({ length: count }, () => 2 + Math.floor(nextRand() * 44)).sort((a, b) => a - b);
  const nowMs = Date.now();

  return Array.from({ length: count }, (_, idx) => {
    const createdAt = new Date(nowMs - dayOffsets[idx] * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: -(safeSalonId * 100 + idx + 1),
      bookingId: -(safeSalonId * 100 + idx + 1),
      customerId: 1000 + nameIndices[idx],
      customerName: REVIEWER_NAMES[nameIndices[idx]],
      salonId: safeSalonId,
      rating: 5,
      comment: FIVE_STAR_COMMENTS[commentIndices[idx]],
      createdAt
    };
  });
}

export function mergeSalonReviews(salonId: number, realReviews: BackendReview[]): BackendReview[] {
  const mockReviews = getMockReviewsForSalon(salonId);
  return [...realReviews, ...mockReviews];
}

export function mergeSalonReviewSummary(
  salonId: number,
  realSummary?: BackendReviewSummary
): BackendReviewSummary {
  const mockReviews = getMockReviewsForSalon(salonId);
  const realCount = Number(realSummary?.totalReviews || 0);
  const realAvg = Number(realSummary?.averageRating || 0);
  const mockSum = mockReviews.reduce((acc, item) => acc + item.rating, 0);
  const totalReviews = realCount + mockReviews.length;
  const averageRating = totalReviews > 0
    ? Number(((realCount * realAvg + mockSum) / totalReviews).toFixed(1))
    : 5.0;

  return {
    salonId,
    averageRating,
    totalReviews
  };
}

