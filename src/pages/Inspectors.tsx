import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const AVAILABILITY_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'AVAILABLE', label: 'متاح' },
  { value: 'ON_LEAVE', label: 'في إجازة' },
  { value: 'ON_MISSION', label: 'في مهمة' },
  { value: 'TRAINING', label: 'دورة تدريبية' },
  { value: 'MEDICAL', label: 'إجازة مرضية' },
  { value: 'UNAVAILABLE', label: 'غير متاح' },
];

const AVAILABILITY_COLORS: Record<string, string> = {
  AVAILABLE: '#22c55e',
  ON_LEAVE: '#eab308',
  ON_MISSION: '#3b82f6',
  TRAINING: '#8b5cf6',
  MEDICAL: '#ef4444',
  UNAVAILABLE: '#6b7280',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: 'متاح',
  ON_LEAVE: 'في إجازة',
  ON_MISSION: 'في مهمة',
  TRAINING: 'دورة تدريبية',
  MEDICAL: 'إجازة مرضية',
  UNAVAILABLE: 'غير متاح',
};

interface Inspector {
  id: string;
  fullName: string;
  rank: string | null;
  department: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  availabilityStatus: string | null;
  availabilityReason: string | null;
  availabilityUntil: string | null;
  primaryGroup: { id: number; name: string; code: string | null } | null;
  groupMemberships: Array<{
    isLeader: boolean;
    group: { id: number; name: string; code: string | null; isActive: boolean };
  }>;
  inspectorSpecializations: Array<{
    isPrimary: boolean;
    specialization: { id: number; name: string };
  }>;
}

interface PaginatedResponse {
  items: Inspector[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface GroupOption {
  id: number;
  groupName: string;
  isActive: boolean;
}

interface SpecializationOption {
  id: number;
  name: string;
}

export const Inspectors: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<Inspector[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageItemsCount, setPageItemsCount] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterGroup, setFilterGroup] = useState<number | ''>('');
  const [filterSpecialization, setFilterSpecialization] = useState<number | ''>('');
  const [filterIsActive, setFilterIsActive] = useState<string>('');

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationOption[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [avModalInspector, setAvModalInspector] = useState<Inspector | null>(null);
  const [avStatus, setAvStatus] = useState('AVAILABLE');
  const [avReason, setAvReason] = useState('');
  const [avUntil, setAvUntil] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterAvailability, filterGroup, filterSpecialization, filterIsActive, pageItemsCount]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('pageItemsCount', String(pageItemsCount));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filterAvailability) params.set('availabilityStatus', filterAvailability);
    if (filterGroup !== '') params.set('inspectionGroup', String(filterGroup));
    if (filterSpecialization !== '') params.set('specialization', String(filterSpecialization));
    if (filterIsActive) params.set('isActive', filterIsActive);
    return params.toString();
  }, [currentPage, pageItemsCount, debouncedSearch, filterAvailability, filterGroup, filterSpecialization, filterIsActive]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = buildQuery();
      const data = await apiFetch<PaginatedResponse>(`/inspectors?${qs}`);
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات المفتشين');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    apiFetch<GroupOption[]>('/inspection-groups').then(setGroups).catch(() => {});
    apiFetch<SpecializationOption[]>('/inspector-specializations').then(setSpecializations).catch(() => {});
  }, []);

  const getGroupDisplay = (insp: Inspector): string => {
    if (insp.primaryGroup) return insp.primaryGroup.name;
    const activeMembership = insp.groupMemberships?.find(m => m.group.isActive);
    if (activeMembership) return activeMembership.group.name;
    return '—';
  };

  const getGroupExtraCount = (insp: Inspector): number => {
    let count = 0;
    if (insp.primaryGroup) count++;
    const activeMembership = insp.groupMemberships?.find(m => m.group.isActive);
    if (activeMembership && (!insp.primaryGroup || activeMembership.group.id !== insp.primaryGroup.id)) count++;
    const total = insp.groupMemberships?.length || 0;
    if (count > 1) return total - 1;
    if (count === 1 && total > 1) return total - 1;
    return 0;
  };

  const getPrimarySpecialization = (insp: Inspector): string => {
    const primary = insp.inspectorSpecializations?.find(s => s.isPrimary);
    if (primary) return primary.specialization.name;
    if (insp.inspectorSpecializations?.length) return insp.inspectorSpecializations[0].specialization.name;
    return '—';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { fullName, department, phone: phone || undefined, notes: notes || undefined, isActive };
      if (rank) payload.rank = rank;
      if (inspectorId) {
        await apiFetch(`/inspectors/${inspectorId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/inspectors', { method: 'POST', body: JSON.stringify(payload) });
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

  const editInspector = (insp: Inspector) => {
    setInspectorId(insp.id);
    setFullName(insp.fullName);
    setRank(insp.rank || '');
    setDepartment(insp.department || '');
    setPhone(insp.phone || '');
    setNotes(insp.notes || '');
    setIsActive(insp.isActive);
    setShowForm(true);
  };

  const resetForm = () => {
    setInspectorId(null);
    setFullName('');
    setRank('');
    setDepartment('');
    setPhone('');
    setNotes('');
    setIsActive(true);
  };

  const openAvailabilityModal = (insp: Inspector) => {
    setAvModalInspector(insp);
    setAvStatus(insp.availabilityStatus || 'AVAILABLE');
    setAvReason(insp.availabilityReason || '');
    setAvUntil(insp.availabilityUntil ? insp.availabilityUntil.substring(0, 10) : '');
  };

  const saveAvailability = async () => {
    if (!avModalInspector) return;
    try {
      const payload: any = { availabilityStatus: avStatus };
      if (avReason) payload.availabilityReason = avReason;
      if (avUntil) payload.availabilityUntil = avUntil;
      else payload.availabilityUntil = null;
      await apiFetch(`/inspectors/${avModalInspector.id}/availability`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setAvModalInspector(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث حالة التوفر');
    }
  };

  const startIndex = (currentPage - 1) * pageItemsCount + 1;
  const endIndex = Math.min(startIndex + items.length - 1, totalCount);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المفتشين وأعضاء اللجان</h1>
          <p className="page-subtitle">إضافة وتعديل بيانات الضباط والمفتشين الميدانيين المشتركين في لجان التفتيش</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          + إضافة مفتش جديد
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card m-b-20" style={{ border: '2px solid var(--secondary-color)' }}>
          <h3>{inspectorId ? 'تعديل بيانات المفتش' : 'إضافة مفتش جديد'}</h3>
          <form onSubmit={handleSubmit} className="grid-2" style={{ marginTop: '15px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>الرتبة والاسم الكامل للضابط</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: العقيد علي جاسم" required />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>الرتبة (مفردة)</label>
              <input type="text" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="مثال: عقيد" />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>المديرية / القسم التابع له</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="مثال: مديرية تفتيش بغداد الكرخ" required />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>رقم الهاتف (اختياري)</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثال: 07700000000" />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 'bold' }}>ملاحظات إضافية (اختياري)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أية ملاحظات أخرى..." />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer' }} />
              <label style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>المفتش نشط (يمكن إدراجه في اللجان الجديدة)</label>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">إلغاء</button>
              <button type="submit" className="btn-primary" style={{ padding: '10px 25px' }}>حفظ بيانات المفتش</button>
            </div>
          </form>
        </div>
      )}

      <div className="card m-b-20">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="بحث بالاسم أو الرتبة أو الهاتف أو المجموعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 250px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
          />

          <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', minWidth: '120px' }}>
            {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value ? Number(e.target.value) : '')}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', minWidth: '130px' }}>
            <option value="">كل المجموعات</option>
            {groups.filter(g => g.isActive).map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
          </select>

          <select value={filterSpecialization} onChange={(e) => setFilterSpecialization(e.target.value ? Number(e.target.value) : '')}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', minWidth: '130px' }}>
            <option value="">كل التخصصات</option>
            {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select value={filterIsActive} onChange={(e) => setFilterIsActive(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', minWidth: '100px' }}>
            <option value="">الكل</option>
            <option value="true">نشط فقط</option>
            <option value="false">معطل فقط</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل المفتشين...</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                عرض {startIndex}–{endIndex} من أصل {totalCount} مفتش
                {debouncedSearch && ` (بحث: "${debouncedSearch}")`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>عرض:</span>
                <select value={pageItemsCount} onChange={(e) => setPageItemsCount(Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}>
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>الرتبة</th>
                    <th style={{ textAlign: 'right' }}>الاسم الكامل</th>
                    <th style={{ textAlign: 'right' }}>المجموعة</th>
                    <th style={{ textAlign: 'center' }}>حالة التوفر</th>
                    <th style={{ textAlign: 'right' }}>التخصص الأساسي</th>
                    <th style={{ textAlign: 'center' }}>الحالة</th>
                    <th style={{ textAlign: 'center', width: '240px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((insp) => (
                    <tr key={insp.id}>
                      <td>{insp.rank || '—'}</td>
                      <td><strong>{insp.fullName}</strong></td>
                      <td>
                        {getGroupDisplay(insp)}
                        {getGroupExtraCount(insp) > 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>
                            +{getGroupExtraCount(insp)}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                          color: '#fff', backgroundColor: AVAILABILITY_COLORS[insp.availabilityStatus || 'AVAILABLE'] || '#6b7280'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
                          {AVAILABILITY_LABELS[insp.availabilityStatus || 'AVAILABLE'] || '—'}
                        </span>
                      </td>
                      <td>{getPrimarySpecialization(insp)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${insp.isActive ? 'success' : 'danger'}`}>
                          {insp.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => navigate(`/inspectors/${insp.id}/profile`)} className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px' }}>الملف</button>
                          <button onClick={() => editInspector(insp)} className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px' }}>تعديل</button>
                          <button onClick={() => openAvailabilityModal(insp)} className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px' }}>التوفر</button>
                          <button onClick={() => deleteInspector(insp.id)} className="btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        لا يوجد مفتشون مطابقون للبحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentPage(1)} disabled={currentPage <= 1}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: currentPage <= 1 ? 'default' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1, fontSize: '13px' }}>
                  الأولى
                </button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: currentPage <= 1 ? 'default' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1, fontSize: '13px' }}>
                  السابق
                </button>
                <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  صفحة {currentPage} من {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: currentPage >= totalPages ? 'default' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1, fontSize: '13px' }}>
                  التالي
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: currentPage >= totalPages ? 'default' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1, fontSize: '13px' }}>
                  الأخيرة
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {avModalInspector && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setAvModalInspector(null)}>
          <div className="card" style={{ width: '400px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h3>تحديث حالة التوفر</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '14px' }}>
              {avModalInspector.fullName}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>حالة التوفر</label>
                <select value={avStatus} onChange={(e) => setAvStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {AVAILABILITY_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>السبب (اختياري)</label>
                <input type="text" value={avReason} onChange={(e) => setAvReason(e.target.value)}
                  placeholder="سبب عدم التوفر..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>حتى تاريخ (اختياري)</label>
                <input type="date" value={avUntil} onChange={(e) => setAvUntil(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setAvModalInspector(null)} className="btn-outline">إلغاء</button>
                <button type="button" onClick={saveAvailability} className="btn-primary">حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
