import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const Inspectors: React.FC = () => {
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inspectors');
      setInspectors(data);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات المفتشين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName,
        department,
        phone: phone || undefined,
        notes: notes || undefined,
        isActive,
      };

      if (inspectorId) {
        await apiFetch(`/inspectors/${inspectorId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/inspectors', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ بيانات المفتش');
    }
  };

  const deleteInspector = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المفتش نهائياً من القوائم؟')) return;
    try {
      await apiFetch(`/inspectors/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حذف المفتش');
    }
  };

  const editInspector = (insp: any) => {
    setInspectorId(insp.id);
    setFullName(insp.fullName);
    setDepartment(insp.department || '');
    setPhone(insp.phone || '');
    setNotes(insp.notes || '');
    setIsActive(insp.isActive);
    setShowForm(true);
  };

  const resetForm = () => {
    setInspectorId(null);
    setFullName('');
    setDepartment('');
    setPhone('');
    setNotes('');
    setIsActive(true);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المفتشين وأعضاء اللجان</h1>
          <p className="page-subtitle">إضافة وتعديل بيانات الضباط والمفتشين الميدانيين المشتركين في لجان التفتيش</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          + إضافة مفتش جديد
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="card m-b-20" style={{ border: '2px solid var(--secondary-color)' }}>
          <h3>{inspectorId ? 'تعديل بيانات المفتش' : 'إضافة مفتش جديد'}</h3>
          <form onSubmit={handleSubmit} className="grid-2" style={{ marginTop: '15px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>الرتبة والاسم الكامل للضابط</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="مثال: العقيد علي جاسم" 
                required 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>المديرية / القسم التابع له</label>
              <input 
                type="text" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                placeholder="مثال: مديرية تفتيش بغداد الكرخ" 
                required 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>رقم الهاتف (اختياري)</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="مثال: 07700000000" 
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>ملاحظات إضافية (اختياري)</label>
              <input 
                type="text" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="أية ملاحظات أخرى..." 
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer' }}
              />
              <label style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>المفتش نشط (يمكن إدراجه في اللجان الجديدة)</label>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">إلغاء</button>
              <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }}>حفظ بيانات المفتش</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل المفتشين...</div>
      ) : (
        <div className="card">
          <h3>سجل المفتشين المعتمدين</h3>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'right' }}>الرتبة والاسم الكامل</th>
                <th style={{ textAlign: 'right' }}>المديرية / القسم</th>
                <th style={{ textAlign: 'right' }}>رقم الهاتف</th>
                <th style={{ textAlign: 'right' }}>ملاحظات</th>
                <th style={{ textAlign: 'center' }}>الحالة</th>
                <th style={{ textAlign: 'center', width: '180px' }}>خيارات</th>
              </tr>
            </thead>
            <tbody>
              {inspectors.map((insp) => (
                <tr key={insp.id}>
                  <td><strong>{insp.fullName}</strong></td>
                  <td>{insp.department || '—'}</td>
                  <td>{insp.phone || '—'}</td>
                  <td>{insp.notes || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${insp.isActive ? 'success' : 'danger'}`}>
                      {insp.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => editInspector(insp)}
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        تعديل ✏️
                      </button>
                      <button
                        onClick={() => deleteInspector(insp.id)}
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        حذف 🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {inspectors.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    لا يوجد مفتشون مسجلون حالياً. اضغط على "إضافة مفتش جديد" للبدء.
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
