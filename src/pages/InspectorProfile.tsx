import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { SpecializationBadge } from '../components/specializations/SpecializationBadge';
import { SpecializationAssignModal } from '../components/specializations/SpecializationAssignModal';

const LEVEL_COLORS: Record<string, string> = {
  FREE: '#10b981', LIGHT: '#3b82f6', NORMAL: '#f59e0b', HEAVY: '#f97316', OVERLOADED: '#ef4444',
};

const LEVEL_LABELS: Record<string, string> = {
  FREE: 'متفرغ', LIGHT: 'خفيف', NORMAL: 'عادي', HEAVY: 'ثقيل', OVERLOADED: 'محمل فوق الطاقة',
};

export const InspectorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [specAssignOpen, setSpecAssignOpen] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/inspector-profile/${id}`);
      setProfile(data);
      setForm({
        rank: data.rank || '', title: data.title || '', specialization: data.specialization || '',
        email: data.email || '', office: data.office || '', yearsOfService: data.yearsOfService || '',
        profileNotes: data.profileNotes || '', department: data.department || '', phone: data.phone || '',
        availabilityStatus: data.availabilityStatus || 'AVAILABLE',
        availabilityReason: data.availabilityReason || '',
        availabilityUntil: data.availabilityUntil ? data.availabilityUntil.split('T')[0] : '',
      });
    } catch (e: any) {
      setError(e.message || 'فشل تحميل الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/inspector-profile/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setEditMode(false);
    } catch (e: any) {
      setError(e.message || 'فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/inspector-profile/${id}/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('فشل رفع الصورة');
      const data = await res.json();
      setProfile((prev: any) => ({ ...prev, photoUrl: data.photoUrl, photoUpdatedAt: data.photoUpdatedAt }));
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      const data = await apiFetch(`/inspector-profile/${id}/photo`, { method: 'DELETE' });
      setProfile((prev: any) => ({ ...prev, photoUrl: data.photoUrl, photoUpdatedAt: data.photoUpdatedAt }));
    } catch (err: any) {
      setError(err.message || 'فشل حذف الصورة');
    }
  };

  const handleAssignSpec = async (specializationId: number, proficiencyLevel: string, isPrimary: boolean, notes: string) => {
    await apiFetch(`/inspector-specializations/inspector/${id}`, {
      method: 'POST',
      body: JSON.stringify({ specializationId, proficiencyLevel, isPrimary, notes }),
    });
    await loadProfile();
  };

  const handleRemoveSpec = async (specId: number) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا التخصص؟')) return;
    await apiFetch(`/inspector-specializations/assign/${specId}`, { method: 'DELETE' });
    await loadProfile();
  };

  if (loading) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '40px', color: 'var(--text-secondary)' }}>
        جاري تحميل الملف الشخصي...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{ direction: 'rtl', textAlign: 'right', padding: '20px' }}>
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px' }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const p = profile;

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate(-1)} className="btn-outline" style={{ fontSize: '12px', marginBottom: '10px' }}>← رجوع</button>
          <h1 className="page-title" style={{ margin: 0 }}>الملف الشخصي للمفتش</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn-outline" style={{ fontSize: '13px' }}>
              ✏️ تعديل البيانات
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Hero Section */}
      <div className="card" style={{ padding: '25px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: '140px', height: '140px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--primary-color)', marginBottom: '10px' }}>
              {p.photoUrl ? (
                <img src={`http://localhost:3001${p.photoUrl}`} alt={p.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '48px', color: '#94a3b8' }}>👤</span>
              )}
            </div>
            <div>
              <label className="btn-outline" style={{ fontSize: '11px', cursor: 'pointer', padding: '4px 10px', display: 'inline-block' }}>
                {uploading ? 'جاري الرفع...' : '📷 رفع صورة'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {p.photoUrl && (
                <button onClick={handlePhotoDelete} className="btn-outline" style={{ fontSize: '11px', padding: '4px 10px', marginRight: '5px', color: '#ef4444' }}>
                  🗑 حذف
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 25px' }}>
              <InfoRow label="الرتبة" value={p.rank || '—'} />
              <InfoRow label="الاسم الكامل" value={p.fullName} />
              <InfoRow label="المسمى الوظيفي" value={p.title || '—'} />
              <InfoRow label="التخصص" value={p.specialization || '—'} />
              <InfoRow label="القسم" value={p.department || '—'} />
              <InfoRow label="البريد الإلكتروني" value={p.email || '—'} />
              <InfoRow label="المكتب" value={p.office || '—'} />
              <InfoRow label="سنوات الخدمة" value={p.yearsOfService != null ? `${p.yearsOfService} سنة` : '—'} />
              <InfoRow label="الهاتف" value={p.phone || '—'} />
              <InfoRow label="حالة التوفر" value={<AvailabilityBadge status={p.availabilityStatus} />} />
              <InfoRow label="سبب التوفر" value={p.availabilityReason || '—'} />
              <InfoRow label="حتى تاريخ" value={p.availabilityUntil ? new Date(p.availabilityUntil).toLocaleDateString('ar-IQ') : '—'} />
              <InfoRow label="الحالة" value={p.isActive ? '🟢 نشط' : '🔴 غير نشط'} />
            </div>
          </div>

          {/* Score Cards */}
          <div style={{ minWidth: '220px' }}>
            <div className="card" style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>مؤشر النشاط</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: p.activityScore >= 50 ? '#10b981' : '#f59e0b' }}>
                {p.activityScore}%
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '5px' }}>
                <div style={{ width: `${p.activityScore}%`, height: '100%', backgroundColor: p.activityScore >= 50 ? '#10b981' : '#f59e0b', borderRadius: '3px' }} />
              </div>
            </div>
            <div className="card" style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>عبء العمل</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: LEVEL_COLORS[p.workloadLevel] || '#6b7280' }}>
                {p.workloadScore}
              </div>
              <div style={{ fontSize: '12px', color: LEVEL_COLORS[p.workloadLevel] || '#6b7280', fontWeight: 600 }}>
                {LEVEL_LABELS[p.workloadLevel] || p.workloadLevel}
              </div>
            </div>
            {p.lastFieldParticipationDays != null && (
              <div className="card" style={{ padding: '15px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>آخر مشاركة ميدانية</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: p.lastFieldParticipationDays <= 7 ? '#10b981' : '#f59e0b' }}>
                  {p.lastFieldParticipationDays === 0 ? 'اليوم' : `${p.lastFieldParticipationDays} يوم مضت`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editMode && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>تعديل البيانات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <FormField label="الرتبة" value={form.rank} onChange={(v: string) => setForm((f: any) => ({ ...f, rank: v }))} />
            <FormField label="المسمى الوظيفي" value={form.title} onChange={(v: string) => setForm((f: any) => ({ ...f, title: v }))} />
            <FormField label="التخصص" value={form.specialization} onChange={(v: string) => setForm((f: any) => ({ ...f, specialization: v }))} />
            <FormField label="البريد الإلكتروني" value={form.email} onChange={(v: string) => setForm((f: any) => ({ ...f, email: v }))} />
            <FormField label="المكتب" value={form.office} onChange={(v: string) => setForm((f: any) => ({ ...f, office: v }))} />
            <FormField label="سنوات الخدمة" type="number" value={form.yearsOfService?.toString() || ''} onChange={(v: string) => setForm((f: any) => ({ ...f, yearsOfService: v ? parseInt(v) : null }))} />
            <FormField label="القسم" value={form.department} onChange={(v: string) => setForm((f: any) => ({ ...f, department: v }))} />
            <FormField label="الهاتف" value={form.phone} onChange={(v: string) => setForm((f: any) => ({ ...f, phone: v }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>حالة التوفر</label>
              <select value={form.availabilityStatus} onChange={(e) => setForm((f: any) => ({ ...f, availabilityStatus: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}>
                <option value="AVAILABLE">متوفر</option>
                <option value="ON_LEAVE">إجازة</option>
                <option value="ON_MISSION">مأمورية</option>
                <option value="TRAINING">دورة تدريبية</option>
                <option value="MEDICAL">إجازة مرضية</option>
                <option value="UNAVAILABLE">غير متوفر</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>سبب التوفر</label>
              <input type="text" value={form.availabilityReason} onChange={(e) => setForm((f: any) => ({ ...f, availabilityReason: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>حتى تاريخ</label>
              <input type="date" value={form.availabilityUntil} onChange={(e) => setForm((f: any) => ({ ...f, availabilityUntil: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }} />
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '5px' }}>ملاحظات</label>
            <textarea
              value={form.profileNotes} onChange={(e) => setForm((f: any) => ({ ...f, profileNotes: e.target.value }))}
              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={handleSave} className="btn-primary" style={{ fontSize: '13px' }} disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
            </button>
            <button onClick={() => setEditMode(false)} className="btn-outline" style={{ fontSize: '13px' }}>إلغاء</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Groups */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>
            الزمر التفتيشية ({p.groups?.length || 0})
          </h3>
          {p.groups?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {p.groups.map((g: any) => (
                <div key={g.id} style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: g.isPrimary ? 'var(--primary-color)' : '#f1f5f9', color: g.isPrimary ? '#ffffff' : 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}>
                  {g.name}
                  {g.isLeader && <span style={{ marginRight: '4px' }} title="قائد الزمرة">👑</span>}
                  {g.isPrimary && <span style={{ marginRight: '4px', fontSize: '10px' }}>⭐</span>}
                  {g.roleInGroup && !g.isLeader && <span style={{ marginRight: '5px', opacity: 0.7, fontSize: '10px' }}>({g.roleInGroup})</span>}
                  {g.memberOrder && <span style={{ marginRight: '5px', opacity: 0.5, fontSize: '10px' }}>#{g.memberOrder}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>لا توجد زمر تفتيشية</div>
          )}
          {p.primaryGroup && !p.groups?.some((g: any) => g.isPrimary) && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: '#ffffff', fontSize: '12px', fontWeight: 500, display: 'inline-block' }}>
                {p.primaryGroup.name} ⭐
              </span>
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>
            التكليفات ({p.assignments?.length || 0})
          </h3>
          {p.assignments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {p.assignments.map((a: any) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '12px' }}>
                  <span>📋</span>
                  <span style={{ fontWeight: 500 }}>{a.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>({a.assignmentType})</span>
                  {a.note && <span style={{ color: '#94a3b8', fontSize: '10px' }}>- {a.note}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>لا توجد تكليفات</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Campaign Summary */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>المشاركة في الحملات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center' }}>
            <StatBox label="قائد" value={p.campaignSummary?.asLeader || 0} color="#3b82f6" />
            <StatBox label="نائب" value={p.campaignSummary?.asDeputy || 0} color="#8b5cf6" />
            <StatBox label="عضو" value={p.campaignSummary?.asMember || 0} color="#10b981" />
            <StatBox label="المجموع" value={p.campaignSummary?.totalCampaigns || 0} color="#f59e0b" />
            <StatBox label="نشط" value={p.campaignSummary?.activeCampaigns || 0} color="#f97316" />
          </div>
        </div>

        {/* Recommendation Stats */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>إحصائيات التوصيات</h3>
          <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            مكلف بـ <strong style={{ color: 'var(--primary-color)' }}>{p.recommendationStats?.totalAssigned || 0}</strong> توصية
            {' • '}
            <strong style={{ color: '#f59e0b' }}>{p.recommendationStats?.open || 0}</strong> مفتوحة
            {' • '}
            <strong style={{ color: '#10b981' }}>{p.recommendationStats?.completed || 0}</strong> منجزة
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Badge label="التعليقات" value={p.recommendationStats?.commentsAdded || 0} color="#3b82f6" />
            <Badge label="المرفقات" value={p.recommendationStats?.evidenceUploaded || 0} color="#8b5cf6" />
            <Badge label="تغييرات الحالة" value={p.recommendationStats?.statusChanges || 0} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Duties Table */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--primary-color)' }}>
          الواجبات الحالية ({p.duties?.length || 0})
        </h3>
        {p.duties?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px', textAlign: 'right' }}>الحملة</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>الجهة</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>الدور</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>تاريخ البداية</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>المدة (يوم)</th>
              </tr>
            </thead>
            <tbody>
              {p.duties.map((d: any, idx: number) => (
                <tr key={d.campaignId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 500 }}>{d.campaignName}</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{d.entityName}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                      backgroundColor: d.role === 'LEADER' ? 'rgba(59,130,246,0.1)' : d.role === 'DEPUTY' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)',
                      color: d.role === 'LEADER' ? '#3b82f6' : d.role === 'DEPUTY' ? '#8b5cf6' : '#10b981',
                    }}>
                      {d.role === 'LEADER' ? 'قائد' : d.role === 'DEPUTY' ? 'نائب' : 'عضو'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                    {d.startDate ? new Date(d.startDate).toLocaleDateString('ar-IQ') : '—'}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{d.daysOnDuty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>لا توجد واجبات حالية</div>
        )}
      </div>

      {/* Specializations Section */}
      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)' }}>
            التخصصات ({p.specializations?.length || 0})
          </h3>
          <button onClick={() => setSpecAssignOpen(true)} className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
            + إضافة تخصص
          </button>
        </div>
        {p.specializations && p.specializations.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {p.specializations.map((s: any) => (
              <SpecializationBadge
                key={s.id}
                name={s.specialization?.name || ''}
                proficiencyLevel={s.proficiencyLevel}
                isPrimary={s.isPrimary}
                onRemove={() => handleRemoveSpec(s.id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>لا توجد تخصصات مضافة</div>
        )}
      </div>

      <SpecializationAssignModal
        open={specAssignOpen}
        onClose={() => setSpecAssignOpen(false)}
        onAssign={handleAssignSpec}
        existingIds={(p.specializations || []).map((s: any) => s.specializationId)}
      />
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ fontSize: '12px' }}>
    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}:</span>
    {' '}<span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: `${color}10`, textAlign: 'center' }}>
    <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>{label}</div>
  </div>
);

const Badge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: `${color}10`, fontSize: '11px', display: 'flex', gap: '5px', alignItems: 'center' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color }}>{value}</span>
  </div>
);

const FormField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; type?: string;
}> = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>{label}</label>
    <input
      type={type}
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}
    />
  </div>
);
