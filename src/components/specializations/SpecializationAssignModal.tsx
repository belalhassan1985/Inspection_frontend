import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

interface SpecializationOption {
  id: number;
  name: string;
  category: { id: number; name: string };
}

interface CategoryGroup {
  id: number;
  name: string;
  specializations: SpecializationOption[];
}

interface SpecializationAssignModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (specializationId: number, proficiencyLevel: string, isPrimary: boolean, notes: string) => Promise<void>;
  existingIds: number[];
}

const PROFICIENCY_OPTIONS = [
  { value: 'BASIC', label: 'أساسي' },
  { value: 'PRACTITIONER', label: 'ممارس' },
  { value: 'ADVANCED', label: 'متقدم' },
  { value: 'EXPERT', label: 'خبير' },
];

export const SpecializationAssignModal: React.FC<SpecializationAssignModalProps> = ({
  open, onClose, onAssign, existingIds,
}) => {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [selectedSpecId, setSelectedSpecId] = useState<number | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState('BASIC');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError('');
      setSelectedSpecId(null);
      setProficiencyLevel('BASIC');
      setIsPrimary(false);
      setNotes('');
      apiFetch('/inspector-specializations/categories')
        .then((data: any) => {
          const cats = Array.isArray(data) ? data : data?.value || [];
          setCategories(cats);
        })
        .catch((e) => setError(e.message || 'فشل تحميل التخصصات'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const availableSpecs = categories.flatMap(c =>
    (c.specializations || []).filter(s => !existingIds.includes(s.id))
  );

  const handleSubmit = async () => {
    if (!selectedSpecId) return;
    setSaving(true);
    setError('');
    try {
      await onAssign(selectedSpecId, proficiencyLevel, isPrimary, notes);
      onClose();
    } catch (e: any) {
      setError(e.message || 'فشل إضافة التخصص');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '480px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto',
          padding: '25px', direction: 'rtl', textAlign: 'right',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: 'var(--primary-color)' }}>
          إضافة تخصص للمفتش
        </h3>

        {error && (
          <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            جاري تحميل التخصصات...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>التخصص</label>
              {availableSpecs.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '8px 0' }}>
                  لا توجد تخصصات متاحة للإضافة
                </div>
              ) : (
                <select
                  value={selectedSpecId ?? ''}
                  onChange={(e) => setSelectedSpecId(e.target.value ? +e.target.value : null)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}
                >
                  <option value="">-- اختر التخصص --</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {(cat.specializations || [])
                        .filter(s => !existingIds.includes(s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>مستوى الكفاءة</label>
              <select
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}
              >
                {PROFICIENCY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
                تعيين كتخصص أساسي
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
          <button onClick={handleSubmit} className="btn-primary" disabled={saving || !selectedSpecId} style={{ fontSize: '13px' }}>
            {saving ? 'جاري الحفظ...' : 'إضافة التخصص'}
          </button>
          <button onClick={onClose} className="btn-outline" style={{ fontSize: '13px' }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
};
