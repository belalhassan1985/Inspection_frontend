import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { KpiCard } from '../components/dashboard/KpiCard';
import { InspectorCard } from '../components/workload/InspectorCard';
import { WorkloadTrendChart } from '../components/workload/WorkloadTrendChart';

const LEVEL_COLORS: Record<string, string> = {
  FREE: '#10b981',
  LIGHT: '#3b82f6',
  NORMAL: '#f59e0b',
  HEAVY: '#f97316',
  OVERLOADED: '#ef4444',
};

const LEVEL_LABELS: Record<string, string> = {
  FREE: 'متفرغ',
  LIGHT: 'خفيف',
  NORMAL: 'عادي',
  HEAVY: 'ثقيل',
  OVERLOADED: 'محمل فوق الطاقة',
};

export const InspectorWorkload: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedInspector, setSelectedInspector] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<any[] | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const loadTrend = async (inspectorId: string) => {
    setSelectedInspector(inspectorId);
    setTrendLoading(true);
    try {
      const data = await apiFetch(`/inspector-workload/history/${inspectorId}?days=60`);
      setTrendData(data);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sum, items] = await Promise.all([
        apiFetch('/inspector-workload/summary'),
        apiFetch(`/inspector-workload/list${departmentFilter ? `?department=${encodeURIComponent(departmentFilter)}` : ''}`),
      ]);
      setSummary(sum);
      setList(items);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات أعباء العمل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter]);

  const departments = [...new Set(list.map((i: any) => i.department).filter(Boolean))];

  const distItems = summary
    ? Object.entries(summary.distribution).map(([level, count]: any) => ({
        level, count, color: LEVEL_COLORS[level] || '#6b7280', label: LEVEL_LABELS[level] || level,
      }))
    : [];

  const maxDist = distItems.length > 0 ? Math.max(...distItems.map(d => d.count)) : 1;

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">📊 لوحة أعباء عمل المفتشين</h1>
          <p className="page-subtitle">مراقبة وتوزيع أعباء العمل على المفتشين الميدانيين</p>
        </div>
        <button onClick={loadData} className="btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          🔄 تحديث
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !summary ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل بيانات أعباء العمل...</div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
            <KpiCard title="إجمالي المفتشين" value={summary.totalInspectors} icon="👥" colorType="blue" subtitle="مفتش ميداني نشط" />
            <KpiCard title="متوسط عبء العمل" value={summary.avgWorkloadScore} icon="📊" colorType="gold" subtitle={`مستوى: ${LEVEL_LABELS[summary.avgWorkloadLevel] || summary.avgWorkloadLevel}`} />
            <KpiCard title="محملين فوق الطاقة" value={summary.distribution.OVERLOADED} icon="🔴" colorType="red" subtitle="بحاجة إلى إعادة توزيع" />
            <KpiCard title="متفرغين" value={summary.distribution.FREE} icon="🟢" colorType="green" subtitle="بدون واجبات حالية" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            {/* Distribution Chart */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>توزيع أعباء العمل</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {distItems.map((d) => (
                  <div key={d.level} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ minWidth: '80px', fontSize: '11px', fontWeight: 600, color: d.color }}>{d.label}</span>
                    <div style={{ flex: 1, height: '20px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${(d.count / maxDist) * 100}%`, height: '100%', backgroundColor: d.color, borderRadius: '10px', transition: 'width 0.5s', minWidth: d.count > 0 ? '24px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff' }}>{d.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Stats */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>إحصائيات الأقسام</h3>
              {summary.departmentStats.map((d: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}>
                  <span style={{ fontWeight: 500 }}>{d.department}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {d.inspectorCount} مفتش | متوسط {d.avgWorkload} | 
                    <span style={{ color: d.heavyOverloadedCount > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {' '}{d.heavyOverloadedCount} محمل
                    </span>
                  </span>
                </div>
              ))}
              {summary.departmentStats.length === 0 && (
                <div style={{ color: 'var(--text-light)', textAlign: 'center', padding: '15px', fontSize: '12px' }}>لا توجد أقسام</div>
              )}
            </div>
          </div>

          {/* Filter and Inspector Cards */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)' }}>القسم:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'Cairo, sans-serif' }}
            >
              <option value="">الكل</option>
              {departments.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{list.length} مفتش</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '12px' }}>
            {list.map((insp: any) => (
              <InspectorCard
                key={insp.inspectorId}
                fullName={insp.fullName}
                department={insp.department || '—'}
                workloadScore={insp.workloadScore}
                workloadLevel={insp.workloadLevel}
                totalParticipation={insp.totalParticipation}
                leaderCount={insp.leaderCount}
                deputyCount={insp.deputyCount}
                memberCount={insp.memberCount}
                inspectionCount={insp.inspectionCount}
                openRecommendationCount={insp.openRecommendationCount}
                onClick={() => navigate(`/inspectors/${insp.inspectorId}/profile`)}
              />
            ))}
          </div>

          {/* Trend Section */}
          <div className="card" style={{ padding: '20px', marginTop: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>
              اتجاه عبء العمل
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)' }}>المفتش:</label>
              <select
                value={selectedInspector || ''}
                onChange={(e) => { if (e.target.value) loadTrend(e.target.value); else { setSelectedInspector(null); setTrendData(null); } }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'Cairo, sans-serif', minWidth: '250px' }}
              >
                <option value="">اختر مفتشاً...</option>
                {list.map((insp: any) => (
                  <option key={insp.inspectorId} value={insp.inspectorId}>
                    {insp.fullName} ({insp.department || '—'})
                  </option>
                ))}
              </select>
            </div>
            {trendLoading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                جاري تحميل البيانات...
              </div>
            )}
            {!trendLoading && selectedInspector && (
              trendData && trendData.length > 0 ? (
                <WorkloadTrendChart data={trendData} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  لا توجد بيانات تاريخية كافية. قم بأخذ لقطة من لوحة الإدارة.
                </div>
              )
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
