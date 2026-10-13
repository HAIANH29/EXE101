import { useAdminT } from '../../adminI18n';

const TONE: Record<string, string> = {
  ACTIVE: 'ok',
  PENDING_APPROVAL: 'warn',
  INACTIVE: 'muted',
  BANNED: 'bad',
  DELETED: 'muted'
};

export function StatusPill({ status, label }: { status?: string; label: string }) {
  return <span className={`status-pill ${TONE[status || ''] || 'muted'}`}>{label}</span>;
}

type PagerProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pager({ page, totalPages, onChange }: PagerProps) {
  const at = useAdminT();
  if (totalPages <= 1) return null;

  return (
    <div className="admin-pager">
      <button className="ghost-button" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        {at('prev')}
      </button>
      <span>{at('pageOf', { page: page + 1, total: totalPages })}</span>
      <button className="ghost-button" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        {at('next')}
      </button>
    </div>
  );
}
