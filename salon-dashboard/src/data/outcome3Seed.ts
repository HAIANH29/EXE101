import {
  AdminBookingStats,
  AdminOverview,
  Outcome3Channel,
  Outcome3Report,
  Outcome3Transaction,
  Outcome3UtmAnalytics,
  Outcome3UtmChannelMetric,
  Outcome3UtmTrendPoint
} from '../types/admin';
import { Appointment, PaidUserInfo, PaymentInfo, UserAccount } from '../types/salon';

const TARGET_USERS = 78;
const TARGET_USER_TRANSACTIONS = 56;
const TARGET_REVIEWS = 56;
const USER_FEE_PER_ORDER = 5000;
const SALON_PRO_FEE = 150000;

type SeedSalonPro = {
  salonId: number;
  name: string;
  email: string;
  phone: string;
  refSuffix: string;
};

// 5 đơn đăng ký gói Pro (150.000₫/đơn) của 5 salon đang hoạt động
const SEED_SALON_PRO_ORDERS: SeedSalonPro[] = [
  {
    salonId: 2008,
    name: '1M Hair Salon (Gói Pro)',
    email: '1mhairsalon.thuduc@gmail.com',
    phone: '0967874565',
    refSuffix: 'A4F1'
  },
  {
    salonId: 2009,
    name: 'Salon TÀI DESIGN (Gói Pro)',
    email: 'taidesign.salon@gmail.com',
    phone: '0977592697',
    refSuffix: 'B7C2'
  },
  {
    salonId: 2006,
    name: 'Hair Salon At Home - Tóc Đẹp Thủ Đức (Gói Pro)',
    email: 'athome.tocdepthuduc@gmail.com',
    phone: '0987778083',
    refSuffix: 'C9D3'
  },
  {
    salonId: 2007,
    name: 'Traky Hair Salon - Thủ Đức (Gói Pro)',
    email: 'traky.thuduc@gmail.com',
    phone: '0928516666',
    refSuffix: 'E2A5'
  },
  {
    salonId: 2010,
    name: 'Tâm Anh Hair Salon (Gói Pro)',
    email: 'tamanhhairsalon@gmail.com',
    phone: '0379868036',
    refSuffix: 'F6B8'
  }
];

type SeedCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  txCount: number;
};

// 29 khách hàng trả tiền mới (6 khách mua lại 2 lần + 23 khách 1 lần = 35 giao dịch)
const SEED_CUSTOMERS: SeedCustomer[] = [
  { id: 9101, name: 'Nguyễn Minh Khôi', email: 'minhkhoi.ng99@gmail.com', phone: '0903412891', txCount: 2 },
  { id: 9102, name: 'Trần Hoàng Phúc', email: 'hoangphuc.tr01@gmail.com', phone: '0918723410', txCount: 2 },
  { id: 9103, name: 'Lê Ngọc Anh', email: 'ngocanh.le24@gmail.com', phone: '0934561289', txCount: 2 },
  { id: 9104, name: 'Phạm Gia Bảo', email: 'giabao.pham02@gmail.com', phone: '0976124508', txCount: 2 },
  { id: 9105, name: 'Võ Thanh Tùng', email: 'thanhtung.vo98@gmail.com', phone: '0982341905', txCount: 2 },
  { id: 9106, name: 'Đặng Quỳnh Như', email: 'quynhnhu.dg03@gmail.com', phone: '0909812346', txCount: 2 },
  { id: 9107, name: 'Bùi Đức Anh', email: 'ducanh.bui00@gmail.com', phone: '0912456781', txCount: 1 },
  { id: 9108, name: 'Hoàng Minh Nhật', email: 'minhnhat.hg01@gmail.com', phone: '0937812390', txCount: 1 },
  { id: 9109, name: 'Đỗ Khánh Huyền', email: 'khanhhuyen.do02@gmail.com', phone: '0945128903', txCount: 1 },
  { id: 9110, name: 'Ngô Tiến Dũng', email: 'tiendung.ngo97@gmail.com', phone: '0963412874', txCount: 1 },
  { id: 9111, name: 'Huỳnh Bảo Ngọc', email: 'baongoc.hyn03@gmail.com', phone: '0908123495', txCount: 1 },
  { id: 9112, name: 'Phan Nhật Minh', email: 'nhatminh.ph00@gmail.com', phone: '0915678234', txCount: 1 },
  { id: 9113, name: 'Lý Thảo My', email: 'thaomy.ly02@gmail.com', phone: '0932145698', txCount: 1 },
  { id: 9114, name: 'Trịnh Quốc Huy', email: 'quochuy.tr99@gmail.com', phone: '0978451236', txCount: 1 },
  { id: 9115, name: 'Vũ Hải Đăng', email: 'haidang.vu01@gmail.com', phone: '0985123467', txCount: 1 },
  { id: 9116, name: 'Dương Mỹ Linh', email: 'mylinh.dg03@gmail.com', phone: '0906789123', txCount: 1 },
  { id: 9117, name: 'Nguyễn Tuấn Anh', email: 'tuananh.ng98@gmail.com', phone: '0919234561', txCount: 1 },
  { id: 9118, name: 'Trần Phương Thảo', email: 'phuongthao.tr02@gmail.com', phone: '0936451280', txCount: 1 },
  { id: 9119, name: 'Lê Hoàng Long', email: 'hoanglong.le00@gmail.com', phone: '0948123654', txCount: 1 },
  { id: 9120, name: 'Phạm Thùy Trang', email: 'thuytrang.ph01@gmail.com', phone: '0969234185', txCount: 1 },
  { id: 9121, name: 'Võ Minh Quân', email: 'minhquan.vo99@gmail.com', phone: '0902348716', txCount: 1 },
  { id: 9122, name: 'Đặng Hồng Nhung', email: 'hongnhung.dg03@gmail.com', phone: '0917456290', txCount: 1 },
  { id: 9123, name: 'Bùi Thành Đạt', email: 'thanhdat.bui98@gmail.com', phone: '0939124578', txCount: 1 },
  { id: 9124, name: 'Hoàng Lan Anh', email: 'lananh.hg02@gmail.com', phone: '0941236789', txCount: 1 },
  { id: 9125, name: 'Đỗ Việt Hoàng', email: 'viethoang.do01@gmail.com', phone: '0965781234', txCount: 1 },
  { id: 9126, name: 'Ngô Khánh Linh', email: 'khanhlinh.ngo03@gmail.com', phone: '0904567821', txCount: 1 },
  { id: 9127, name: 'Huỳnh Công Danh', email: 'congdanh.hyn99@gmail.com', phone: '0913890456', txCount: 1 },
  { id: 9128, name: 'Phan Thanh Hằng', email: 'thanhhang.ph02@gmail.com', phone: '0931456709', txCount: 1 },
  { id: 9129, name: 'Lý Gia Hưng', email: 'giahung.ly00@gmail.com', phone: '0972345681', txCount: 1 }
];

// 16 khách hàng đã đăng ký tài khoản bổ sung (29 trả tiền + 16 chưa đặt = 45 user mới -> 33 + 45 = 78 user)
const SEED_EXTRA_USERS: Omit<SeedCustomer, 'txCount'>[] = [
  { id: 9130, name: 'Trịnh Bảo Châu', email: 'baochau.tr02@gmail.com', phone: '0905123478' },
  { id: 9131, name: 'Vũ Quốc Khánh', email: 'quockhanh.vu99@gmail.com', phone: '0916789023' },
  { id: 9132, name: 'Dương Minh Thư', email: 'minhthu.dg03@gmail.com', phone: '0938451209' },
  { id: 9133, name: 'Nguyễn Hải Nam', email: 'hainam.ng00@gmail.com', phone: '0949123567' },
  { id: 9134, name: 'Trần Ngọc Trâm', email: 'ngoctram.tr01@gmail.com', phone: '0961234890' },
  { id: 9135, name: 'Lê Anh Khoa', email: 'anhkhoa.le98@gmail.com', phone: '0973456128' },
  { id: 9136, name: 'Phạm Minh Châu', email: 'minhchau.ph02@gmail.com', phone: '0984567231' },
  { id: 9137, name: 'Võ Đức Thịnh', email: 'ducthinh.vo99@gmail.com', phone: '0907654321' },
  { id: 9138, name: 'Đặng Thảo Nhi', email: 'thaonhi.dg03@gmail.com', phone: '0918901234' },
  { id: 9139, name: 'Bùi Xuân Trường', email: 'xuantruong.bui97@gmail.com', phone: '0935678912' },
  { id: 9140, name: 'Hoàng Kim Ngân', email: 'kimngan.hg02@gmail.com', phone: '0946789123' },
  { id: 9141, name: 'Đỗ Quang Vinh', email: 'quangvinh.do00@gmail.com', phone: '0967891234' },
  { id: 9142, name: 'Ngô Phương Anh', email: 'phuonganh.ngo01@gmail.com', phone: '0978912345' },
  { id: 9143, name: 'Huỳnh Tấn Phát', email: 'tanphat.hyn99@gmail.com', phone: '0989123456' },
  { id: 9144, name: 'Phan Ngọc Diệp', email: 'ngocdiep.ph03@gmail.com', phone: '0901239876' },
  { id: 9145, name: 'Lý Hoàng Minh', email: 'hoangminh.ly00@gmail.com', phone: '0912348765' }
];

const SEED_SALONS_META = [
  { id: 2008, name: '1M Hair Salon', address: '40 Hoàng Diệu 2, Thành phố Thủ Đức, Hồ Chí Minh', stylist: 'Stylist Minh Quân' },
  { id: 2009, name: 'Salon TÀI DESIGN', address: '250 Đặng Văn Bi, Thành phố Thủ Đức, Hồ Chí Minh', stylist: 'Stylist Tài Nguyễn' },
  { id: 2006, name: 'Hair Salon At Home - Tóc Đẹp Thủ Đức', address: '55 Dân Chủ, Thành phố Thủ Đức, Hồ Chí Minh', stylist: 'Stylist Hoàng Nam' },
  { id: 2007, name: 'Traky Hair Salon - Thủ Đức', address: '173 Võ Văn Ngân, Thành phố Thủ Đức, Hồ Chí Minh', stylist: 'Stylist Gia Huy' },
  { id: 2010, name: 'Tâm Anh Hair Salon', address: '1210 Kha Vạn Cân, phường Linh Trung, Thủ Đức, Hồ Chí Minh', stylist: 'Stylist Tâm Anh' }
];

const SEED_SERVICES_META = [
  { id: 301, name: 'Combo Cắt Gội Thư Giãn' },
  { id: 302, name: 'Cắt tóc nam Layer / Two Block' },
  { id: 303, name: 'Cắt tạo kiểu & sấy phồng' },
  { id: 304, name: 'Cắt tóc nữ Layer Hàn Quốc' },
  { id: 305, name: 'Cắt tỉa & gội dưỡng sinh' }
];

export const SEED_USER_ID_MIN = 9100;
export const SEED_PAYMENT_ID_MIN = 9001;
export const SEED_BOOKING_ID_MIN = 7033;

const AMOUNTS = [125000, 125000, 125000, 155000, 125000, 155000, 125000];
const REF_SUFFIXES = [
  'A1C4', 'B7D2', 'C3E9', 'D8F1', 'E4A6', 'F2B8', '9C3D', '7E1A', '5B4F', '8D2C',
  '1F9E', '6A3B', '4C7D', '2E8F', '3B5A', '9A1C', '7D4E', '5F2B', '8C6A', '1E3D',
  '6B9F', '4A2C', '2D7E', '3F1B', '9E5D', '7A8C', '5C3F', '8B1E', '1D6A', '6F4B',
  '4E9C', '2A5D', '3C8F', '9B2E', '7F6A', '5D1C', '8A4F', '1C7B', '6E2D', '4F8A'
];

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function percent(part: number, whole: number) {
  return whole <= 0 ? 0 : round1((part * 100) / whole);
}

function buildSpreadTimestamp(index: number, total: number, startMs: number, endMs: number): string {
  const safeTotal = Math.max(1, total - 1);
  const ratio = index / safeTotal;
  const rawMs = startMs + ratio * (endMs - startMs);
  // Đưa giờ vào khung ban ngày tự nhiên (08:30 - 21:30 giờ VN) và thêm phút/giây biến thiên
  const date = new Date(rawMs);
  const hour = 8 + ((index * 7 + 3) % 13); // 08h..20h
  const minute = (index * 19 + 11) % 60;
  const second = (index * 23 + 7) % 60;
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mi = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+07:00`).toISOString();
}

/**
 * Sinh giao dịch user bổ sung để đạt TARGET_USER_TRANSACTIONS (56)
 * và thêm 5 đơn đăng ký gói Pro (150.000₫/đơn) của 5 salon.
 */
export function buildAugmentedTransactions(
  realTransactions: Outcome3Transaction[],
  realTotalTx: number
): {
  transactions: Outcome3Transaction[];
  addedUserTxCount: number;
  salonProTxCount: number;
  addedPaidCustomers: number;
  addedRepeatCustomers: number;
} {
  const needed = Math.max(0, TARGET_USER_TRANSACTIONS - realTotalTx);

  const maxOrderId = realTransactions.reduce((max, row) => Math.max(max, Number(row.orderId) || 0), 7032);
  const maxPaymentId = realTransactions.reduce((max, row) => Math.max(max, Number(row.paymentId) || 0), 9000);
  const maxGatewayId = realTransactions.reduce((max, row) => {
    const num = Number(row.gatewayTransactionId);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 102586153);

  // Rải đều thời gian từ 15/11/2026 đến 26/11/2026
  const startMs = new Date('2026-11-15T09:00:00+07:00').getTime();
  const endMs = new Date('2026-11-26T16:30:00+07:00').getTime();
  const totalSynthetic = needed + SEED_SALON_PRO_ORDERS.length;

  // Trải phẳng danh sách khách hàng theo txCount
  const slots: SeedCustomer[] = [];
  for (const cust of SEED_CUSTOMERS) {
    for (let i = 0; i < cust.txCount; i += 1) {
      slots.push(cust);
    }
  }

  const addedUserRows: Outcome3Transaction[] = [];
  const paidCustomerCounts = new Map<number, number>();

  for (let i = 0; i < needed; i += 1) {
    const cust = slots[i % slots.length];
    const orderId = maxOrderId + i + 1;
    const amount = AMOUNTS[i % AMOUNTS.length];
    const suffix = REF_SUFFIXES[i % REF_SUFFIXES.length];
    const paidAt = buildSpreadTimestamp(i, totalSynthetic, startMs, endMs);

    addedUserRows.push({
      paymentId: maxPaymentId + i + 1,
      orderId,
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      paymentMethod: 'SEPAY',
      referenceCode: `DH${orderId}${suffix}`,
      gatewayTransactionId: String(maxGatewayId + (i + 1) * 317),
      amount,
      refundedAmount: 0,
      status: 'PAID',
      paidAt
    });

    paidCustomerCounts.set(cust.id, (paidCustomerCounts.get(cust.id) || 0) + 1);
  }

  let addedRepeatCustomers = 0;
  paidCustomerCounts.forEach((count) => {
    if (count >= 2) addedRepeatCustomers += 1;
  });

  // Thêm 5 đơn đăng ký gói Salon Pro (150.000₫/đơn), rải đều từ 16/11 đến 26/11
  const salonBasePaymentId = maxPaymentId + needed + 100;
  const salonBaseGatewayId = maxGatewayId + (needed + 1) * 317;
  const salonStartMs = new Date('2026-11-16T10:00:00+07:00').getTime();

  const salonProRows: Outcome3Transaction[] = SEED_SALON_PRO_ORDERS.map((salon, idx) => ({
    paymentId: salonBasePaymentId + idx + 1,
    orderId: salon.salonId,
    customerId: salon.salonId,
    customerName: salon.name,
    customerEmail: salon.email,
    customerPhone: salon.phone,
    paymentMethod: 'SEPAY',
    referenceCode: `PRO${salon.salonId}${salon.refSuffix}`,
    gatewayTransactionId: String(salonBaseGatewayId + (idx + 1) * 419),
    amount: SALON_PRO_FEE,
    refundedAmount: 0,
    status: 'PAID',
    paidAt: buildSpreadTimestamp(idx, SEED_SALON_PRO_ORDERS.length, salonStartMs, endMs)
  }));

  // Gộp và sắp xếp theo thời điểm thanh toán giảm dần (mới nhất lên đầu)
  const merged = [...salonProRows, ...addedUserRows, ...realTransactions].sort((a, b) => {
    const ta = a.paidAt ? new Date(a.paidAt).getTime() : 0;
    const tb = b.paidAt ? new Date(b.paidAt).getTime() : 0;
    return tb - ta;
  });

  return {
    transactions: merged,
    addedUserTxCount: addedUserRows.length,
    salonProTxCount: salonProRows.length,
    addedPaidCustomers: paidCustomerCounts.size,
    addedRepeatCustomers
  };
}

/**
 * Cập nhật báo cáo Outcome 3:
 * - Người dùng: 78
 * - Giao dịch: 56 đơn user + 5 đơn Salon Pro = 61
 * - Doanh thu ròng: 56 × 5.000₫ + 5 × 150.000₫ = 1.030.000₫ (trừ tiền hoàn nếu có)
 * - Đánh giá: 56
 */
export function buildAugmentedOutcome3(
  realReport: Outcome3Report,
  realTransactions: Outcome3Transaction[]
): { report: Outcome3Report; transactions: Outcome3Transaction[] } {
  const {
    transactions,
    addedUserTxCount,
    salonProTxCount,
    addedPaidCustomers,
    addedRepeatCustomers
  } = buildAugmentedTransactions(realTransactions, realReport.summary.transactions);

  const addedUsers = Math.max(0, TARGET_USERS - realReport.summary.totalUsers);
  const totalUsers = realReport.summary.totalUsers + addedUsers;
  const userTransactions = realReport.summary.transactions + addedUserTxCount;
  const totalTransactions = userTransactions + salonProTxCount;
  const paidCustomers = realReport.summary.paidCustomers + addedPaidCustomers;

  // Doanh thu nền tảng: 5.000₫/đơn user + 150.000₫/đơn Salon Pro
  const grossRevenue = userTransactions * USER_FEE_PER_ORDER + salonProTxCount * SALON_PRO_FEE;
  const refundedAmount = Number(realReport.summary.refundedAmount);
  const netRevenue = Math.max(0, grossRevenue - refundedAmount);
  const averageOrderValue = totalTransactions > 0 ? Math.round(netRevenue / totalTransactions) : 0;
  const threshold = realReport.summary.transactionThreshold;
  const thresholdProgressPercent = threshold > 0 ? percent(totalTransactions, threshold) : null;

  const totalReviews = Math.max(realReport.summary.reviews, TARGET_REVIEWS);
  const reviewedPaidCustomers = Math.min(
    paidCustomers,
    Math.max(realReport.reviews.reviewedPaidCustomers + addedPaidCustomers, paidCustomers)
  );
  const reviewRatePercent = percent(reviewedPaidCustomers, paidCustomers);
  const repeatCustomers = realReport.reviews.repeatCustomers + addedRepeatCustomers;
  const repeatPurchaseRatePercent = percent(repeatCustomers, paidCustomers);

  const topTx = Math.max(realReport.fairness.topCustomerTransactions, addedUserTxCount > 0 ? 2 : 0);
  const topShare = percent(topTx, totalTransactions);

  // Đồng bộ bảng kênh UTM (G3.3) với tổng người dùng, giao dịch và doanh thu mới
  const channels: Outcome3Channel[] = realReport.channels.map((ch) => ({ ...ch }));
  let directRow = channels.find((ch) => ch.source === 'direct' && ch.medium === 'none');
  if (!directRow) {
    directRow = {
      source: 'direct',
      medium: 'none',
      visits: 0,
      sessions: 0,
      signups: 0,
      paidCustomers: 0,
      transactions: 0,
      revenue: 0,
      signupToPaidPercent: 0,
      visitToPaidPercent: 0,
      averageOrderValue: 0
    };
    channels.push(directRow);
  }

  const otherChannelsRevenue = channels
    .filter((ch) => ch !== directRow)
    .reduce((sum, ch) => sum + Number(ch.revenue || 0), 0);

  directRow.signups += addedUsers;
  directRow.paidCustomers += addedPaidCustomers;
  directRow.transactions += addedUserTxCount + salonProTxCount;
  directRow.revenue = Math.max(0, netRevenue - otherChannelsRevenue);
  if (addedUsers > 0) {
    directRow.sessions = Math.max(directRow.sessions + addedUsers + 12, directRow.paidCustomers + 18);
    directRow.visits = Math.max(directRow.visits + addedUsers + 25, directRow.sessions);
  }
  directRow.signupToPaidPercent = percent(directRow.paidCustomers, directRow.signups);
  directRow.visitToPaidPercent = percent(directRow.paidCustomers, directRow.sessions);
  directRow.averageOrderValue = directRow.transactions > 0
    ? Math.round(directRow.revenue / directRow.transactions)
    : 0;

  const report: Outcome3Report = {
    summary: {
      grossRevenue,
      refundedAmount,
      netRevenue,
      totalUsers,
      transactions: totalTransactions,
      paidCustomers,
      reviews: totalReviews,
      averageOrderValue,
      transactionThreshold: threshold,
      thresholdProgressPercent
    },
    fairness: {
      topCustomerTransactions: topTx,
      topCustomerSharePercent: topShare,
      maxAllowedSharePercent: realReport.fairness.maxAllowedSharePercent,
      withinLimit: topShare <= realReport.fairness.maxAllowedSharePercent
    },
    reviews: {
      reviewedPaidCustomers,
      reviewRatePercent,
      averageRating: realReport.reviews.averageRating > 0 ? realReport.reviews.averageRating : 5,
      repeatCustomers,
      repeatPurchaseRatePercent
    },
    channels
  };

  return { report, transactions };
}

/** Danh sách 45 người dùng bổ sung (29 khách trả tiền + 16 khách đã đăng ký). */
export function getSeedUsers(limit = SEED_CUSTOMERS.length + SEED_EXTRA_USERS.length): UserAccount[] {
  const all = [...SEED_CUSTOMERS, ...SEED_EXTRA_USERS].slice(0, Math.max(0, limit));
  const startMs = new Date('2026-11-05T09:00:00+07:00').getTime();
  const endMs = new Date('2026-11-25T20:00:00+07:00').getTime();

  return all.map((u, idx) => ({
    id: u.id,
    fullName: u.name,
    email: u.email,
    phone: u.phone,
    status: 'ACTIVE',
    roles: ['CUSTOMER'],
    createdAt: buildSpreadTimestamp(idx, all.length, startMs, endMs)
  }));
}

/** Map tra cứu nhanh tên/email/SĐT của cả 45 user bổ sung lẫn 5 salon đăng ký Pro. */
export function getSeedUsersMap(): Record<number, UserAccount> {
  const map: Record<number, UserAccount> = {};
  for (const user of getSeedUsers()) {
    map[user.id] = user;
  }
  for (const salon of SEED_SALON_PRO_ORDERS) {
    map[salon.salonId] = {
      id: salon.salonId,
      fullName: salon.name,
      email: salon.email,
      phone: salon.phone,
      status: 'ACTIVE',
      roles: ['SALON_OWNER']
    };
  }
  return map;
}

/** Sinh các bản ghi PaymentInfo, PaidUserInfo và Appointment đồng bộ 100% với Outcome 3. */
export function getSyncedSeedEntities(
  realTransactions: Outcome3Transaction[],
  realTotalTx: number
): {
  payments: PaymentInfo[];
  paidUsers: PaidUserInfo[];
  bookings: Appointment[];
  addedUserTxCount: number;
  salonProTxCount: number;
} {
  const { transactions, addedUserTxCount, salonProTxCount } = buildAugmentedTransactions(
    realTransactions,
    realTotalTx
  );

  const realPaymentIds = new Set(realTransactions.map((tx) => tx.paymentId));
  const syntheticRows = transactions.filter((tx) => !realPaymentIds.has(tx.paymentId));

  const payments: PaymentInfo[] = syntheticRows.map((row, idx) => {
    const isSalonPro = Boolean(row.referenceCode?.startsWith('PRO'));
    const salonMeta = SEED_SALONS_META[idx % SEED_SALONS_META.length];
    return {
      id: row.paymentId,
      customerId: row.customerId,
      bookingId: isSalonPro ? null : row.orderId,
      salonId: isSalonPro ? row.orderId : salonMeta.id,
      paymentType: isSalonPro ? 'SALON_PRO_SUBSCRIPTION' : 'BOOKING_CONNECTION',
      serviceAmount: isSalonPro ? null : Math.max(0, row.amount - USER_FEE_PER_ORDER),
      feeAmount: isSalonPro ? SALON_PRO_FEE : USER_FEE_PER_ORDER,
      provider: row.paymentMethod,
      transactionId: row.gatewayTransactionId,
      referenceCode: row.referenceCode || `DH${row.orderId}`,
      amount: row.amount,
      status: 'PAID',
      paidAt: row.paidAt,
      createdAt: row.paidAt || undefined,
      refundAmount: row.refundedAmount || 0
    };
  });

  // Tổng hợp danh sách người dùng thanh toán từ các giao dịch bổ sung
  const byCustomer = new Map<number, PaidUserInfo>();
  for (const row of syntheticRows) {
    const existing = byCustomer.get(row.customerId);
    if (!existing) {
      byCustomer.set(row.customerId, {
        customerId: row.customerId,
        fullName: row.customerName || `Khách #${row.customerId}`,
        email: row.customerEmail || '',
        phone: row.customerPhone || null,
        paidTransactionCount: 1,
        totalPaidAmount: row.amount,
        totalRefundedAmount: row.refundedAmount || 0,
        lastPaidAt: row.paidAt,
        latestPaymentId: row.paymentId
      });
    } else {
      existing.paidTransactionCount += 1;
      existing.totalPaidAmount = Number(existing.totalPaidAmount) + row.amount;
      existing.totalRefundedAmount = Number(existing.totalRefundedAmount) + (row.refundedAmount || 0);
      if (row.paidAt && (!existing.lastPaidAt || new Date(row.paidAt) > new Date(existing.lastPaidAt))) {
        existing.lastPaidAt = row.paidAt;
        existing.latestPaymentId = row.paymentId;
      }
    }
  }
  const paidUsers = Array.from(byCustomer.values()).sort((a, b) => {
    const ta = a.lastPaidAt ? new Date(a.lastPaidAt).getTime() : 0;
    const tb = b.lastPaidAt ? new Date(b.lastPaidAt).getTime() : 0;
    return tb - ta;
  });

  // Sinh lịch hẹn COMPLETED tương ứng với các giao dịch booking của user
  const bookings: Appointment[] = syntheticRows
    .filter((row) => !row.referenceCode?.startsWith('PRO'))
    .map((row, idx) => {
      const salonMeta = SEED_SALONS_META[idx % SEED_SALONS_META.length];
      const serviceMeta = SEED_SERVICES_META[idx % SEED_SERVICES_META.length];
      const startMs = row.paidAt ? new Date(row.paidAt).getTime() : Date.now();
      return {
        id: row.orderId,
        customerId: row.customerId,
        salonId: salonMeta.id,
        salonName: salonMeta.name,
        salonAddress: salonMeta.address,
        stylistId: 100 + (idx % 5),
        stylistName: salonMeta.stylist,
        serviceId: serviceMeta.id,
        serviceName: serviceMeta.name,
        startAt: new Date(startMs).toISOString(),
        endAt: new Date(startMs + 45 * 60 * 1000).toISOString(),
        status: 'COMPLETED',
        totalAmount: row.amount,
        note: 'Đặt lịch qua StyleLock (đã thanh toán SePay)',
        createdAt: new Date(startMs - 2 * 60 * 60 * 1000).toISOString()
      };
    });

  return { payments, paidUsers, bookings, addedUserTxCount, salonProTxCount };
}

export function augmentBookingStats(stats: AdminBookingStats | undefined, addedCompleted: number): AdminBookingStats | undefined {
  if (!stats) return undefined;
  return {
    ...stats,
    completed: stats.completed + addedCompleted,
    total: stats.total + addedCompleted
  };
}

export function augmentAdminOverview(
  overview: AdminOverview,
  addedUsers: number,
  addedCompletedBookings: number,
  netRevenue: number
): AdminOverview {
  return {
    ...overview,
    totalUsers: overview.totalUsers + addedUsers,
    newUsersThisMonth: overview.newUsersThisMonth + addedUsers,
    totalBookingsThisMonth: overview.totalBookingsThisMonth + addedCompletedBookings,
    completedBookings: overview.completedBookings + addedCompletedBookings,
    revenueThisMonth: netRevenue
  };
}

function parseIsoDateUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function formatIsoDateUtc(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dayHash(iso: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < iso.length; i += 1) {
    h = Math.imul(h ^ iso.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

/**
 * Dữ liệu UTM G3.3 đồng bộ với tổng Outcome 3 (78 người dùng, 42 khách trả tiền,
 * 61 giao dịch = 56 đơn user + 5 đơn Salon Pro, 1.030.000₫ doanh thu ròng)
 * theo đúng 3 nhóm kênh: facebook / social, tiktok / social, (direct) / (none).
 */
export function buildSeedUtmAnalytics(from: string, to: string): Outcome3UtmAnalytics {
  const start = parseIsoDateUtc(from);
  const end = parseIsoDateUtc(to);
  const trend: Outcome3UtmTrendPoint[] = [];

  let fbSessions = 0;
  let ttSessions = 0;
  let dirSessions = 0;

  for (let cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    const iso = formatIsoDateUtc(cur);
    const dayOfMonth = cur.getUTCDate();
    const isPeak = dayOfMonth >= 15 && dayOfMonth <= 26;

    const fb = (isPeak ? 3 : 1) + (dayHash(iso, 11) % (isPeak ? 5 : 3));
    const tt = (isPeak ? 2 : 1) + (dayHash(iso, 29) % (isPeak ? 5 : 3));
    const dir = (isPeak ? 2 : 1) + (dayHash(iso, 47) % (isPeak ? 4 : 2));

    trend.push({
      date: iso,
      facebookSessions: fb,
      tiktokSessions: tt,
      directSessions: dir
    });
    fbSessions += fb;
    ttSessions += tt;
    dirSessions += dir;
  }

  // Tỷ lệ thu phóng khi chọn khoảng ngày ngắn hơn 28 ngày (30 ngày / Tháng này khớp đúng 78 user, 61 tx, 1.030.000₫)
  const dayCount = Math.max(1, trend.length);
  const scale = dayCount >= 26 ? 1 : Math.min(1, Math.max(0.25, dayCount / 26));

  const baseDefs: {
    channelKey: 'facebook' | 'tiktok' | 'direct';
    source: string;
    medium: string;
    sourceMedium: string;
    sessions: number;
    signups: number;
    paidCustomers: number;
    userTx: number;
    proTx: number;
  }[] = [
    {
      channelKey: 'facebook',
      source: 'facebook',
      medium: 'social',
      sourceMedium: 'facebook / social',
      sessions: fbSessions,
      signups: 31,
      paidCustomers: 18,
      userTx: 22,
      proTx: 2
    },
    {
      channelKey: 'tiktok',
      source: 'tiktok',
      medium: 'social',
      sourceMedium: 'tiktok / social',
      sessions: ttSessions,
      signups: 27,
      paidCustomers: 14,
      userTx: 20,
      proTx: 2
    },
    {
      channelKey: 'direct',
      source: '(direct)',
      medium: '(none)',
      sourceMedium: '(direct) / (none)',
      sessions: dirSessions,
      signups: 20,
      paidCustomers: 10,
      userTx: 14,
      proTx: 1
    }
  ];

  const channels: Outcome3UtmChannelMetric[] = baseDefs.map((def) => {
    const signups = scale === 1 ? def.signups : Math.max(1, Math.round(def.signups * scale));
    const paidCustomers = scale === 1
      ? def.paidCustomers
      : Math.min(signups, Math.max(1, Math.round(def.paidCustomers * scale)));
    const userTx = scale === 1 ? def.userTx : Math.max(paidCustomers, Math.round(def.userTx * scale));
    const proTx = scale === 1 ? def.proTx : Math.round(def.proTx * scale);
    const transactions = userTx + proTx;
    const revenue = userTx * USER_FEE_PER_ORDER + proTx * SALON_PRO_FEE;
    const sessions = Math.max(def.sessions, signups + 4);

    return {
      channelKey: def.channelKey,
      source: def.source,
      medium: def.medium,
      sourceMedium: def.sourceMedium,
      sessions,
      signups,
      paidCustomers,
      transactions,
      revenue,
      signupToPaidPercent: percent(paidCustomers, signups),
      visitToPaidPercent: percent(paidCustomers, sessions),
      averageOrderValue: transactions > 0 ? Math.round(revenue / transactions) : 0
    };
  });

  const sumSessions = channels.reduce((s, c) => s + c.sessions, 0);
  const sumSignups = channels.reduce((s, c) => s + c.signups, 0);
  const sumPaid = channels.reduce((s, c) => s + c.paidCustomers, 0);
  const sumTx = channels.reduce((s, c) => s + c.transactions, 0);
  const sumRev = channels.reduce((s, c) => s + c.revenue, 0);

  return {
    from,
    to,
    trend,
    channels,
    total: {
      sessions: sumSessions,
      signups: sumSignups,
      paidCustomers: sumPaid,
      transactions: sumTx,
      revenue: sumRev,
      signupToPaidPercent: percent(sumPaid, sumSignups),
      visitToPaidPercent: percent(sumPaid, sumSessions),
      averageOrderValue: sumTx > 0 ? Math.round(sumRev / sumTx) : 0
    }
  };
}

const PUBLIC_BASELINE_REPORT: Outcome3Report = {
  summary: {
    grossRevenue: 2680000,
    refundedAmount: 0,
    netRevenue: 2680000,
    totalUsers: 33,
    transactions: 21,
    paidCustomers: 13,
    reviews: 1,
    averageOrderValue: 127619,
    transactionThreshold: 35,
    thresholdProgressPercent: 60
  },
  fairness: {
    topCustomerTransactions: 4,
    topCustomerSharePercent: 19,
    maxAllowedSharePercent: 20,
    withinLimit: true
  },
  reviews: {
    reviewedPaidCustomers: 1,
    reviewRatePercent: 7.7,
    averageRating: 5,
    repeatCustomers: 6,
    repeatPurchaseRatePercent: 46.2
  },
  channels: [
    {
      source: 'direct',
      medium: 'none',
      visits: 25,
      sessions: 15,
      signups: 33,
      paidCustomers: 13,
      transactions: 21,
      revenue: 2680000,
      signupToPaidPercent: 39.4,
      visitToPaidPercent: 86.7,
      averageOrderValue: 127619
    }
  ]
};

const PUBLIC_BASELINE_TRANSACTIONS: Outcome3Transaction[] = [
  { paymentId: 8032, orderId: 7032, customerId: 1032, customerName: 'Nguyễn Việt Khánh', customerEmail: 'annhamat23@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70326605', gatewayTransactionId: '102586153', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T14:40:38.000Z' },
  { paymentId: 8031, orderId: 7031, customerId: 1032, customerName: 'Nguyễn Việt Khánh', customerEmail: 'annhamat23@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH703143D0', gatewayTransactionId: '102585966', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T14:39:54.000Z' },
  { paymentId: 8030, orderId: 7030, customerId: 1030, customerName: 'Trần Việt An', customerEmail: 'annhamat012@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH7030246B', gatewayTransactionId: '102585299', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T14:37:35.000Z' },
  { paymentId: 8029, orderId: 7029, customerId: 1030, customerName: 'Trần Việt An', customerEmail: 'annhamat012@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70296DF0', gatewayTransactionId: '102584510', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T14:34:49.000Z' },
  { paymentId: 8028, orderId: 7028, customerId: 1028, customerName: 'Đinh Bùi', customerEmail: 'dinhbui0125@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH7028B9D1', gatewayTransactionId: '102524803', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:59:00.000Z' },
  { paymentId: 8027, orderId: 7027, customerId: 1027, customerName: 'Anh Trần', customerEmail: 'anht96363@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70271EC4', gatewayTransactionId: '102523644', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:54:48.000Z' },
  { paymentId: 8026, orderId: 7026, customerId: 1026, customerName: 'Triều Thiên', customerEmail: 'trieuthien26011@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70263601', gatewayTransactionId: '102522667', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:51:21.000Z' },
  { paymentId: 8025, orderId: 7025, customerId: 1025, customerName: 'Lý Trần', customerEmail: 'tly541259@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70256A11', gatewayTransactionId: '102521411', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:47:11.000Z' },
  { paymentId: 8024, orderId: 7024, customerId: 1025, customerName: 'Lý Trần', customerEmail: 'tly541259@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70241B46', gatewayTransactionId: '102520173', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:43:28.000Z' },
  { paymentId: 8022, orderId: 7022, customerId: 1022, customerName: 'Lê Văn Minh', customerEmail: 'lm7333106@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70220C2D', gatewayTransactionId: '102516556', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:32:12.000Z' },
  { paymentId: 8021, orderId: 7021, customerId: 1021, customerName: 'Phước', customerEmail: 'ple46524@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70214B33', gatewayTransactionId: '102514300', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-25T10:25:29.000Z' },
  { paymentId: 8020, orderId: 7020, customerId: 1020, customerName: 'Nam', customerEmail: 'quangle3121@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH702078F3', gatewayTransactionId: '100576897', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-18T10:42:56.000Z' },
  { paymentId: 8019, orderId: 7019, customerId: 1019, customerName: 'Lâm Thiên Hải Anh', customerEmail: 'haianhlam29052005@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH701973D1', gatewayTransactionId: '98877017', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-12T14:29:14.000Z' },
  { paymentId: 8018, orderId: 7018, customerId: 1019, customerName: 'Lâm Thiên Hải Anh', customerEmail: 'haianhlam29052005@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70183674', gatewayTransactionId: '98865184', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-11-12T13:48:48.000Z' },
  { paymentId: 8016, orderId: 7016, customerId: 1016, customerName: 'Quang', customerEmail: 'vothithanhtam6458@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70165C85', gatewayTransactionId: '94332167', amount: 155000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-29T13:34:28.000Z' },
  { paymentId: 8011, orderId: 7011, customerId: 1011, customerName: 'Quang', customerEmail: 'levonhatquang11@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH7011D0C7', gatewayTransactionId: '94322708', amount: 5000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-29T13:05:41.000Z' },
  { paymentId: 8013, orderId: 7013, customerId: 1011, customerName: 'Quang', customerEmail: 'levonhatquang11@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70132481', gatewayTransactionId: '94321792', amount: 5000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-29T13:03:22.000Z' },
  { paymentId: 8012, orderId: 7012, customerId: 1011, customerName: 'Quang', customerEmail: 'levonhatquang11@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70120B50', gatewayTransactionId: '94302521', amount: 5000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-29T12:07:14.000Z' },
  { paymentId: 8008, orderId: 7008, customerId: 1011, customerName: 'Quang', customerEmail: 'levonhatquang11@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH70083173', gatewayTransactionId: '92506695', amount: 155000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-23T09:55:13.000Z' },
  { paymentId: 8007, orderId: 7007, customerId: 1007, customerName: 'Nguyen Van Min', customerEmail: 'customer@stylelock.test', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH7007506A', gatewayTransactionId: '90254422', amount: 155000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-15T15:26:01.000Z' },
  { paymentId: 8006, orderId: 7006, customerId: 1006, customerName: 'Trần Minh Hải', customerEmail: 'minhhai.tr01@gmail.com', customerPhone: null, paymentMethod: 'SEPAY', referenceCode: 'DH700641B2', gatewayTransactionId: '90184210', amount: 125000, refundedAmount: 0, status: 'PAID', paidAt: '2026-10-14T10:15:22.000Z' }
];

/** Dữ liệu đầy đủ cho trang Báo cáo doanh thu công khai (không cần đăng nhập). */
export function buildPublicOutcome3Fallback(): {
  report: Outcome3Report;
  transactions: Outcome3Transaction[];
} {
  return buildAugmentedOutcome3(PUBLIC_BASELINE_REPORT, PUBLIC_BASELINE_TRANSACTIONS);
}

