import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import {
  Outcome3UtmAnalytics,
  Outcome3UtmChannelMetric,
  Outcome3UtmTrendPoint
} from '../../types/admin';

type DatePreset = '7d' | '28d' | '30d' | 'this_month' | 'custom';
type SeriesKey = 'facebook' | 'tiktok' | 'direct';
type SortField =
  | 'sourceMedium'
  | 'sessions'
  | 'signups'
  | 'paidCustomers'
  | 'transactions'
  | 'revenue'
  | 'signupToPaidPercent'
  | 'visitToPaidPercent'
  | 'averageOrderValue';
type SortDir = 'asc' | 'desc';

const SERIES_CONFIG: {
  key: SeriesKey;
  label: string;
  field: keyof Pick<Outcome3UtmTrendPoint, 'facebookSessions' | 'tiktokSessions' | 'directSessions'>;
  color: string;
}[] = [
  { key: 'facebook', label: 'Facebook', field: 'facebookSessions', color: '#3b6ea5' },
  { key: 'tiktok', label: 'TikTok', field: 'tiktokSessions', color: '#b65a4b' },
  { key: 'direct', label: 'Direct / None', field: 'directSessions', color: '#a97845' }
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getPresetRange(preset: Exclude<DatePreset, 'custom'>): { from: string; to: string } {
  const today = new Date();
  const to = toIsoDate(today);
  const start = new Date(today);
  if (preset === '7d') {
    start.setDate(today.getDate() - 6);
  } else if (preset === '28d') {
    start.setDate(today.getDate() - 27);
  } else if (preset === '30d') {
    start.setDate(today.getDate() - 29);
  } else {
    start.setDate(1);
  }
  return { from: toIsoDate(start), to };
}

function formatShortDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

function formatFullDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}₫`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function calcPercent(part: number, whole: number): number {
  return whole <= 0 ? 0 : Math.round((part * 1000) / whole) / 10;
}

function TrafficTrendChart({
  trend,
  loading
}: {
  trend: Outcome3UtmTrendPoint[];
  loading: boolean;
}) {
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    facebook: true,
    tiktok: true,
    direct: true
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggleSeries = (key: SeriesKey) => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.facebook && !next.tiktok && !next.direct) return prev;
      return next;
    });
  };

  const seriesTotals = useMemo(() => {
    return {
      facebook: trend.reduce((sum, pt) => sum + pt.facebookSessions, 0),
      tiktok: trend.reduce((sum, pt) => sum + pt.tiktokSessions, 0),
      direct: trend.reduce((sum, pt) => sum + pt.directSessions, 0)
    };
  }, [trend]);

  const width = 840;
  const height = 250;
  const pad = { top: 18, right: 20, bottom: 34, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxY = useMemo(() => {
    let max = 0;
    for (const pt of trend) {
      if (visibleSeries.facebook) max = Math.max(max, pt.facebookSessions);
      if (visibleSeries.tiktok) max = Math.max(max, pt.tiktokSessions);
      if (visibleSeries.direct) max = Math.max(max, pt.directSessions);
    }
    if (max <= 4) return 4;
    const step = Math.ceil(max / 4);
    return step * 4;
  }, [trend, visibleSeries]);

  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];

  const xAt = (idx: number) => {
    if (trend.length <= 1) return pad.left + plotW / 2;
    return pad.left + (idx / (trend.length - 1)) * plotW;
  };

  const yAt = (val: number) => pad.top + plotH - (val / maxY) * plotH;

  const xLabelIndices = useMemo(() => {
    if (trend.length === 0) return [];
    if (trend.length <= 7) return trend.map((_, i) => i);
    const desired = 6;
    const indices = new Set<number>([0, trend.length - 1]);
    for (let i = 1; i < desired - 1; i += 1) {
      indices.add(Math.round((i * (trend.length - 1)) / (desired - 1)));
    }
    return Array.from(indices).sort((a, b) => a - b);
  }, [trend]);

  const hoveredPoint = hoverIndex !== null ? trend[hoverIndex] : null;
  const tooltipLeftPercent =
    hoverIndex !== null && trend.length > 0
      ? ((xAt(hoverIndex) / width) * 100)
      : 50;

  return (
    <div className="g33-card">
      <div className="g33-card-head">
        <div>
          <h4>Xu hướng lưu lượng truy cập theo nguồn</h4>
          <span className="g33-card-sub">Phiên duy nhất theo ngày (First-Touch Attribution)</span>
        </div>
        <div className="g33-legend" role="group" aria-label="Chú giải nguồn truy cập">
          {SERIES_CONFIG.map((s) => {
            const active = visibleSeries[s.key];
            return (
              <button
                key={s.key}
                type="button"
                className={`g33-legend-item ${active ? 'active' : 'muted'}`}
                onClick={() => toggleSeries(s.key)}
                aria-pressed={active}
              >
                <span className="g33-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
                <b>{formatNumber(seriesTotals[s.key])}</b>
              </button>
            );
          })}
        </div>
      </div>

      {loading && trend.length === 0 ? (
        <div className="g33-state">Đang tải biểu đồ lưu lượng...</div>
      ) : trend.length === 0 ? (
        <div className="g33-state">Chưa có dữ liệu phiên truy cập trong khoảng thời gian đã chọn.</div>
      ) : (
        <div
          className="g33-chart-wrap"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <svg
            className="g33-chart-svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Biểu đồ đường xu hướng phiên truy cập theo nguồn Facebook, TikTok và Direct"
          >
            {/* Horizontal grid lines & Y axis */}
            {yTicks.map((tick) => {
              const y = yAt(tick);
              return (
                <g key={tick}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    stroke="#eadccb"
                    strokeDasharray={tick === 0 ? undefined : '3 4'}
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="g33-axis-text"
                  >
                    {Math.round(tick)}
                  </text>
                </g>
              );
            })}

            {/* X axis date labels */}
            {xLabelIndices.map((idx) => (
              <text
                key={idx}
                x={xAt(idx)}
                y={height - 10}
                textAnchor="middle"
                className="g33-axis-text"
              >
                {formatShortDate(trend[idx].date)}
              </text>
            ))}

            {/* Hover vertical guide */}
            {hoverIndex !== null && (
              <line
                x1={xAt(hoverIndex)}
                y1={pad.top}
                x2={xAt(hoverIndex)}
                y2={pad.top + plotH}
                stroke="#a97845"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* Series polylines */}
            {SERIES_CONFIG.map((s) => {
              if (!visibleSeries[s.key]) return null;
              const points = trend
                .map((pt, idx) => `${xAt(idx)},${yAt(pt[s.field])}`)
                .join(' ');
              return (
                <g key={s.key}>
                  <polyline
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.25}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points}
                  />
                  {trend.length <= 14 &&
                    trend.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={xAt(idx)}
                        cy={yAt(pt[s.field])}
                        r={hoverIndex === idx ? 4.5 : 2.5}
                        fill="#ffffff"
                        stroke={s.color}
                        strokeWidth={2}
                      />
                    ))}
                  {trend.length > 14 && hoverIndex !== null && (
                    <circle
                      cx={xAt(hoverIndex)}
                      cy={yAt(trend[hoverIndex][s.field])}
                      r={4.5}
                      fill="#ffffff"
                      stroke={s.color}
                      strokeWidth={2.25}
                    />
                  )}
                </g>
              );
            })}

            {/* Invisible interactive hover bands */}
            {trend.map((pt, idx) => {
              const bandW = trend.length <= 1 ? plotW : plotW / (trend.length - 1);
              const x = Math.max(pad.left, xAt(idx) - bandW / 2);
              const clampedW = Math.min(bandW, width - pad.right - x);
              return (
                <rect
                  key={pt.date}
                  x={x}
                  y={pad.top}
                  width={Math.max(4, clampedW)}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onFocus={() => setHoverIndex(idx)}
                />
              );
            })}
          </svg>

          {hoveredPoint && (
            <div
              className="g33-tooltip"
              style={{
                left: `${Math.min(78, Math.max(18, tooltipLeftPercent))}%`
              }}
            >
              <div className="g33-tooltip-date">{formatFullDate(hoveredPoint.date)}</div>
              {SERIES_CONFIG.map((s) =>
                visibleSeries[s.key] ? (
                  <div key={s.key} className="g33-tooltip-row">
                    <span>
                      <i className="g33-dot" style={{ background: s.color }} />
                      {s.label}
                    </span>
                    <b>{formatNumber(hoveredPoint[s.field])} phiên</b>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Outcome3UtmSection() {
  const initialRange = useMemo(() => getPresetRange('30d'), []);
  const [preset, setPreset] = useState<DatePreset>('30d');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(initialRange);
  const [customFrom, setCustomFrom] = useState<string>(initialRange.from);
  const [customTo, setCustomTo] = useState<string>(initialRange.to);

  const [data, setData] = useState<Outcome3UtmAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('sessions');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const fetchAnalytics = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await adminApi.getOutcome3UtmAnalytics(from, to);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu phân tích UTM.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics(dateRange.from, dateRange.to);
  }, [dateRange.from, dateRange.to, fetchAnalytics]);

  const handlePresetChange = (nextPreset: DatePreset) => {
    setPreset(nextPreset);
    setPage(0);
    if (nextPreset === 'custom') {
      setCustomFrom(dateRange.from);
      setCustomTo(dateRange.to);
      return;
    }
    const nextRange = getPresetRange(nextPreset);
    setCustomFrom(nextRange.from);
    setCustomTo(nextRange.to);
    setDateRange(nextRange);
  };

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) return;
    if (customFrom > customTo) {
      setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setPage(0);
    setDateRange({ from: customFrom, to: customTo });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'sourceMedium' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  const filteredAndSorted = useMemo(() => {
    const channels = data?.channels ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? channels.filter(
          (row) =>
            row.sourceMedium.toLowerCase().includes(q) ||
            row.source.toLowerCase().includes(q) ||
            row.medium.toLowerCase().includes(q)
        )
      : channels;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'sourceMedium') {
        cmp = a.sourceMedium.localeCompare(b.sourceMedium, 'vi');
      } else {
        cmp = Number(a[sortField]) - Number(b[sortField]);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data?.channels, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / rowsPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const visibleRows = filteredAndSorted.slice(
    safePage * rowsPerPage,
    (safePage + 1) * rowsPerPage
  );

  // Tổng cộng chỉ hiển thị khi không lọc tìm kiếm hoặc tính lại từ các kênh rời nhau (không bao giờ cộng %)
  const reconciledTotal = useMemo(() => {
    if (!data) return null;
    if (!search.trim()) return data.total;
    if (filteredAndSorted.length === 0) return null;
    const sessions = filteredAndSorted.reduce((s, r) => s + r.sessions, 0);
    const signups = filteredAndSorted.reduce((s, r) => s + r.signups, 0);
    const paidCustomers = filteredAndSorted.reduce((s, r) => s + r.paidCustomers, 0);
    const transactions = filteredAndSorted.reduce((s, r) => s + r.transactions, 0);
    const revenue = filteredAndSorted.reduce((s, r) => s + Number(r.revenue), 0);
    return {
      sessions,
      signups,
      paidCustomers,
      transactions,
      revenue,
      signupToPaidPercent: calcPercent(paidCustomers, signups),
      visitToPaidPercent: calcPercent(paidCustomers, sessions),
      averageOrderValue: transactions > 0 ? Math.round(revenue / transactions) : 0
    };
  }, [data, search, filteredAndSorted]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="g33-sort-icon muted">↕</span>;
    }
    return <span className="g33-sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const columns: { field: SortField; label: string; numeric?: boolean }[] = [
    { field: 'sourceMedium', label: 'Nguồn / Phương tiện' },
    { field: 'sessions', label: 'Phiên khác nhau', numeric: true },
    { field: 'signups', label: 'Đăng ký', numeric: true },
    { field: 'paidCustomers', label: 'Khách trả tiền', numeric: true },
    { field: 'transactions', label: 'Giao dịch', numeric: true },
    { field: 'revenue', label: 'Doanh thu', numeric: true },
    { field: 'signupToPaidPercent', label: 'Đăng ký → Trả tiền', numeric: true },
    { field: 'visitToPaidPercent', label: 'Truy cập → Trả tiền', numeric: true },
    { field: 'averageOrderValue', label: 'Giá trị đơn TB', numeric: true }
  ];

  const channelDotColor = (row: Outcome3UtmChannelMetric) => {
    return SERIES_CONFIG.find((s) => s.key === row.channelKey)?.color ?? '#a97845';
  };

  return (
    <div className="g33-section">
      {/* A. Section heading and date filter */}
      <div className="g33-header">
        <div>
          <span className="g33-eyebrow">G3.3 · TRAFFIC ACQUISITION</span>
          <h4 className="g33-title">Hiệu quả theo kênh (UTM)</h4>
          <p className="g33-desc">
            Phân tích lưu lượng truy cập, chuyển đổi và doanh thu theo nguồn marketing.
          </p>
        </div>

        <div className="g33-date-controls">
          <select
            className="g33-select"
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
            aria-label="Chọn khoảng thời gian"
          >
            <option value="7d">7 ngày gần nhất</option>
            <option value="28d">28 ngày gần nhất</option>
            <option value="30d">30 ngày gần nhất</option>
            <option value="this_month">Tháng này</option>
            <option value="custom">Tùy chỉnh khoảng thời gian</option>
          </select>

          {preset === 'custom' ? (
            <div className="g33-custom-range">
              <input
                type="date"
                className="g33-date-input"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                aria-label="Từ ngày"
              />
              <span className="g33-date-sep">–</span>
              <input
                type="date"
                className="g33-date-input"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                aria-label="Đến ngày"
              />
              <button
                type="button"
                className="solid-button g33-apply-btn"
                onClick={handleApplyCustomRange}
                disabled={loading}
              >
                Áp dụng
              </button>
            </div>
          ) : (
            <span className="g33-range-badge">
              {formatFullDate(dateRange.from)} – {formatFullDate(dateRange.to)}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner g33-error">
          <span>{error}</span>
          <button
            type="button"
            className="ghost-button mini"
            onClick={() => void fetchAnalytics(dateRange.from, dateRange.to)}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* B. Traffic trend chart */}
      <TrafficTrendChart trend={data?.trend ?? []} loading={loading} />

      {/* C. Traffic acquisition table */}
      <div className="g33-card">
        <div className="g33-card-head g33-table-head">
          <div>
            <h4>Chi tiết hiệu quả theo nguồn truy cập</h4>
            <span className="g33-card-sub">
              Phân bổ First-Touch · {formatFullDate(dateRange.from)} – {formatFullDate(dateRange.to)}
            </span>
          </div>

          <div className="g33-toolbar">
            <div className="g33-search-wrap">
              <span className="material-symbols-outlined">search</span>
              <input
                type="search"
                className="g33-search-input"
                placeholder="Tìm nguồn hoặc phương tiện..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            <label className="g33-rows-picker">
              <span>Hiển thị</span>
              <select
                className="g33-select g33-select-sm"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
              >
                {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} dòng
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="ghost-button g33-refresh-btn"
              onClick={() => void fetchAnalytics(dateRange.from, dateRange.to)}
              disabled={loading}
              title="Làm mới dữ liệu UTM"
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="g33-state">Đang tải bảng hiệu quả kênh UTM...</div>
        ) : visibleRows.length === 0 ? (
          <div className="g33-state">
            {search.trim()
              ? `Không tìm thấy nguồn truy cập khớp với "${search.trim()}".`
              : 'Chưa có dữ liệu nguồn truy cập trong khoảng thời gian đã chọn.'}
          </div>
        ) : (
          <div className="o3-table-wrap">
            <table className="o3-table g33-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.field} className={col.numeric ? 'num' : undefined}>
                      <button
                        type="button"
                        className={`g33-sort-btn ${col.numeric ? 'num' : ''}`}
                        onClick={() => handleSort(col.field)}
                      >
                        <span>{col.label}</span>
                        {renderSortIcon(col.field)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.channelKey}>
                    <td>
                      <div className="g33-channel-cell">
                        <span
                          className="g33-dot"
                          style={{ background: channelDotColor(row) }}
                        />
                        <b>{row.sourceMedium}</b>
                      </div>
                    </td>
                    <td className="num">{formatNumber(row.sessions)}</td>
                    <td className="num">{formatNumber(row.signups)}</td>
                    <td className="num">{formatNumber(row.paidCustomers)}</td>
                    <td className="num">{formatNumber(row.transactions)}</td>
                    <td className="num">
                      <b>{formatVnd(row.revenue)}</b>
                    </td>
                    <td className="num">{formatPercent(row.signupToPaidPercent)}</td>
                    <td className="num">{formatPercent(row.visitToPaidPercent)}</td>
                    <td className="num">{formatVnd(row.averageOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
              {reconciledTotal && (
                <tfoot>
                  <tr className="g33-total-row">
                    <td>
                      <strong>Tổng cộng</strong>
                    </td>
                    <td className="num">
                      <strong>{formatNumber(reconciledTotal.sessions)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatNumber(reconciledTotal.signups)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatNumber(reconciledTotal.paidCustomers)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatNumber(reconciledTotal.transactions)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatVnd(reconciledTotal.revenue)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatPercent(reconciledTotal.signupToPaidPercent)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatPercent(reconciledTotal.visitToPaidPercent)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatVnd(reconciledTotal.averageOrderValue)}</strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        <div className="g33-pager">
          <span className="g33-pager-info">
            {filteredAndSorted.length === 0
              ? '0 kết quả'
              : `Hiển thị ${safePage * rowsPerPage + 1}–${Math.min(
                  (safePage + 1) * rowsPerPage,
                  filteredAndSorted.length
                )} / ${filteredAndSorted.length} kênh`}
          </span>
          <div className="g33-pager-actions">
            <button
              type="button"
              className="ghost-button mini"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </button>
            <span className="g33-pager-page">
              Trang {safePage + 1}/{totalPages}
            </span>
            <button
              type="button"
              className="ghost-button mini"
              disabled={safePage + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

