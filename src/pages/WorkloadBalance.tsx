import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { BalanceComparisonPanel } from '../components/workload/BalanceComparisonPanel';

export const WorkloadBalance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/inspector-workload/balance');
      setData(res);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات التوازن');
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
          <h1 className="page-title">⚖️ توازن أعباء العمل</h1>
          <p className="page-subtitle">مقارنة أعباء العمل بين المفتشين وتحديد فجوات التوزيع</p>
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
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل بيانات توازن أعباء العمل...</div>
      ) : data ? (
        <BalanceComparisonPanel
          mostLoaded={data.mostLoaded}
          leastLoaded={data.leastLoaded}
          departmentImbalance={data.departmentImbalance}
        />
      ) : null}
    </div>
  );
};
