import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

export type CriteriaOptionForm = {
  id?: number;
  tempKey?: string;
  optionText: string;
  type: string;
  optionTypeId?: number | null;
  optionType?: EvaluationOptionType | null;
  scoreValue: number;
};

export type EvaluationOptionType = {
  id: number;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  color?: string | null;
  icon?: string | null;
  sortOrder: number;
  affectsScore: boolean;
  scoreMultiplier: string | number;
  isActive: boolean;
};

export type CriteriaTableColumnForm = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  role: string;
  tempKey?: string;
};

export type CriteriaDetailFormData = {
  id?: number | null;
  parentId?: number | null;
  titleOrText: string;
  maxGrade: string;
  inputType: string;
  options: CriteriaOptionForm[];
  tableSchema: CriteriaTableColumnForm[];
};

type DetailSubmitPayload = {
  detailText: string;
  maxGrade: number;
  inputType: string;
  options: Array<{ optionText: string; type: string; optionTypeId?: number | null; scoreValue: number | null }>;
  tableSchema: Array<{ key: string; label: string; type: string; required: boolean; role: string }> | null;
};

type OptionSubmitPayload = {
  optionText: string;
  type: string;
  optionTypeId?: number | null;
  scoreValue: number | null;
};

const EVALUATION_TEMPLATES = {
  general: [
    { optionText: 'ممتاز', type: 'positive', scoreValue: 10 },
    { optionText: 'جيد جداً', type: 'positive', scoreValue: 8 },
    { optionText: 'جيد', type: 'positive', scoreValue: 6 },
    { optionText: 'فوق الوسط', type: 'positive', scoreValue: 5 },
    { optionText: 'وسط', type: 'positive', scoreValue: 4 },
    { optionText: 'دون الوسط', type: 'positive', scoreValue: 2 },
    { optionText: 'ضعيف', type: 'positive', scoreValue: 0 },
  ],
  verification: [
    { optionText: 'متحقق', type: 'positive', scoreValue: 1 },
    { optionText: 'غير متحقق', type: 'negative', scoreValue: 0 },
  ],
  compliance: [
    { optionText: 'ملتزم', type: 'positive', scoreValue: 10 },
    { optionText: 'ملتزم جزئياً', type: 'positive', scoreValue: 5 },
    { optionText: 'غير ملتزم', type: 'negative', scoreValue: 0 },
  ],
  readiness: [
    { optionText: 'جاهز', type: 'positive', scoreValue: 10 },
    { optionText: 'جاهزية متوسطة', type: 'positive', scoreValue: 5 },
    { optionText: 'غير جاهز', type: 'negative', scoreValue: 0 },
  ],
  field_cases: [
    { optionText: 'إيجابي', type: 'positive', scoreValue: 0 },
    { optionText: 'سلبي', type: 'negative', scoreValue: 0 },
    { optionText: 'معوق', type: 'impediment', scoreValue: 0 },
    { optionText: 'معضلة', type: 'obstacle', scoreValue: 0 },
  ],
};

const DETAILED_TABLE_TEMPLATES = {
  personnel: {
    name: 'موقف الأشخاص',
    columns: [
      { key: 'category', label: 'الفئة', type: 'text', required: true, role: 'label' },
      { key: 'nominal', label: 'الملاك', type: 'number', required: true, role: 'nominal' },
      { key: 'actual', label: 'الموجود', type: 'number', required: true, role: 'actual' },
      { key: 'deficit', label: 'النقص', type: 'number', required: false, role: 'deficit' },
      { key: 'increase', label: 'الزيادة', type: 'number', required: false, role: 'increase' },
      { key: 'percentage', label: 'النسبة %', type: 'percentage', required: false, role: 'percentage' },
    ],
  },
  vehicles: {
    name: 'موقف العجلات',
    columns: [
      { key: 'vehicle_type', label: 'نوع العجلة', type: 'text', required: true, role: 'label' },
      { key: 'nominal', label: 'الملاك', type: 'number', required: true, role: 'nominal' },
      { key: 'actual', label: 'الموجود', type: 'number', required: true, role: 'actual' },
      { key: 'working', label: 'الصالح', type: 'number', required: true, role: 'none' },
      { key: 'broken', label: 'العاطل', type: 'number', required: true, role: 'none' },
      { key: 'percentage', label: 'النسبة %', type: 'percentage', required: false, role: 'percentage' },
      { key: 'notes', label: 'الملاحظات', type: 'text', required: false, role: 'none' },
    ],
  },
};

const emptyDetailForm: CriteriaDetailFormData = {
  id: null,
  parentId: null,
  titleOrText: '',
  maxGrade: '',
  inputType: 'single',
  options: [],
  tableSchema: [],
};

const normalizeInitialData = (data?: Partial<CriteriaDetailFormData>): CriteriaDetailFormData => ({
  ...emptyDetailForm,
  ...data,
  options: data?.options || [],
  tableSchema: data?.tableSchema || [],
});

type Props = {
  isOpen: boolean;
  mode: 'add' | 'edit';
  variant?: 'detail' | 'option';
  initialData?: Partial<CriteriaDetailFormData>;
  title?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (payload: DetailSubmitPayload | OptionSubmitPayload) => Promise<void> | void;
};

export const CriteriaDetailModal: React.FC<Props> = ({
  isOpen,
  mode,
  variant = 'detail',
  initialData,
  title,
  submitLabel,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CriteriaDetailFormData>(normalizeInitialData(initialData));
  const [optionTypes, setOptionTypes] = useState<EvaluationOptionType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const nextData = normalizeInitialData(initialData);
      if (variant === 'option' && nextData.options.length === 0) {
        nextData.options = [{ tempKey: 'single_option', optionText: '', type: 'positive', optionTypeId: null, scoreValue: 0 }];
      }
      setFormData(nextData);
      setError('');
      setSubmitting(false);
    }
  }, [isOpen, initialData, variant]);

  useEffect(() => {
    if (!isOpen) return;
    apiFetch<EvaluationOptionType[]>('/evaluation-option-types/active')
      .then((types) => setOptionTypes(types))
      .catch((err) => setError(err.message || 'فشل تحميل أنواع خيارات التقييم'));
  }, [isOpen]);

  if (!isOpen) return null;

  const loadOptionTemplate = (templateKey: keyof typeof EVALUATION_TEMPLATES) => {
    const selectedTemplateOptions = EVALUATION_TEMPLATES[templateKey];
    setFormData((prev) => ({
      ...prev,
      options: selectedTemplateOptions.map((opt) => {
        const optionType = getTypeByCode(opt.type);
        return {
          ...opt,
          optionTypeId: optionType?.id || null,
          optionType: optionType || null,
          tempKey: `tmpl_${crypto.randomUUID()}`,
        };
      }),
    }));
  };

  const buildDetailPayload = (): DetailSubmitPayload => {
    const payload: DetailSubmitPayload = {
      detailText: formData.titleOrText.trim(),
      maxGrade: parseFloat(formData.maxGrade),
      inputType: formData.inputType,
      options: [],
      tableSchema: null,
    };

    if (formData.inputType === 'single' || formData.inputType === 'multiple') {
      payload.options = formData.options.map((opt) => ({
        optionText: opt.optionText.trim(),
        type: opt.type,
        optionTypeId: opt.optionTypeId || getTypeByCode(opt.type)?.id || null,
        scoreValue: opt.scoreValue !== null && opt.scoreValue !== undefined ? Number(opt.scoreValue) : null,
      }));
    } else if (formData.inputType === 'detailed_table') {
      payload.tableSchema = formData.tableSchema.map((col) => ({
        key: col.key,
        label: col.label.trim(),
        type: col.type,
        required: !!col.required,
        role: col.role || 'none',
      }));
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      if (variant === 'option') {
        const option = formData.options[0];
        if (!option?.optionText?.trim()) {
          throw new Error('يرجى إدخال نص الخيار');
        }
        await onSubmit({
          optionText: option.optionText.trim(),
          type: option.type || 'positive',
          optionTypeId: option.optionTypeId || getTypeByCode(option.type || 'positive')?.id || null,
          scoreValue: option.scoreValue !== null && option.scoreValue !== undefined ? Number(option.scoreValue) : null,
        });
      } else {
        if (!formData.titleOrText.trim() || !formData.maxGrade) {
          throw new Error('يرجى إدخال نص البند والدرجة العظمى');
        }
        const maxGrade = parseFloat(formData.maxGrade);
        if (Number.isNaN(maxGrade) || maxGrade <= 0) {
          throw new Error('يرجى إدخال درجة عظمى صالحة أكبر من 0');
        }
        await onSubmit(buildDetailPayload());
      }
    } catch (err: any) {
      setError(err.message || 'فشل حفظ البيانات');
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = title || (variant === 'option'
    ? 'إضافة خيار تقييم جديد'
    : mode === 'add' ? 'إضافة بند تفتيشي جديد' : 'تعديل بيانات البند التفتيشي');

  const optionsToRender = variant === 'option'
    ? (formData.options.length ? formData.options : [{ tempKey: 'single_option', optionText: '', type: 'positive', optionTypeId: null, scoreValue: 0 }])
    : formData.options;

  const mergedOptionTypes = [
    ...optionTypes,
    ...formData.options
      .map((opt) => opt.optionType)
      .filter((type): type is EvaluationOptionType => !!type && !optionTypes.some((activeType) => activeType.id === type.id)),
  ].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  function getTypeByCode(code: string) {
    return mergedOptionTypes.find((type) => type.code === code);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: variant === 'option' ? '560px' : '650px', width: '100%', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        borderTop: '6px solid var(--primary-color)', direction: 'rtl', textAlign: 'right',
        padding: 0, overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px 15px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{headerTitle}</h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(230,57,70,0.08)', color: 'var(--accent-color)', fontSize: '13px', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            {variant === 'detail' && (
              <>
                <div className="form-group">
                  <label>نص البند التفتيشي التفصيلي</label>
                  <textarea
                    value={formData.titleOrText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleOrText: e.target.value }))}
                    rows={4}
                    placeholder="مثال: مدى توفر خطط بديلة للطوارئ ومصادقتها..."
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>الدرجة العظمى المخصصة للبند</label>
                  <input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    value={formData.maxGrade}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxGrade: e.target.value }))}
                    placeholder="مثال: 25"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>نوع إدخال بند التفتيش</label>
                  <select
                    value={formData.inputType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inputType: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value="single">اختيار واحد (Single Choice)</option>
                    <option value="multiple">اختيارات متعددة (Multiple Choice)</option>
                    <option value="boolean">نعم / لا (Boolean)</option>
                    <option value="text">نص حر (Free Text)</option>
                    <option value="detailed_table">جدول تفصيلي ديناميكي (detailed_table)</option>
                  </select>
                </div>
              </>
            )}

            {variant === 'detail' && formData.inputType === 'detailed_table' && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '12px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '13px' }}>تحميل قالب جاهز من مكتبة المواقف:</label>
                  <select
                    value=""
                    onChange={(e) => {
                      const templateKey = e.target.value as keyof typeof DETAILED_TABLE_TEMPLATES;
                      if (!templateKey) return;
                      const template = DETAILED_TABLE_TEMPLATES[templateKey];
                      setFormData((prev) => ({
                        ...prev,
                        tableSchema: template.columns.map((col) => ({ ...col, tempKey: `col_${crypto.randomUUID()}` })),
                      }));
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="">(اختر قالباً جاهزاً من المكتبة...)</option>
                    {Object.entries(DETAILED_TABLE_TEMPLATES).map(([key, value]) => (
                      <option key={key} value={key}>{value.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold', margin: 0 }}>تحديد أعمدة الجدول</label>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '12px', padding: '4px 10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                    onClick={() => {
                      const newColIndex = formData.tableSchema.length;
                      setFormData((prev) => ({
                        ...prev,
                        tableSchema: [...prev.tableSchema, {
                          tempKey: `new_col_${crypto.randomUUID()}`,
                          key: `col_${newColIndex + 1}`,
                          label: '',
                          type: 'text',
                          required: true,
                          role: 'none',
                        }],
                      }));
                    }}
                  >
                    + إضافة عمود جديد
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#edf2f7', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px', textAlign: 'right' }}>اسم العمود</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '110px' }}>نوع البيانات</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '70px' }}>إجباري</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '130px' }}>الدور الحسابي</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.tableSchema.map((col, idx) => (
                        <tr key={col.tempKey} style={{ borderBottom: '1px solid #edf2f7' }}>
                          <td style={{ padding: '6px' }}>
                            <input
                              type="text"
                              value={col.label}
                              onChange={(e) => {
                                const labelVal = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  tableSchema: prev.tableSchema.map((item, cIdx) =>
                                    cIdx === idx ? { ...item, label: labelVal } : item
                                  ),
                                }));
                              }}
                              style={{ margin: 0, padding: '6px 10px', fontSize: '12px' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <select
                              value={col.type}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  tableSchema: prev.tableSchema.map((item, cIdx) => cIdx === idx ? { ...item, type: val } : item),
                                }));
                              }}
                              style={{ margin: 0, padding: '6px', width: '100%', fontSize: '12px', height: 'auto' }}
                            >
                              <option value="text">نص (text)</option>
                              <option value="number">رقم (number)</option>
                              <option value="percentage">نسبة % (percentage)</option>
                              <option value="date">تاريخ (date)</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={col.required}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setFormData((prev) => ({
                                  ...prev,
                                  tableSchema: prev.tableSchema.map((item, cIdx) => cIdx === idx ? { ...item, required: val } : item),
                                }));
                              }}
                              style={{ margin: 0 }}
                            />
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <select
                              value={col.role}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  tableSchema: prev.tableSchema.map((item, cIdx) => cIdx === idx ? { ...item, role: val } : item),
                                }));
                              }}
                              style={{ margin: 0, padding: '6px', width: '100%', fontSize: '12px', height: 'auto' }}
                            >
                              <option value="none">بلا (none)</option>
                              <option value="label">تسمية الفئة (label)</option>
                              <option value="nominal">الملاك (nominal)</option>
                              <option value="actual">الموجود (actual)</option>
                              <option value="deficit">النقص (deficit)</option>
                              <option value="increase">الزيادة (increase)</option>
                              <option value="percentage">النسبة (percentage)</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ padding: '6px', margin: 0, width: '28px', height: '28px', minWidth: 'auto' }}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  tableSchema: prev.tableSchema.filter((_, cIdx) => cIdx !== idx),
                                }));
                              }}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {variant === 'detail' && (formData.inputType === 'single' || formData.inputType === 'multiple') && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '13px' }}>تحميل قالب خيارات جاهز</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('general')}>التقييم العام</button>
                  <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('verification')}>قالب التحقق</button>
                  <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('compliance')}>قالب الالتزام</button>
                  <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('readiness')}>قالب الجاهزية</button>
                  <button type="button" className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => loadOptionTemplate('field_cases')}>الحالات الميدانية</button>
                </div>
              </div>
            )}

            {(variant === 'option' || (variant === 'detail' && (formData.inputType === 'single' || formData.inputType === 'multiple'))) && (
              <div style={{ marginTop: variant === 'option' ? 0 : '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold', margin: 0 }}>{variant === 'option' ? 'بيانات خيار التقييم' : 'خيارات البند / الحالات الميدانية'}</label>
                  {variant === 'detail' && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: '12px', padding: '4px 10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        options: [...prev.options, { tempKey: `new_${crypto.randomUUID()}`, optionText: '', type: optionTypes[0]?.code || 'positive', optionTypeId: optionTypes[0]?.id || null, optionType: optionTypes[0] || null, scoreValue: 0 }],
                      }))}
                    >
                      + إضافة خيار جديد
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                  {optionsToRender.map((opt, idx) => (
                    <div key={opt.tempKey || opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fcfcfc', padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}>
                      <div style={{ flex: 2 }}>
                        <input
                          type="text"
                          value={opt.optionText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              options: prev.options.map((item, oIdx) => oIdx === idx ? { ...item, optionText: val } : item),
                            }));
                          }}
                          placeholder="نص الخيار (مثال: ممتاز)"
                          style={{ margin: 0, padding: '6px 10px', fontSize: '13px' }}
                          required
                        />
                      </div>

                      <div style={{ flex: 1.2 }}>
                        <select
                          value={opt.optionTypeId || getTypeByCode(opt.type)?.id || ''}
                          onChange={(e) => {
                            const typeId = Number(e.target.value);
                            const selectedType = mergedOptionTypes.find((type) => type.id === typeId) || null;
                            setFormData((prev) => ({
                              ...prev,
                              options: prev.options.map((item, oIdx) => oIdx === idx ? {
                                ...item,
                                type: selectedType?.code || item.type,
                                optionTypeId: selectedType?.id || null,
                                optionType: selectedType,
                              } : item),
                            }));
                          }}
                          style={{ margin: 0, padding: '6px 10px', fontSize: '13px', width: '100%', height: 'auto' }}
                        >
                          {mergedOptionTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.nameAr} ({type.code}){type.isActive === false ? ' - غير نشط' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: '80px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={opt.scoreValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              options: prev.options.map((item, oIdx) => oIdx === idx ? { ...item, scoreValue: Number.isNaN(val) ? 0 : val } : item),
                            }));
                          }}
                          placeholder="الدرجة"
                          style={{ margin: 0, padding: '6px 10px', fontSize: '13px', width: '100%', textAlign: 'center' }}
                          required
                        />
                      </div>

                      {variant === 'detail' && (
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: '6px 10px', margin: 0, minWidth: 'auto', width: '32px', height: '32px' }}
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, oidx) => oidx !== idx),
                          }))}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            padding: '15px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            backgroundColor: '#f8fafc',
          }}>
            <button type="button" onClick={onClose} className="btn-outline" disabled={submitting}>إلغاء</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : submitLabel || 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
