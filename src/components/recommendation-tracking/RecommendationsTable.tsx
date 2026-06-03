import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { RiskLevelOption } from '../../services/riskLevelService';
import { getRiskLevelDisplay } from '../../services/riskLevelService';

type RecommendationStatus =
  | 'ISSUED'
  | 'FORWARDED'
  | 'UNDER_PROCESSING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'NEEDS_CLARIFICATION'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REJECTED'
  | 'OVERDUE';

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ImpactCategory =
  | 'SECURITY'
  | 'OPERATIONAL'
  | 'ADMINISTRATIVE'
  | 'FINANCIAL'
  | 'HUMAN_RESOURCES'
  | 'LOGISTICAL'
  | 'TECHNICAL'
  | 'LEGAL';

export interface TrackingRecord {
  id: string;
  recommendationNumber: string;
  assignedEntityNameSnapshot: string;
  status: RecommendationStatus;
  progressPercent: number;
  riskLevel: RiskLevel;
  impactCategory: ImpactCategory;
  escalationLevel: number;
  dueDate: string | null;
  recommendation: {
    recommendationText: string;
  };
  campaign: {
    name: string;
  };
}

interface RecommendationsTableProps {
  data: TrackingRecord[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  riskLevelOptions: RiskLevelOption[];
}

// ————————————— Helpers —————————————

const STATUS_CONFIG: Record<
  RecommendationStatus,
  { label: string; color: string; bg: string }
> = {
  ISSUED: { label: 'صادرة', color: '#718096', bg: 'rgba(113,128,150,0.1)' },
  FORWARDED: { label: 'محالة', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  UNDER_PROCESSING: { label: 'قيد المعالجة', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  PARTIALLY_COMPLETED: { label: 'منجزة جزئياً', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  COMPLETED: { label: 'منجزة من الجهة', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  NEEDS_CLARIFICATION: { label: 'بحاجة توضيح', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  VERIFIED: { label: 'تم التحقق', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  CLOSED: { label: 'مغلقة', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  REJECTED: { label: 'مرفوضة', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  OVERDUE: { label: 'متأخرة', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const IMPACT_CONFIG: Record<ImpactCategory, { label: string }> = {
  SECURITY: { label: 'أمني' },
  OPERATIONAL: { label: 'تشغيلي' },
  ADMINISTRATIVE: { label: 'إداري' },
  FINANCIAL: { label: 'مالي' },
  HUMAN_RESOURCES: { label: 'موارد بشرية' },
  LOGISTICAL: { label: 'لوجستي' },
  TECHNICAL: { label: 'تقني' },
  LEGAL: { label: 'قانوني' },
};

const Badge: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      backgroundColor: bg,
      color,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const color = clamped < 30 ? '#ef4444' : clamped < 70 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
      <div
        style={{
          flex: 1,
          height: '8px',
          backgroundColor: '#edf2f7',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '32px' }}>
        {clamped}%
      </span>
    </div>
  );
};

const EscalationBadge: React.FC<{ level: number }> = ({ level }) => {
  const config = [
    { icon: '🟢', label: 'طبيعي', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: '🟡', label: 'تنبيه', color: '#ca8a04', bg: 'rgba(202,138,4,0.08)' },
    { icon: '🟠', label: 'متابعة خاصة', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { icon: '🔴', label: 'تصعيد للقيادة', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  ];
  const c = config[Math.min(level, 3)];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        backgroundColor: c.bg,
        color: c.color,
        whiteSpace: 'nowrap',
      }}
    >
      {c.icon} {c.label}
    </span>
  );
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const isDateOverdue = (dateStr: string | null, status: RecommendationStatus) => {
  if (!dateStr || status === 'CLOSED' || status === 'VERIFIED') return false;
  return new Date(dateStr) < new Date();
};

// ————————————— Sorting Header —————————————

const SortableHeader: React.FC<{
  label: string;
  field: string;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (f: string) => void;
}> = ({ label, field, sortField, sortDir, onSort }) => (
  <th
    onClick={() => onSort(field)}
    style={{
      padding: '12px 14px',
      textAlign: 'right',
      fontWeight: 700,
      fontSize: '13px',
      color: sortField === field ? '#0c2340' : '#718096',
      backgroundColor: '#f7fafc',
      borderBottom: '2px solid #e2e8f0',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      transition: 'color 0.15s',
    }}
  >
    {label}
    {sortField === field && (
      <span style={{ marginRight: '4px', fontSize: '10px' }}>
        {sortDir === 'asc' ? '▲' : '▼'}
      </span>
    )}
  </th>
);

// ————————————— Table Skeleton —————————————

const TableSkeleton: React.FC = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 10 }).map((__, j) => (
          <td key={j} style={{ padding: '14px' }}>
            <div
              style={{
                height: '16px',
                backgroundColor: '#edf2f7',
                borderRadius: '6px',
                animation: 'pulse 1.5s ease-in-out infinite',
                width: `${60 + Math.random() * 40}%`,
              }}
            />
          </td>
        ))}
      </tr>
    ))}
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
  </>
);

// ————————————— Main Table —————————————

export const RecommendationsTable: React.FC<RecommendationsTableProps> = ({
  data,
  loading,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  sortField,
  sortDir,
  onSort,
  riskLevelOptions,
}) => {
  const navigate = useNavigate();

  const riskMap = React.useMemo(() => {
    const map: Record<string, RiskLevelOption> = {};
    for (const opt of riskLevelOptions) {
      map[opt.code] = opt;
    }
    return map;
  }, [riskLevelOptions]);

  const thStyle: React.CSSProperties = {
    padding: '12px 14px',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: '13px',
    color: '#718096',
    backgroundColor: '#f7fafc',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '13px 14px',
    borderBottom: '1px solid #edf2f7',
    fontSize: '13px',
    color: '#1a202c',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0', minWidth: 0 }}>
      {/* Table Wrapper */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
            <thead>
              <tr>
                <SortableHeader label="رقم التوصية" field="recommendationNumber" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                <th style={thStyle}>مضمون التوصية</th>
                <th style={thStyle}>الجهة المعنية</th>
                <th style={thStyle}>الحملة التفتيشية</th>
                <SortableHeader label="الحالة" field="status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                <th style={thStyle}>نسبة التقدم</th>
                <SortableHeader label="مستوى الخطورة" field="riskLevel" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                <th style={thStyle}>تصنيف الأثر</th>
                <SortableHeader label="تاريخ الاستحقاق" field="dueDate" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                <th style={thStyle}>مستوى التصعيد</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: '60px 20px',
                      textAlign: 'center',
                      color: '#718096',
                      fontSize: '14px',
                    }}
                  >
                    <div style={{ marginBottom: '8px', fontSize: '40px' }}>📭</div>
                    <div>لا توجد توصيات تطابق معايير البحث الحالية.</div>
                  </td>
                </tr>
              ) : (
                data.map((rec) => {
                  const statusCfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.ISSUED;
                  const riskCfg = getRiskLevelDisplay(riskMap, rec.riskLevel);
                  const impactCfg = IMPACT_CONFIG[rec.impactCategory];
                  const overdue = isDateOverdue(rec.dueDate, rec.status);

                  return (
                    <tr
                      key={rec.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8fbff')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent')
                      }
                    >
                      {/* رقم التوصية - رابط للتفاصيل */}
                      <td style={tdStyle}>
                        <button
                          onClick={() => navigate(`/recommendations/tracking/${rec.id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 800,
                            fontSize: '13px',
                            color: '#0c2340',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(12,35,64,0.06)',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            display: 'inline-block',
                            letterSpacing: '0.5px',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0c2340';
                            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(12,35,64,0.06)';
                            (e.currentTarget as HTMLButtonElement).style.color = '#0c2340';
                          }}
                          title="عرض تفاصيل التوصية"
                        >
                          {rec.recommendationNumber}
                        </button>
                      </td>

                      {/* مضمون التوصية */}
                      <td style={{ ...tdStyle, maxWidth: '220px' }}>
                        <div
                          title={rec.recommendation?.recommendationText || ''}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '220px',
                            fontSize: '13px',
                            color: '#1a202c',
                          }}
                        >
                          {rec.recommendation?.recommendationText || '—'}
                        </div>
                      </td>

                      {/* الجهة المعنية */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: '13px',
                            color: '#2d3748',
                            fontWeight: 600,
                          }}
                        >
                          {rec.assignedEntityNameSnapshot || '—'}
                        </span>
                      </td>

                      {/* الحملة */}
                      <td style={tdStyle}>
                        <span style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic' }}>
                          {rec.campaign?.name || '—'}
                        </span>
                      </td>

                      {/* الحالة */}
                      <td style={tdStyle}>
                        <Badge
                          label={statusCfg.label}
                          color={statusCfg.color}
                          bg={statusCfg.bg}
                        />
                      </td>

                      {/* نسبة التقدم */}
                      <td style={tdStyle}>
                        <ProgressBar percent={rec.progressPercent} />
                      </td>

                      {/* مستوى الخطورة */}
                      <td style={tdStyle}>
                        <Badge
                          label={riskCfg.label}
                          color={riskCfg.color}
                          bg={riskCfg.bg}
                        />
                      </td>

                      {/* تصنيف الأثر */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {impactCfg?.label || rec.impactCategory}
                        </span>
                      </td>

                      {/* تاريخ الاستحقاق */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: overdue ? 700 : 400,
                            color: overdue ? '#ef4444' : '#4a5568',
                          }}
                        >
                          {overdue && '⚠️ '}
                          {formatDate(rec.dueDate)}
                        </span>
                      </td>

                      {/* مستوى التصعيد */}
                      <td style={tdStyle}>
                        <EscalationBadge level={rec.escalationLevel} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with results count */}
        {!loading && (
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid #edf2f7',
              backgroundColor: '#f7fafc',
              fontSize: '12px',
              color: '#718096',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              إجمالي النتائج: <strong style={{ color: '#0c2340' }}>{totalItems}</strong> توصية
            </span>
            <span>
              الصفحة {currentPage} من {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="btn-outline"
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              fontFamily: 'Cairo, sans-serif',
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >
            «
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-outline"
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontFamily: 'Cairo, sans-serif',
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >
            السابق
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 7) {
              page = i + 1;
            } else if (currentPage <= 4) {
              page = i + 1;
            } else if (currentPage >= totalPages - 3) {
              page = totalPages - 6 + i;
            } else {
              page = currentPage - 3 + i;
            }
            if (page < 1 || page > totalPages) return null;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                style={{
                  padding: '7px 12px',
                  fontSize: '13px',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: currentPage === page ? 700 : 400,
                  backgroundColor: currentPage === page ? '#0c2340' : 'transparent',
                  color: currentPage === page ? '#fff' : '#4a5568',
                  border: `1px solid ${currentPage === page ? '#0c2340' : '#cbd5e0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minWidth: '36px',
                  transition: 'all 0.15s',
                }}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-outline"
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              fontFamily: 'Cairo, sans-serif',
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >
            التالي
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="btn-outline"
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              fontFamily: 'Cairo, sans-serif',
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};
