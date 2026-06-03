import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Committee/Campaign Types states
  const [types, setTypes] = useState<any[]>([]);
  const [typeLoading, setTypeLoading] = useState(true);
  const [typeError, setTypeError] = useState('');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [optionTypes, setOptionTypes] = useState<any[]>([]);
  const [optionTypeLoading, setOptionTypeLoading] = useState(true);
  const [optionTypeError, setOptionTypeError] = useState('');
  const [showOptionTypeForm, setShowOptionTypeForm] = useState(false);
  const [optionTypeForm, setOptionTypeForm] = useState({
    id: null as number | null,
    code: '',
    nameAr: '',
    nameEn: '',
    color: '#2a9d8f',
    icon: '',
    scoreMultiplier: '1.00',
    affectsScore: true,
    isActive: true,
  });

  const isAdminOrEditor = user?.role === 'ADMIN' || user?.role === 'EDITOR';
  const isAdmin = user?.role === 'ADMIN';

  // Types CRUD handlers
  const loadTypes = async () => {
    setTypeLoading(true);
    setTypeError('');
    try {
      const data = await apiFetch('/campaigns/types/all');
      setTypes(data);
    } catch (e: any) {
      setTypeError(e.message || 'فشل تحميل أنواع اللجان.');
    } finally {
      setTypeLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrEditor) {
      loadTypes();
      loadOptionTypes();
    }
  }, [user]);

  const loadOptionTypes = async () => {
    setOptionTypeLoading(true);
    setOptionTypeError('');
    try {
      const data = await apiFetch('/evaluation-option-types');
      setOptionTypes(data);
    } catch (e: any) {
      setOptionTypeError(e.message || 'فشل تحميل أنواع خيارات التقييم.');
    } finally {
      setOptionTypeLoading(false);
    }
  };

  const resetOptionTypeForm = () => {
    setOptionTypeForm({
      id: null,
      code: '',
      nameAr: '',
      nameEn: '',
      color: '#2a9d8f',
      icon: '',
      scoreMultiplier: '1.00',
      affectsScore: true,
      isActive: true,
    });
  };

  const editOptionType = (item: any) => {
    setOptionTypeForm({
      id: item.id,
      code: item.code || '',
      nameAr: item.nameAr || '',
      nameEn: item.nameEn || '',
      color: item.color || '#2a9d8f',
      icon: item.icon || '',
      scoreMultiplier: String(item.scoreMultiplier ?? '1.00'),
      affectsScore: item.affectsScore !== false,
      isActive: item.isActive !== false,
    });
    setShowOptionTypeForm(true);
  };

  const handleSaveOptionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !optionTypeForm.nameAr.trim()) return;

    // 2. Generate values automatically (UX Simplification)
    let generatedCode = optionTypeForm.code;
    if (!optionTypeForm.id) {
      // Logic for new types: create slug from Arabic name or generic note
      const timestamp = Date.now().toString().slice(-4);
      generatedCode = `custom_${timestamp}`;
    }

    const payload = {
      code: generatedCode.trim(),
      nameAr: optionTypeForm.nameAr.trim(),
      nameEn: optionTypeForm.nameEn.trim() || null,
      color: optionTypeForm.color || null,
      icon: optionTypeForm.icon.trim() || 'circle', // Default icon
      scoreMultiplier: Number(optionTypeForm.scoreMultiplier),
      affectsScore: optionTypeForm.affectsScore,
      isActive: optionTypeForm.isActive,
    };
    try {
      if (optionTypeForm.id) {
        await apiFetch(`/evaluation-option-types/${optionTypeForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/evaluation-option-types', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowOptionTypeForm(false);
      resetOptionTypeForm();
      loadOptionTypes();
    } catch (err: any) {
      // 6. User-friendly error messages
      let friendlyMsg = 'تعذر حفظ نوع التقييم، يرجى المحاولة مرة أخرى.';
      if (err.message?.includes('Unique constraint')) {
        friendlyMsg = 'يوجد نوع تقييم مسجل مسبقاً بنفس الاسم أو الكود.';
      } else if (err.message?.includes('required')) {
        friendlyMsg = 'يرجى إدخال جميع الحقول المطلوبة.';
      }
      setOptionTypeError(friendlyMsg);
    }
  };

  const handleToggleOptionType = async (item: any) => {
    if (!isAdmin) return;
    try {
      await apiFetch(`/evaluation-option-types/${item.id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      loadOptionTypes();
    } catch (err: any) {
      setOptionTypeError(err.message || 'فشل تغيير حالة نوع خيار التقييم.');
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    try {
      const payload = {
        name: typeName,
        key: typeKey.trim() || undefined,
      };

      if (typeId) {
        await apiFetch(`/campaigns/types/update/${typeId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/campaigns/types/create', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowTypeForm(false);
      resetTypeForm();
      loadTypes();
    } catch (err: any) {
      setTypeError(err.message || 'فشل حفظ نوع اللجنة.');
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف نوع اللجنة هذا؟ قد تظل اللجان المسجلة بهذا النوع محتفظة باسمه رمزياً.')) return;
    try {
      await apiFetch(`/campaigns/types/delete/${id}`, { method: 'DELETE' });
      loadTypes();
    } catch (err: any) {
      setTypeError(err.message || 'فشل حذف نوع اللجنة.');
    }
  };

  const editType = (t: any) => {
    setTypeId(t.id);
    setTypeName(t.name);
    setTypeKey(t.key);
    setShowTypeForm(true);
  };

  const resetTypeForm = () => {
    setTypeId(null);
    setTypeName('');
    setTypeKey('');
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">إعدادات القوائم والنظام</h1>
          <p className="page-subtitle">إدارة القوائم المنسدلة والخيارات الديناميكية للنظام العام</p>
        </div>
      </div>

      {!isAdminOrEditor ? (
        <div className="card text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
          ⚠️ عذراً، لا تمتلك الصلاحيات الأمنية الكافية للتحكم بإعدادات قوائم النظام. يرجى مراجعة المسؤول المباشر.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Campaign/Committee Types Management Card */}
          <div className="card" style={{ borderRight: '6px solid var(--primary-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>⚖️ فئات وأنواع اللجان التفتيشية</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  إدارة المسميات والرموز الخاصة بأنواع اللجان التي تظهر عند إنشاء اللجان التفتيشية
                </p>
              </div>
              {!showTypeForm && (
                <button 
                  onClick={() => { resetTypeForm(); setShowTypeForm(true); }} 
                  className="btn-primary" 
                  style={{ padding: '8px 15px', fontSize: '13px' }}
                >
                  + إضافة فئة لجنة جديدة
                </button>
              )}
            </div>

            {typeError && (
              <div style={{ backgroundColor: 'rgba(230,57,70,0.05)', color: 'var(--accent-color)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                ⚠️ {typeError}
              </div>
            )}

            {showTypeForm && (
              <form onSubmit={handleSaveType} style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>
                  {typeId ? 'تعديل بيانات فئة اللجنة' : 'إضافة فئة لجنة جديدة'}
                </h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>اسم نوع اللجنة (بالعربية)</label>
                    <input
                      type="text"
                      value={typeName}
                      onChange={(e) => setTypeName(e.target.value)}
                      placeholder="مثال: لجان التفتيش الأمني والتحقيق"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>الرمز التعريفي (Key - بالإنجليزية)</label>
                    <input
                      type="text"
                      value={typeKey}
                      onChange={(e) => setTypeKey(e.target.value)}
                      placeholder="مثال: security-investigation"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '15px' }}>
                  <button type="button" onClick={() => { setShowTypeForm(false); resetTypeForm(); }} className="btn-outline">إلغاء</button>
                  <button type="submit" className="btn-primary" style={{ padding: '6px 20px' }}>حفظ التعديلات</button>
                </div>
              </form>
            )}

            {typeLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>جاري تحميل فئات اللجان...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>الاسم بالعربية</th>
                    <th style={{ textAlign: 'right' }}>الرمز التعريفي (Key)</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 'bold' }}>{t.name}</td>
                      <td><code>{t.key}</code></td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => editType(t)}
                            className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                          >
                            تعديل ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteType(t.id)}
                            className="btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            حذف 🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {types.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '15px' }}>
                        لا توجد أنواع لجان مسجلة حالياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ borderRight: '6px solid var(--secondary-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>أنواع خيارات التقييم</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  إدارة التصنيفات المستخدمة في خيارات الأسس مثل إيجابي وسلبي ومعوق ومعضلة، مع معامل احتساب الدرجة لكل نوع.
                </p>
              </div>
              {isAdmin && !showOptionTypeForm && (
                <button
                  onClick={() => { resetOptionTypeForm(); setShowOptionTypeForm(true); }}
                  className="btn-primary"
                  style={{ padding: '8px 15px', fontSize: '13px' }}
                >
                  + إضافة نوع تقييم
                </button>
              )}
            </div>

            {!isAdmin && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                إدارة هذه الأنواع محصورة بمدير النظام. تظهر القائمة هنا للعرض فقط.
              </div>
            )}

            {optionTypeError && (
              <div style={{ backgroundColor: 'rgba(230,57,70,0.05)', color: 'var(--accent-color)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                {optionTypeError}
              </div>
            )}

            {isAdmin && showOptionTypeForm && (
              <form onSubmit={handleSaveOptionType} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)', fontSize: '16px' }}>
                  {optionTypeForm.id ? 'تعديل نوع خيار التقييم' : 'إضافة نوع خيار تقييم جديد'}
                </h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>الاسم العربي (يظهر في التقارير)</label>
                    <input
                      type="text"
                      value={optionTypeForm.nameAr}
                      onChange={(e) => setOptionTypeForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                      placeholder="مثال: إيجابي، ملاحظة، معوق"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>معامل الدرجة (وزن الاحتساب)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={optionTypeForm.scoreMultiplier}
                        onChange={(e) => setOptionTypeForm((prev) => ({ ...prev, scoreMultiplier: e.target.value }))}
                        required
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        (1.00 = درجة كاملة، 0.00 = لا تحسب)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>لون التمييز (Color Picker)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <input
                      type="color"
                      value={optionTypeForm.color}
                      onChange={(e) => setOptionTypeForm((prev) => ({ ...prev, color: e.target.value }))}
                      style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <div style={{ width: '1px', height: '30px', backgroundColor: '#e2e8f0', margin: '0 5px' }} />
                    {[
                      { name: 'أخضر', value: '#2a9d8f' },
                      { name: 'أحمر', value: '#e63946' },
                      { name: 'برتقالي', value: '#f4a261' },
                      { name: 'بنفسجي', value: '#9b5de5' },
                      { name: 'أزرق', value: '#0077b6' },
                      { name: 'أصفر', value: '#e9c46a' }
                    ].map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setOptionTypeForm(prev => ({ ...prev, color: c.value }))}
                        style={{ 
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c.value, 
                          border: optionTypeForm.color === c.value ? '2px solid #2d3748' : '1px solid rgba(0,0,0,0.1)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '20px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={optionTypeForm.affectsScore}
                      onChange={(e) => setOptionTypeForm((prev) => ({ ...prev, affectsScore: e.target.checked }))}
                    />
                    <b>يؤثر على الدرجة الإجمالية</b>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={optionTypeForm.isActive}
                      onChange={(e) => setOptionTypeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <b>الحالة: نشط</b>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => { setShowOptionTypeForm(false); resetOptionTypeForm(); }} className="btn-outline" style={{ padding: '8px 25px' }}>إلغاء</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 35px' }}>حفظ التغييرات</button>
                </div>
              </form>
            )}

            {optionTypeLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>جاري تحميل أنواع خيارات التقييم...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>النوع (الاسم العربي)</th>
                    <th style={{ textAlign: 'center' }}>معامل الدرجة</th>
                    <th style={{ textAlign: 'center' }}>الحالة</th>
                    <th style={{ textAlign: 'center', width: '190px' }}>العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {optionTypes.map((item) => {
                    const isSystemType = ['إيجابي', 'سلبي', 'معوق', 'معضلة'].includes(item.nameAr);
                    return (
                      <tr key={item.id}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                            <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: item.color || '#cbd5e0', border: '1px solid rgba(0,0,0,0.1)' }} />
                            {item.nameAr}
                            {isSystemType && <span style={{ fontSize: '10px', color: 'var(--primary-color)', backgroundColor: 'rgba(12,35,64,0.05)', padding: '2px 6px', borderRadius: '4px', marginRight: '5px' }}>أساسي</span>}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '500' }}>{Number(item.scoreMultiplier).toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                            {item.isActive ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isAdmin ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => editOptionType(item)} className="btn-outline" style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '6px' }}>
                                تعديل ✏️
                              </button>
                              <button 
                                onClick={() => handleToggleOptionType(item)} 
                                className="btn-outline" 
                                style={{ 
                                  padding: '5px 12px', 
                                  fontSize: '11px', 
                                  borderRadius: '6px',
                                  color: item.isActive ? 'var(--accent-color)' : 'var(--primary-color)',
                                  borderColor: item.isActive ? 'var(--accent-color)' : 'var(--primary-color)'
                                }}
                              >
                                {item.isActive ? 'تعطيل 🔒' : 'تفعيل 🔓'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>عرض فقط</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Placeholder for other dropdown settings */}
          <div className="card" style={{ borderRight: '6px solid var(--secondary-color)', opacity: 0.85 }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>⚙️ بقية القوائم المنسدلة للنظام</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              يشتمل هذا القسم مستقبلاً على إدارة القوائم المنسدلة المغلقة الأخرى (مثل: أنواع التكليف بالمناصب، وحالات التقييم) لحظر التلاعب وتسهيل الصيانة.
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
