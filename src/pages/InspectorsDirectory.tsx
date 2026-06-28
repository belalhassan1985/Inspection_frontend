import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { SpecializationBadge } from '../components/specializations/SpecializationBadge';

type SortKey = 'activityScore' | 'workloadScore' | 'fullName' | 'rank';

export const InspectorsDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterWorkload, setFilterWorkload] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [allSpecOptions, setAllSpecOptions] = useState<{ id: number; name: string; categoryName: string }[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortAsc, setSortAsc] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, specData] = await Promise.all([
        apiFetch('/inspectors-directory'),
        apiFetch('/inspector-specializations'),
      ]);
      setData(res);
      const specs = Array.isArray(specData) ? specData : specData?.value || [];
      const grouped = specs.map((s: any) => ({
        id: s.id,
        name: s.name,
        categoryName: s.category?.name || '',
      }));
      setAllSpecOptions(grouped);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل دليل المفتشين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const uniqueGroups = useMemo(() => {
    return [...new Set(data.map((d: any) => d.primaryGroup?.name).filter(Boolean))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((d: any) => {
      if (filterActive === 'active' && !d.isActive) return false;
      if (filterActive === 'inactive' && d.isActive) return false;
      if (filterGroup && d.primaryGroup?.name !== filterGroup) return false;
      if (filterWorkload && d.workloadLevel !== filterWorkload) return false;
      if (filterAvailability && d.availabilityStatus !== filterAvailability) return false;
      if (filterSpecialization && (!d._allSpecializations || !d._allSpecializations.includes(+filterSpecialization))) return false;
      if (q) {
        const name = (d.fullName || '').toLowerCase();
        const rank = (d.rank || '').toLowerCase();
        const group = (d.primaryGroup?.name || '').toLowerCase();
        if (!name.includes(q) && !rank.includes(q) && !group.includes(q)) return false;
      }
      return true;
    }).sort((a: any, b: any) => {
      let cmp = 0;
      if (sortKey === 'fullName') cmp = (a.fullName || '').localeCompare(b.fullName || '');
      else if (sortKey === 'rank') cmp = (a.rank || '').localeCompare(b.rank || '');
      else if (sortKey === 'activityScore') cmp = (a.activityScore || 0) - (b.activityScore || 0);
      else if (sortKey === 'workloadScore') cmp = (a.workloadScore || 0) - (b.workloadScore || 0);
      return sortAsc ? cmp : -cmp;
    });
  }, [data, search, filterGroup, filterWorkload, filterActive, sortKey, sortAsc]);

  const kpis = useMemo(() => {
    const total = data.length;
    const active = data.filter((d: any) => d.isActive).length;
    const free = data.filter((d: any) => d.workloadLevel === 'FREE').length;
    const heavy = data.filter((d: any) => d.workloadLevel === 'HEAVY').length;
    const overloaded = data.filter((d: any) => d.workloadLevel === 'OVERLOADED').length;
    return { total, active, free, heavy, overloaded };
  }, [data]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortAsc ? ' ↑' : ' ↓';
  };

  const WORKLOAD_LABELS: Record<string, string> = {
    FREE: 'بدون أعباء',
    LIGHT: 'خفيف',
    NORMAL: 'عادي',
    HEAVY: 'ثقيل',
    OVERLOADED: 'زائد',
  };

  const workloadBadge = (level: string) => {
    const colors: Record<string, string> = {
      FREE: '#27ae60', LIGHT: '#2ecc71', NORMAL: '#f39c12', HEAVY: '#e67e22', OVERLOADED: '#e74c3c',
    };
    return <span className="badge" style={{ backgroundColor: colors[level] || '#95a5a6', color: '#fff' }}>{WORKLOAD_LABELS[level] || level}</span>;
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">دليل المفتشين</h1>
          <p className="page-subtitle">دليل شامل لجميع المفتشين مع الأعباء والنشاط والفرق</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '15px', textAlign: 'center', borderRight: '4px solid var(--primary-color)' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{kpis.total}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>إجمالي المفتشين</div>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', borderRight: '4px solid #27ae60' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>{kpis.active}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>مفتشين نشطين</div>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', borderRight: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>{kpis.free}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>بدون أعباء</div>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', borderRight: '4px solid #e67e22' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>{kpis.heavy}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>أعباء عالية</div>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', borderRight: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>{kpis.overloaded}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>أعباء زائدة</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 بحث بالاسم أو الرتبة أو الفرقة..."
            style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
          />
          <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <option value="">كل الفرق</option>
            {uniqueGroups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterWorkload} onChange={(e) => setFilterWorkload(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <option value="">كل مستويات الأعباء</option>
            <option value="FREE">بدون أعباء</option>
            <option value="LIGHT">خفيف</option>
            <option value="NORMAL">عادي</option>
            <option value="HEAVY">ثقيل</option>
            <option value="OVERLOADED">زائد</option>
          </select>
          <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <option value="">كل حالات التوفر</option>
            <option value="AVAILABLE">متوفر</option>
            <option value="ON_LEAVE">إجازة</option>
            <option value="ON_MISSION">مأمورية</option>
            <option value="TRAINING">دورة تدريبية</option>
            <option value="MEDICAL">إجازة مرضية</option>
            <option value="UNAVAILABLE">غير متوفر</option>
          </select>
          <select value={filterSpecialization} onChange={(e) => setFilterSpecialization(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <option value="">كل التخصصات</option>
            {allSpecOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.categoryName ? `(${s.categoryName})` : ''}</option>
            ))}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <option value="all">الكل</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل الدليل...</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '50px' }}>الصورة</th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('rank')}>
                  الرتبة{sortIcon('rank')}
                </th>
                <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('fullName')}>
                  الاسم الكامل{sortIcon('fullName')}
                </th>
                <th style={{ textAlign: 'right' }}>الفرقة الرئيسية</th>
                <th style={{ textAlign: 'center' }}>التخصص الأساسي</th>
                <th style={{ textAlign: 'center' }}>حالة التوفر</th>
                <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('activityScore')}>
                  النشاط{sortIcon('activityScore')}
                </th>
                <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('workloadScore')}>
                  العبء{sortIcon('workloadScore')}
                </th>
                <th style={{ textAlign: 'center' }}>المستوى</th>
                <th style={{ textAlign: 'center' }}>الواجبات</th>
                <th style={{ textAlign: 'center' }}>آخر مشاركة</th>
                <th style={{ textAlign: 'center', width: '140px' }}>خيارات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d.id} style={{ opacity: d.isActive ? 1 : 0.5 }}>
                  <td style={{ textAlign: 'center' }}>
                    {d.photoUrl ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${d.photoUrl}`} alt=""
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextSibling; }}
                      />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#718096', margin: '0 auto' }}>
                        {(d.fullName || '—')[0]}
                      </div>
                    )}
                  </td>
                  <td>{d.rank || '—'}</td>
                  <td><strong>{d.fullName}</strong></td>
                  <td>{d.primaryGroup?.name || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {d.primarySpecialization ? (
                      <SpecializationBadge name={d.primarySpecialization.name} size="sm" />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}><AvailabilityBadge status={d.availabilityStatus} /></td>
                  <td style={{ textAlign: 'center' }}>{d.activityScore}</td>
                  <td style={{ textAlign: 'center' }}>{d.workloadScore}</td>
                  <td style={{ textAlign: 'center' }}>{workloadBadge(d.workloadLevel)}</td>
                  <td style={{ textAlign: 'center' }}>{d.activeDutiesCount}</td>
                  <td style={{ textAlign: 'center', fontSize: '12px' }}>
                    {d.lastFieldParticipationDays !== null ? `${d.lastFieldParticipationDays} يوم` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => navigate(`/inspectors/${d.id}/profile`)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }}>الملف</button>
                      <button onClick={() => navigate(`/dashboard/inspector-duties?inspectorId=${d.id}`)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }}>الواجبات</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    لا توجد نتائج تطابق معايير البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
