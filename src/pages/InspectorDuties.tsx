import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { DutiesExpandableTable } from '../components/workload/DutiesExpandableTable';

export const InspectorDuties: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/inspector-workload/duties${departmentFilter ? `?department=${encodeURIComponent(departmentFilter)}` : ''}`);
      setData(res);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل سجل الواجبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter]);

  const departments = [...new Set(data.map((i: any) => i.department).filter(Boolean))];

  const totalDuties = data.reduce((sum: number, d: any) => sum + (d.duties?.length || 0), 0);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">📋 سجل الواجبات الحالية للمفتشين</h1>
          <p className="page-subtitle">عرض الواجبات الميدانية النشطة لكل مفتش حسب اللجان والمفتشيات</p>
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

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '13px' }}>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>👥</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{data.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>مفتش بواجبات نشطة</div>
          </div>
        </div>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📋</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{totalDuties}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>إجمالي الواجبات النشطة</div>
          </div>
        </div>
      </div>

      {/* Filter */}
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
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل سجل الواجبات...</div>
      ) : (
        <DutiesExpandableTable data={data} />
      )}
    </div>
  );
};
