import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { usePayT } from '../../payI18n';
import { PaymentInfo } from '../../types/salon';

type PaymentPanelProps = {
  payment: PaymentInfo;
  /** Gọi lại API để lấy trạng thái mới nhất; trả về payment cập nhật. */
  refresh: () => Promise<PaymentInfo>;
  onUpdate: (payment: PaymentInfo) => void;
  onClose?: () => void;
};

const POLL_MS = 5000;

function readParam(url: string | null | undefined, name: string) {
  if (!url) return '';
  const match = url.match(new RegExp(`[?&]${name}=([^&]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const pt = usePayT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (await copy(copyValue ?? value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="pay-row">
      <div>
        <small>{label}</small>
        <strong>{value || '—'}</strong>
      </div>
      {copyValue !== undefined && value && (
        <button type="button" className="mini" onClick={() => void handleCopy()}>
          {copied ? pt('payCopied') : pt('payCopy')}
        </button>
      )}
    </div>
  );
}

/** Hiển thị QR + thông tin chuyển khoản, tự kiểm tra trạng thái khi còn chờ thanh toán. */
export function PaymentPanel({ payment, refresh, onUpdate, onClose }: PaymentPanelProps) {
  const { money, dateTime } = useI18n();
  const pt = usePayT();
  const [qrFailed, setQrFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string>();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const pending = payment.status === 'PENDING';

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(async () => {
      try {
        onUpdate(await refreshRef.current());
      } catch {
        // bỏ qua lỗi mạng tạm thời
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [pending, payment.id]);

  const checkNow = async () => {
    setChecking(true);
    setNotice(undefined);
    try {
      const latest = await refreshRef.current();
      onUpdate(latest);
      if (latest.status === 'PENDING') setNotice(pt('payNotYet'));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : pt('payLoadError'));
    } finally {
      setChecking(false);
    }
  };

  if (payment.status === 'PAID') {
    return (
      <div className="pay-panel pay-success">
        <span className="material-symbols-outlined">check_circle</span>
        <h3>{pt('payPaidTitle')}</h3>
        {payment.paidAt && <p>{pt('payPaidAt', { time: dateTime(payment.paidAt) })}</p>}
        <CopyRow label={pt('payAmount')} value={money(payment.amount)} />
        <CopyRow label={pt('payRef')} value={payment.referenceCode} />
        {payment.transactionId && <CopyRow label={pt('payTxn')} value={payment.transactionId} />}
        {onClose && (
          <button className="ghost-button" onClick={onClose}>{pt('subClose')}</button>
        )}
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="pay-panel">
        <h3>{pt(`payStatus${payment.status}`)}</h3>
        <CopyRow label={pt('payRef')} value={payment.referenceCode} />
        <CopyRow label={pt('payAmount')} value={money(payment.amount)} />
        {onClose && (
          <button className="ghost-button" onClick={onClose}>{pt('subClose')}</button>
        )}
      </div>
    );
  }

  const bank = readParam(payment.paymentUrl, 'bank');
  const account = readParam(payment.paymentUrl, 'acc');

  return (
    <div className="pay-panel">
      <div>
        <h3>{pt('payScanTitle')}</h3>
        <p>{pt('payScanDesc')}</p>
      </div>

      <div className="pay-layout">
        <div className="pay-qr">
          {payment.paymentUrl && !qrFailed ? (
            <img src={payment.paymentUrl} alt="VietQR" onError={() => setQrFailed(true)} />
          ) : (
            <div className="pay-qr-fallback">
              <span className="material-symbols-outlined">qr_code_2</span>
              <small>{pt('payQrFailed')}</small>
            </div>
          )}
          <strong>{money(payment.amount)}</strong>
        </div>

        <div className="pay-details">
          {bank && <CopyRow label={pt('payBank')} value={bank} />}
          {account && <CopyRow label={pt('payAccount')} value={account} copyValue={account} />}
          <CopyRow label={pt('payAmount')} value={money(payment.amount)} copyValue={String(Math.round(Number(payment.amount)))} />
          <CopyRow label={pt('payContent')} value={payment.referenceCode} copyValue={payment.referenceCode} />
          <div className="pay-warning">{pt('payContentWarning')}</div>
        </div>
      </div>

      <div className="pay-footer">
        <small>{pt('payAutoCheck')}</small>
        <div className="row-actions">
          <button className="solid-button" disabled={checking} onClick={() => void checkNow()}>
            {pt('payCheckNow')}
          </button>
          {onClose && (
            <button className="ghost-button" onClick={onClose}>{pt('subClose')}</button>
          )}
        </div>
      </div>
      {notice && <div className="error-banner">{notice}</div>}
    </div>
  );
}
