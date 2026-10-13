import { Share } from 'react-native';
import { Payment, PaymentStatus } from '../types';

export type PaymentStatusMeta = {
  label: string;
  color: string;
  background: string;
  title: string;
  description: string;
};

const STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  PENDING: {
    label: 'Chờ thanh toán',
    color: '#8A6A2F',
    background: '#F7EBD3',
    title: 'Đang chờ thanh toán',
    description: 'Chuyển khoản đúng số tiền và nội dung bên dưới. Hệ thống sẽ tự xác nhận sau khi nhận được tiền.'
  },
  PAID: {
    label: 'Đã thanh toán',
    color: '#3F7A52',
    background: '#E1F0E6',
    title: 'Thanh toán thành công',
    description: 'Chúng tôi đã nhận được khoản thanh toán của bạn.'
  },
  FAILED: {
    label: 'Thất bại',
    color: '#B65A4B',
    background: '#FBE7E1',
    title: 'Thanh toán thất bại',
    description: 'Giao dịch không thành công. Vui lòng liên hệ hỗ trợ nếu bạn đã bị trừ tiền.'
  },
  CANCELLED: {
    label: 'Đã huỷ',
    color: '#8A7B6B',
    background: '#ECE5DA',
    title: 'Thanh toán đã bị huỷ',
    description: 'Lịch hẹn đã bị huỷ nên khoản thanh toán này không còn hiệu lực. Đừng chuyển khoản vào mã này.'
  },
  REFUND_PENDING: {
    label: 'Chờ hoàn tiền',
    color: '#8A6A2F',
    background: '#F7EBD3',
    title: 'Đang xử lý hoàn tiền',
    description: 'Quản trị viên sẽ xác nhận và chuyển khoản hoàn tiền cho bạn.'
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    color: '#4B6E8A',
    background: '#E1ECF4',
    title: 'Đã hoàn tiền',
    description: 'Khoản thanh toán đã được hoàn lại cho bạn.'
  }
};

export function getPaymentStatusMeta(status: PaymentStatus): PaymentStatusMeta {
  return (
    STATUS_META[status] || {
      label: status,
      color: '#6F6255',
      background: '#ECE5DA',
      title: status,
      description: ''
    }
  );
}

export function getPaymentTypeLabel(payment: Pick<Payment, 'type'>) {
  return payment.type === 'SALON_PRO_SUBSCRIPTION' ? 'Gói Salon Pro' : 'Thanh toán lịch hẹn';
}

export function formatVnd(value: number | undefined) {
  return `${Math.round(value || 0).toLocaleString('vi-VN')} đ`;
}

export function formatDateTime(value: string | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Sao chép văn bản; trả về false khi thiết bị không hỗ trợ clipboard (sẽ mở hộp chia sẻ thay thế). */
export async function copyText(text: string): Promise<boolean> {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // rơi xuống chia sẻ
  }

  try {
    await Share.share({ message: text });
  } catch {
    // người dùng đóng hộp chia sẻ
  }
  return false;
}

/** Thanh toán còn cần khách chuyển khoản. */
export function isAwaitingPayment(payment: Pick<Payment, 'status'> | undefined) {
  return payment?.status === 'PENDING';
}
