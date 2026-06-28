import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface Category {
  id: number; name: string; description: string | null;
  sortOrder: number; isActive: boolean;
  specializations: SpecItem[];
}

interface SpecItem {
  id: number; categoryId: number; name: string; description: string | null;
  isActive: boolean; sortOrder: number;
}

export const Specializations: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', sortOrder: 0 });
  const [catEditId, setCatEditId] = useState<number | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  // Specialization form
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [specForm, setSpecForm] = useState({ categoryId: 0, name: '', description: '', sortOrder: 0 });
  const [specEditId, setSpecEditId] = useState<number | null>(null);
  const [specSaving, setSpecSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inspector-specializations/categories');
      const cats = Array.isArray(data) ? data : data?.value || [];
      setCategories(cats);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Category handlers
  const resetCatForm = () => {
    setCatForm({ name: '', description: '', sortOrder: 0 });
    setCatEditId(null);
  };

  const handleCatSubmit = async () => {
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    setError('');
    try {
      if (catEditId) {
        await apiFetch(`/inspector-specializations/categories/${catEditId}`, {
          method: 'PUT',
          body: JSON.stringify(catForm),
        });
      } else {
        await apiFetch('/inspector-specializations/categories', {
          method: 'POST',
          body: JSON.stringify(catForm),
        });
      }
      resetCatForm();
      setShowCatForm(false);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'فشل حفظ التصنيف');
    } finally {
      setCatSaving(false);
    }
  };

  const handleCatEdit = (cat: Category) => {
    setCatForm({ name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder });
    setCatEditId(cat.id);
    setShowCatForm(true);
  };

  const handleCatToggle = async (cat: Category) => {
    try {
      await apiFetch(`/inspector-specializations/categories/${cat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      await loadData();
    } catch (e: any) {
      setError(e.message || 'فشل تغيير حالة التصنيف');
    }
  };

  const handleCatDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    try {
      await apiFetch(`/inspector-specializations/categories/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e: any) {
      setError(e.message || 'فشل حذف التصنيف');
    }
  };

  // Specialization handlers
  const resetSpecForm = () => {
    setSpecForm({ categoryId: 0, name: '', description: '', sortOrder: 0 });
    setSpecEditId(null);
  };

  const handleSpecSubmit = async () => {
    if (!specForm.name.trim() || !specForm.categoryId) return;
    setSpecSaving(true);
    setError('');
    try {
      if (specEditId) {
        await apiFetch(`/inspector-specializations/${specEditId}`, {
          method: 'PUT',
          body: JSON.stringify(specForm),
        });
      } else {
        await apiFetch('/inspector-specializations', {
          method: 'POST',
          body: JSON.stringify(specForm),
        });
      }
      resetSpecForm();
      setShowSpecForm(false);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'فشل حفظ التخصص');
    } finally {
      setSpecSaving(false);
    }
  };

  const handleSpecEdit = (spec: SpecItem) => {
    setSpecForm({
      categoryId: spec.categoryId,
      name: spec.name,
      description: spec.description || '',
      sortOrder: spec.sortOrder,
    });
    setSpecEditId(spec.id);
    setShowSpecForm(true);
  };

  const handleSpecToggle = async (spec: SpecItem) => {
    try {
      await apiFetch(`/inspector-specializations/${spec.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !spec.isActive }),
      });
      await loadData();
    } catch (e: any) {
      setError(e.message || 'فشل تغيير حالة التخصص');
    }
  };

  const handleSpecDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التخصص؟')) return;
    try {
      await apiFetch(`/inspector-specializations/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e: any) {
      setError(e.message || 'فشل حذف التخصص');
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة التخصصات التفتيشية</h1>
          <p className="page-subtitle">إضافة وتعديل التصنيفات والتخصصات التفتيشية</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { resetCatForm(); setShowCatForm(true); setShowSpecForm(false); }} className="btn-primary" style={{ fontSize: '12px' }}>
            + إضافة تصنيف
          </button>
          <button onClick={() => { resetSpecForm(); setShowSpecForm(true); setShowCatForm(false); }} className="btn-primary" style={{ fontSize: '12px', backgroundColor: 'var(--primary-light)' }}>
            + إضافة تخصص
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Category Form */}
      {showCatForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>
            {catEditId ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>الاسم</label>
              <input value={catForm.name} onChange={(e) => setCatForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>الوصف</label>
              <input value={catForm.description} onChange={(e) => setCatForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>ترتيب العرض</label>
              <input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm(f => ({ ...f, sortOrder: +e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={handleCatSubmit} className="btn-primary" disabled={catSaving} style={{ fontSize: '13px' }}>
              {catSaving ? 'جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button onClick={() => { setShowCatForm(false); resetCatForm(); }} className="btn-outline" style={{ fontSize: '13px' }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Specialization Form */}
      {showSpecForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>
            {specEditId ? 'تعديل تخصص' : 'إضافة تخصص جديد'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>التصنيف</label>
              <select value={specForm.categoryId} onChange={(e) => setSpecForm(f => ({ ...f, categoryId: +e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}>
                <option value={0}>-- اختر التصنيف --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>الاسم</label>
              <input value={specForm.name} onChange={(e) => setSpecForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>ترتيب العرض</label>
              <input type="number" value={specForm.sortOrder} onChange={(e) => setSpecForm(f => ({ ...f, sortOrder: +e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>الوصف</label>
            <input value={specForm.description} onChange={(e) => setSpecForm(f => ({ ...f, description: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={handleSpecSubmit} className="btn-primary" disabled={specSaving} style={{ fontSize: '13px' }}>
              {specSaving ? 'جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button onClick={() => { setShowSpecForm(false); resetSpecForm(); }} className="btn-outline" style={{ fontSize: '13px' }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل التصنيفات...</div>
      ) : categories.length === 0 ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          لا توجد تصنيفات بعد. قم بإضافة تصنيف جديد للبدء.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ padding: '0', opacity: cat.isActive ? 1 : 0.5 }}>
              <div
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                style={{
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderBottom: expandedCat === cat.id ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px', color: expandedCat === cat.id ? 'var(--secondary-color)' : '#94a3b8' }}>
                    {expandedCat === cat.id ? '▼' : '▶'}
                  </span>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)' }}>{cat.name}</span>
                    <span style={{ marginRight: '10px', fontSize: '11px', color: '#94a3b8' }}>
                      ({cat.specializations?.length || 0} تخصصات)
                    </span>
                    {!cat.isActive && (
                      <span className="badge badge-warning" style={{ marginRight: '8px', fontSize: '10px' }}>غير نشط</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={(e) => { e.stopPropagation(); handleCatEdit(cat); }} className="btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }}>تعديل</button>
                  <button onClick={(e) => { e.stopPropagation(); handleCatToggle(cat); }} className="btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }}>
                    {cat.isActive ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleCatDelete(cat.id); }} className="btn-outline" style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}>حذف</button>
                </div>
              </div>

              {expandedCat === cat.id && (
                <div style={{ padding: '15px 20px 15px 45px' }}>
                  {(!cat.specializations || cat.specializations.length === 0) ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>لا توجد تخصصات في هذا التصنيف</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cat.specializations.map(spec => (
                        <div key={spec.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px',
                          opacity: spec.isActive ? 1 : 0.5,
                        }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{spec.name}</span>
                            {spec.description && (
                              <span style={{ marginRight: '10px', fontSize: '11px', color: '#94a3b8' }}>- {spec.description}</span>
                            )}
                            {!spec.isActive && (
                              <span className="badge badge-warning" style={{ marginRight: '8px', fontSize: '9px' }}>غير نشط</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleSpecEdit(spec)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '10px' }}>تعديل ✏️</button>
                            <button onClick={() => handleSpecToggle(spec)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '10px' }}>
                              {spec.isActive ? 'تعطيل' : 'تفعيل'}
                            </button>
                            <button onClick={() => handleSpecDelete(spec.id)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '10px', color: '#ef4444' }}>حذف 🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
