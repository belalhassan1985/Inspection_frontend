import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/dashboard/KpiCard';

interface SlaSummary {
  total: number;
  normal: number;
  atRisk: number;
  overdue: number;
  avgForwardingLag: number | null;
  avgProcessingLag: number | null;
  avgProcessingDuration: number | null;
  avgVerificationDuration: number | null;
  avgClosureDuration: number | null;
  avgTotalAge: number;
  avgOverdueDays: number;
}

interface Milestones {
  forwardingLag: number | null;
  processingLag: number | null;
  processingDuration: number | null;
  verificationDuration: number | null;
  closureDuration: number | null;
}

interface SlaPerMilestone {
  forwarding: string | null;
  processingStart: string | null;
  resolution: string | null;
  verification: string | null;
  closure: string | null;
}

interface SlaMetric {
  trackingId: string;
  recommendationNumber: string;
  status: string;
  riskLevel: string;
  dueDate: string | null;
  milestones: Milestones;
  totalAge: number;
  overdueDays: number;
  slaPerMilestone: SlaPerMilestone;
  overallSla: string;
}

const statusLabels: Record<string, string> = {
  ISSUED: 'صادرة',
  FORWARDED: 'محالة',
  UNDER_PROCESSING: 'قيد المعالجة',
  PARTIALLY_COMPLETED: 'منجز جزئياً',
  COMPLETED: 'منجزة من الجهة',
  VERIFIED: 'تم التحقق',
  CLOSED: 'مغلقة',
  NEEDS_CLARIFICATION: 'بحاجة توضيح',
  REJECTED: 'مرفوضة',
  OVERDUE: 'متأخرة',
};

const statusColors: Record<string, string> = {
  ISSUED: '#6b7280',
  FORWARDED: '#3b82f6',
  UNDER_PROCESSING: '#f59e0b',
  PARTIALLY_COMPLETED: '#8b5cf6',
  COMPLETED: '#10b981',
  VERIFIED: '#06b6d4',
  CLOSED: '#0c2340',
  NEEDS_CLARIFICATION: '#f97316',
  REJECTED: '#ef4444',
  OVERDUE: '#dc2626',
};

const slaColors: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'عادي', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  at_risk: { label: 'معرض للتأخير', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  overdue: { label: 'متأخر', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export const SlaDashboard: React.FC = () => {
  const [summary, setSummary] = useState<SlaSummary | null>(null);
  const [metrics, setMetrics] = useState<SlaMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, metricsRes] = await Promise.all([
        apiFetch<SlaSummary>('/analytics/sla/summary'),
        apiFetch<SlaMetric[]>('/analytics/sla/metrics'),
      ]);
      setSummary(summaryRes);
      setMetrics(metricsRes || []);
    } catch (err) {
      console.error('Failed to fetch SLA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMetrics = metrics.filter((m) => {
    if (slaFilter !== 'all' && m.overallSla !== slaFilter) return false;
    if (searchQuery && !m.recommendationNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatDuration = (val: number | null) => (val !== null ? `${val} يوم` : '—');

  const SkeletonRow = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ flex: '1 1 200px', minWidth: '220px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', height: '100px', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', textAlign: 'right' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ color: '#0c2340', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          ⏱️ لوحة مؤشرات SLA
        </h1>
        <p style={{ color: '#718096', fontSize: '14px' }}>
          مراقبة التزام الجهات بمواعيد الاستحقاق ومؤشرات الأداء الزمني للتوصيات
        </p>
      </div>

      {loading ? (
        <SkeletonRow />
      ) : summary ? (
        <>
          {/* Row 1: SLA Status Distribution */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' }}>
            <KpiCard
              title="ضمن المهلة"
              value={summary.normal}
              icon="🟢"
              colorType="green"
              subtitle={`من أصل ${summary.total} توصية`}
              onClick={() => { setSlaFilter('normal'); setSearchQuery(''); }}
            />
            <KpiCard
              title="معرض للتأخير"
              value={summary.atRisk}
              icon="🟡"
              colorType="orange"
              subtitle={`من أصل ${summary.total} توصية`}
              onClick={() => { setSlaFilter('at_risk'); setSearchQuery(''); }}
            />
            <KpiCard
              title="متأخر"
              value={summary.overdue}
              icon="🔴"
              colorType="red"
              subtitle={`من أصل ${summary.total} توصية`}
              onClick={() => { setSlaFilter('overdue'); setSearchQuery(''); }}
            />
            <KpiCard
              title="إجمالي خروقات SLA"
              value={summary.overdue}
              icon="🚨"
              colorType="blue"
              subtitle={`جميع أنواع الخروقات`}
            />
          </div>

          {/* Row 2: Duration KPIs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
            <KpiCard
              title="متوسط عمر التوصية"
              value={formatDuration(summary.avgTotalAge)}
              icon="📅"
              colorType="gold"
              subtitle="من تاريخ الإصدار"
            />
            <KpiCard
              title="متوسط مدة الإحالة"
              value={formatDuration(summary.avgForwardingLag)}
              icon="📤"
              colorType="blue"
              subtitle="من الإصدار إلى الإحالة"
            />
            <KpiCard
              title="متوسط مدة المعالجة"
              value={formatDuration(summary.avgProcessingDuration)}
              icon="⚙️"
              colorType="orange"
              subtitle="من بدء المعالجة إلى الإنجاز"
            />
            <KpiCard
              title="متوسط أيام التأخير"
              value={formatDuration(summary.avgOverdueDays)}
              icon="⏰"
              colorType="red"
              subtitle="بعد تجاوز تاريخ الاستحقاق"
            />
          </div>
        </>
      ) : null}

      {/* Filters */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
      }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568', marginLeft: '8px' }}>
            حالة SLA:
          </label>
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              fontFamily: 'Cairo, sans-serif',
              minWidth: '140px',
              backgroundColor: '#f8fafc',
            }}
          >
            <option value="all">الكل</option>
            <option value="normal">عادي</option>
            <option value="at_risk">معرض للتأخير</option>
            <option value="overdue">متأخر</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568', marginLeft: '8px' }}>
            بحث:
          </label>
          <input
            type="text"
            placeholder="رقم التوصية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              fontFamily: 'Cairo, sans-serif',
              minWidth: '180px',
            }}
          />
        </div>
        <button
          onClick={() => { setSlaFilter('all'); setSearchQuery(''); }}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '13px',
            color: '#4a5568',
            marginRight: 'auto',
          }}
        >
          إعادة تعيين
        </button>
        <span style={{ fontSize: '12px', color: '#718096' }}>
          {filteredMetrics.length} توصية
        </span>
      </div>

      {/* SLA Metrics Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>رقم التوصية</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>مستوى الخطورة</th>
                <th style={thStyle}>حالة SLA</th>
                <th style={thStyle}>مدة الإحالة</th>
                <th style={thStyle}>مدة المعالجة</th>
                <th style={thStyle}>العمر</th>
                <th style={thStyle}>أيام التأخير</th>
                <th style={thStyle}>تاريخ الاستحقاق</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                    لا توجد توصيات مطابقة للفلترة
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m) => {
                  const sla = slaColors[m.overallSla] || slaColors.normal;
                  const riskColors: Record<string, string> = { CRITICAL: '#dc2626', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#10b981' };
                  return (
                    <tr key={m.trackingId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>
                        <Link to={`/recommendations/tracking/${m.trackingId}`} style={{ color: '#0c2340', fontWeight: 600, textDecoration: 'none' }}>
                          {m.recommendationNumber}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#ffffff',
                          backgroundColor: statusColors[m.status] || '#6b7280',
                        }}>
                          {statusLabels[m.status] || m.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: riskColors[m.riskLevel] || '#6b7280', fontWeight: 600, fontSize: '12px' }}>
                          {m.riskLevel === 'CRITICAL' ? 'حرج' : m.riskLevel === 'HIGH' ? 'عالي' : m.riskLevel === 'MEDIUM' ? 'متوسط' : m.riskLevel === 'LOW' ? 'منخفض' : m.riskLevel}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: sla.color,
                          backgroundColor: sla.bg,
                        }}>
                          {sla.label}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatDuration(m.milestones.forwardingLag)}</td>
                      <td style={tdStyle}>{formatDuration(m.milestones.processingDuration)}</td>
                      <td style={tdStyle}>{formatDuration(m.totalAge)}</td>
                      <td style={{ ...tdStyle, color: m.overdueDays > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                        {m.overdueDays > 0 ? `${m.overdueDays} يوم` : '—'}
                      </td>
                      <td style={{ ...tdStyle, color: '#4a5568' }}>
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString('ar-IQ') : '—'}
                      </td>
                      <td style={tdStyle}>
                        <Link
                          to={`/recommendations/tracking/${m.trackingId}`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textDecoration: 'none',
                            color: '#4a5568',
                          }}
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={fetchData}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#0c2340',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '14px',
          }}
        >
          🔄 تحديث البيانات
        </button>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 15px',
  textAlign: 'right',
  fontWeight: 'bold',
  color: '#4a5568',
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 15px',
  color: '#1a202c',
  fontSize: '13px',
};
