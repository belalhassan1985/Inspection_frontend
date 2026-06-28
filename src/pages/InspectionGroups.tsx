import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';

const readinessColor = (level: string) => {
  switch (level) {
    case 'READY': return '#10b981';
    case 'PARTIAL': return '#f59e0b';
    case 'CRITICAL': return '#ef4444';
    default: return '#6b7280';
  }
};

const readinessBg = (level: string) => {
  switch (level) {
    case 'READY': return 'rgba(16,185,129,0.1)';
    case 'PARTIAL': return 'rgba(245,158,11,0.1)';
    case 'CRITICAL': return 'rgba(239,68,68,0.1)';
    default: return 'transparent';
  }
};

const readinessLabel = (level: string) => {
  switch (level) {
    case 'READY': return 'جاهز';
    case 'PARTIAL': return 'جزئي';
    case 'CRITICAL': return 'حرج';
    default: return '—';
  }
};

export const InspectionGroups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [readinessMap, setReadinessMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [groupId, setGroupId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, readiness] = await Promise.all([
        apiFetch('/inspection-groups'),
        apiFetch('/inspection-groups/readiness').catch(() => []),
      ]);
      setGroups(data);
      const map: Record<number, any> = {};
      (readiness || []).forEach((r: any) => { map[r.groupId] = r; });
      setReadinessMap(map);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات الفرق');
    } finally {
      setLoading(false);
    }
  };

  const takeSnapshot = async () => {
    try {
      const result = await apiFetch('/inspection-groups/readiness/snapshot', { method: 'POST' });
      alert(result.message || 'تم أخذ لقطة الجاهزية');
      loadData();
    } catch (e: any) {
      setError(e.message || 'فشل أخذ لقطة الجاهزية');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name, code: code || undefined, description: description || undefined, sourceReference: sourceReference || undefined, isActive };
      if (groupId) {
        await apiFetch(`/inspection-groups/${groupId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/inspection-groups', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ بيانات الفرقة');
    }
  };

  const deleteGroup = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفرقة؟')) return;
    try {
      await apiFetch(`/inspection-groups/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حذف الفرقة');
    }
  };

  const editGroup = (g: any) => {
    setGroupId(g.id);
    setName(g.name);
    setCode(g.code || '');
    setDescription(g.description || '');
    setSourceReference(g.sourceReference || '');
    setIsActive(g.isActive);
    setShowForm(true);
  };

  const resetForm = () => {
    setGroupId(null);
    setName(''); setCode(''); setDescription(''); setSourceReference(''); setIsActive(true);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الفرق التفتيشية</h1>
          <p className="page-subtitle">إنشاء وإدارة الفرق التفتيشية الدائمة وتوزيع الأعضاء</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={takeSnapshot} className="btn-outline" style={{ padding: '10px 18px' }}>📸 أخذ لقطة جاهزية</button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ إضافة فرقة جديدة</button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {showForm && (
        <div className="card m-b-20" style={{ border: '2px solid var(--secondary-color)' }}>
          <h3>{groupId ? 'تعديل بيانات الفرقة' : 'إضافة فرقة جديدة'}</h3>
          <form onSubmit={handleSubmit} className="grid-2" style={{ marginTop: '15px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>اسم الفرقة</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فرقة تفتيش بغداد" required />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>كود الفرقة (اختياري)</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: BGD-01" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontWeight: 'bold' }}>الوصف (اختياري)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر لمهام الفرقة..." rows={3} />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>مرجع المصدر (اختياري)</label>
              <input type="text" value={sourceReference} onChange={(e) => setSourceReference(e.target.value)} placeholder="رقم الأمر الإداري أو المصدر" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer' }} />
              <label style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>الفرقة نشطة</label>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">إلغاء</button>
              <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }}>حفظ</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل الفرق...</div>
      ) : (
        <div className="card">
          <h3>الفرق التفتيشية الدائمة</h3>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'right' }}>الاسم</th>
                <th style={{ textAlign: 'right' }}>الكود</th>
                <th style={{ textAlign: 'right' }}>الوصف</th>
                <th style={{ textAlign: 'center' }}>عدد الأعضاء</th>
                <th style={{ textAlign: 'center' }}>الجاهزية</th>
                <th style={{ textAlign: 'center' }}>الحالة</th>
                <th style={{ textAlign: 'center', width: '200px' }}>خيارات</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td><strong>{g.name}</strong></td>
                  <td>{g.code || '—'}</td>
                  <td>{g.description || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{g.memberCount}</td>
                  <td style={{ textAlign: 'center' }}>
                    {readinessMap[g.id] ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 12px', borderRadius: '20px',
                        backgroundColor: readinessBg(readinessMap[g.id].readinessLevel),
                        color: readinessColor(readinessMap[g.id].readinessLevel),
                        fontWeight: 600, fontSize: '12px',
                      }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: readinessColor(readinessMap[g.id].readinessLevel),
                          display: 'inline-block',
                        }} />
                        {readinessMap[g.id].readinessScore}% — {readinessLabel(readinessMap[g.id].readinessLevel)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${g.isActive ? 'success' : 'danger'}`}>{g.isActive ? 'نشطة' : 'معطلة'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => navigate(`/inspection-groups/${g.id}`)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>إدارة الأعضاء</button>
                      <button onClick={() => editGroup(g)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>تعديل ✏️</button>
                      <button onClick={() => deleteGroup(g.id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>حذف 🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    لا توجد فرق تفتيشية مسجلة حالياً.
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
