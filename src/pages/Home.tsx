import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PerformanceLeaders } from '../components/dashboard/PerformanceLeaders';
import { SectorBarChart } from '../components/dashboard/SectorBarChart';
import { RiskCenter } from '../components/dashboard/RiskCenter';

export const Home: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const summary = await apiFetch('/dashboard/executive/summary');
      setData(summary);
    } catch (e: any) {
      console.error('Failed to load dashboard metrics:', e);
      setError(e.message || 'حدث خطأ أثناء تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', direction: 'rtl' }}>
        <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏳</div>
        <div style={{ color: 'var(--text-secondary)' }}>جاري تحميل لوحة القيادة التنفيذية العليا...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', direction: 'rtl', color: 'var(--accent-color)' }}>
        ⚠️ {error || 'فشل الاتصال بالخادم، يرجى المحاولة لاحقاً.'}
        <br />
        <button onClick={loadDashboardData} className="btn-primary" style={{ marginTop: '15px' }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const { kpis, recommendations, performanceLeaders, sectorPerformance, riskEntities } = data;

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">لوحة القيادة التنفيذية العليا</h1>
          <p className="page-subtitle">نظام المتابعة التكتيكية والتقييم المؤسسي لوزارة الداخلية</p>
        </div>
        <button onClick={loadDashboardData} className="btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
          🔄 تحديث فوري
        </button>
      </div>

      {/* Row 1: KPI Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <KpiCard
          title="التقييم الأمني العام"
          value={`${kpis.overallCompliance}%`}
          icon="🏆"
          colorType="gold"
          subtitle="متوسط درجات التفتيش المعتمدة"
        />
        <KpiCard
          title="الحملات النشطة"
          value={`${kpis.activeCampaigns} حملات`}
          icon="📅"
          colorType="blue"
          subtitle="حملات تفتيش مستمرة حالياً"
        />
        <KpiCard
          title="نسبة الامتثال البشري"
          value={`${kpis.humanIntegrationRate}%`}
          icon="👥"
          colorType="green"
          subtitle="نسبة إشغال المناصب القيادية"
        />
        <KpiCard
          title="جاهزية آليات الوزارة"
          value={`${kpis.vehicleReadinessRate}%`}
          icon="🚒"
          colorType="orange"
          subtitle="نسبة الصلاحية من الجداول الميدانية"
        />
        <KpiCard
          title="تفتيشات قيد المراجعة"
          value={`${kpis.pendingInspections} تقارير`}
          icon="📝"
          colorType="red"
          subtitle="بانتظار تصديق واعتماد المسؤول"
        />
      </div>

      {/* Row 2: Sector Charts and Leaders */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: '20px',
          marginBottom: '25px',
        }}
      >
        <div>
          <SectorBarChart data={sectorPerformance} />
        </div>
        <div>
          <PerformanceLeaders best={performanceLeaders.best} worst={performanceLeaders.worst} />
        </div>
      </div>

      {/* Row 3: Risk Center and Recommendations Center */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '25px',
        }}
      >
        <div>
          <RiskCenter red={riskEntities.red} yellow={riskEntities.yellow} green={riskEntities.green} />
        </div>

        {/* Recommendations Center */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '350px' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)', fontSize: '16px' }}>📋 مركز معالجة ومتابعة التوصيات الرقابية</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              مراقبة حالة تنفيذ الواجبات والتكاليف المسجلة على مديريات الوزارة.
            </p>

            {/* Status breakdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '6px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>التوصيات المفتوحة النشطة</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{recommendations.open} واجب معلق</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>التوصيات المكتملة والمغلقة</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{recommendations.closed} مغلقة</div>
              </div>
            </div>

            {/* Top authorities */}
            <h4 style={{ margin: '15px 0 10px 0', fontSize: '13px', color: 'var(--primary-color)' }}>🏢 الجهات الأكثر تراخياً وامتلاكاً للتوصيات المعلقة</h4>
            {recommendations.topAuthorities.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-light)', padding: '20px 0', textAlign: 'center' }}>
                لا توجد توصيات رقابية مسجلة حالياً.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.topAuthorities.slice(0, 4).map((auth: any, index: number) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '12px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>
                      {index + 1}. {auth.authorityName}
                    </span>
                    <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                      {auth.count} توصية نشطة
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
            {/* Simple progress bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              <span>معدل حسم التوصيات الصادرة:</span>
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                {((recommendations.closed / (recommendations.open + recommendations.closed || 1)) * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#edf2f7', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(recommendations.closed / (recommendations.open + recommendations.closed || 1)) * 100}%`,
                  backgroundColor: '#10b981',
                  height: '100%',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
