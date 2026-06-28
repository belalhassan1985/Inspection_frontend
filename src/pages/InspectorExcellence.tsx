import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { ExcellenceLeaderboard } from '../components/workload/ExcellenceLeaderboard';

export const InspectorExcellence: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/inspector-workload/excellence');
      setData(res);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات التميز');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🏆 لوحة التميز والنشاط</h1>
          <p className="page-subtitle">تصنيف المفتشين حسب الأداء والمساهمة في اللجان والمفتشيات</p>
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

      {loading && !data ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل بيانات التميز...</div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <ExcellenceLeaderboard
            title="أفضل قادة اللجان"
            icon="👑"
            data={data.topLeaders}
            valueKey="leadershipCount"
            valueLabel="قيادة"
            valueColor="#d4af37"
          />
          <ExcellenceLeaderboard
            title="أكثر المشاركين في اللجان"
            icon="👥"
            data={data.topParticipants}
            valueKey="campaignCount"
            valueLabel="حملة"
            valueColor="#3b82f6"
          />
          <ExcellenceLeaderboard
            title="أكثر المفتشين تنفيذاً للتفتيشات"
            icon="🔍"
            data={data.topInspections}
            valueKey="inspectionCount"
            valueLabel="مفتشية"
            valueColor="#f59e0b"
          />
          <ExcellenceLeaderboard
            title="أكثر المفتشين متابعة للتوصيات"
            icon="📋"
            data={data.topRecActivity}
            valueKey="actionLogCount"
            valueLabel="إجراء"
            valueColor="#8b5cf6"
          />
        </div>
      ) : null}
    </div>
  );
};
