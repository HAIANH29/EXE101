import { FormEvent, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { usePayT } from '../../payI18n';
import { adminApi } from '../../services/adminApi';
import { PaymentInfo } from '../../types/salon';

type FormState = {
  paymentId: string;
  refundAmount: string;
  refundReference: string;
  note: string;
};

const EMPTY: FormState = { paymentId: '', refundAmount: '', refundReference: '', note: '' };

export function AdminPayments() {
  const { money, dateTime } = useI18n();
  const at = useAdminT();
  const pt = usePayT();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [log, setLog] = useState<PaymentInfo[]>([]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);

    const paymentId = Number(form.paymentId);
    const refundAmount = Number(form.refundAmount);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      setError(pt('adPaymentId'));
      return;
    }
    if (!(refundAmount > 0)) {
      setError(pt('adRefundAmount'));
      return;
    }
    if (!window.confirm(pt('adRefundConfirm', { amount: money(refundAmount), id: paymentId }))) return;

    setSubmitting(true);
    try {
      const result = await adminApi.refundPayment(paymentId, {
        refundAmount,
        refundReference: form.refundReference.trim(),
        note: form.note.trim() || undefined
      });
      setLog((current) => [result, ...current]);
      setNotice(pt('adRefundSuccess', { id: paymentId }));
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{pt('adTabPayments')}</span>
          <h2>{pt('adRefundTitle')}</h2>
          <p>{pt('adRefundDesc')}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      <div className="two-column">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{pt('adRefundTitle')}</h3>
              <p>{pt('adRefundHelp')}</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={submit}>
            <label>
              {pt('adPaymentId')}
              <input
                value={form.paymentId}
                onChange={(event) => setForm({ ...form, paymentId: event.target.value })}
                type="number"
                min={1}
                required
              />
            </label>
            <label>
              {pt('adRefundAmount')}
              <input
                value={form.refundAmount}
                onChange={(event) => setForm({ ...form, refundAmount: event.target.value })}
                type="number"
                min={1}
                required
              />
            </label>
            <label className="full">
              {pt('adRefundReference')}
              <input
                value={form.refundReference}
                onChange={(event) => setForm({ ...form, refundReference: event.target.value })}
                required
              />
            </label>
            <label className="full">
              {pt('adRefundNote')}
              <textarea
                rows={3}
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
              />
            </label>
            <button className="solid-button" disabled={submitting}>
              {submitting ? pt('adRefundSubmitting') : pt('adRefundSubmit')}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{pt('adRefundLog')}</h3>
              <p>{log.length}</p>
            </div>
          </div>
          {log.length === 0 ? (
            <div className="empty-row">{pt('adRefundLogEmpty')}</div>
          ) : (
            <div className="appointments-table">
              {log.map((payment) => (
                <div className="table-row" key={`${payment.id}-${payment.refundedAt}`} style={{ gridTemplateColumns: '0.7fr 1fr 1fr 1.2fr' }}>
                  <span>
                    <b>#{payment.id}</b>
                    <small>{pt(`payType${payment.paymentType}`)}</small>
                  </span>
                  <span>
                    <b>{money(payment.refundAmount ?? 0)}</b>
                    <small>/ {money(payment.amount)}</small>
                  </span>
                  <span>
                    <span className="status-pill ok">{pt(`payStatus${payment.status}`)}</span>
                  </span>
                  <span>
                    <b>{payment.refundReference || '—'}</b>
                    <small>{payment.refundedAt ? `${pt('adRefundedAt')} ${dateTime(payment.refundedAt)}` : ''}</small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
