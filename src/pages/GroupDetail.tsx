import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { AvailabilityBadge } from '../components/AvailabilityBadge';

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

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [addAsLeader, setAddAsLeader] = useState(false);

  const loadGroup = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, rd] = await Promise.all([
        apiFetch(`/inspection-groups/${id}`),
        apiFetch(`/inspection-groups/${id}/readiness`).catch(() => null),
      ]);
      setGroup(data);
      setReadiness(rd);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات الفرقة');
    } finally {
      setLoading(false);
    }
  };

  const loadInspectors = async () => {
    try {
      const data = await apiFetch('/inspectors');
      setInspectors(data.filter((i: any) => i.isActive));
    } catch (_) {}
  };

  useEffect(() => {
    loadGroup();
    loadInspectors();
  }, [id]);

  const addMember = async () => {
    if (!selectedInspectorId) return;
    try {
      await apiFetch(`/inspection-groups/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ inspectorId: selectedInspectorId, roleInGroup: roleFilter || undefined, isLeader: addAsLeader }),
      });
      setSelectedInspectorId('');
      setRoleFilter('');
      setAddAsLeader(false);
      loadGroup();
    } catch (e: any) {
      setError(e.message || 'فشل إضافة العضو');
    }
  };

  const removeMember = async (memberId: number) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا العضو من الفرقة؟')) return;
    try {
      await apiFetch(`/inspection-groups/${id}/members/${memberId}`, { method: 'DELETE' });
      loadGroup();
    } catch (e: any) {
      setError(e.message || 'فشل إزالة العضو');
    }
  };

  const toggleLeader = async (memberId: number) => {
    try {
      await apiFetch(`/inspection-groups/members/${memberId}/toggle-leader`, { method: 'PUT' });
      loadGroup();
    } catch (e: any) {
      setError(e.message || 'فشل تبديل حالة القائد');
    }
  };

  const setPrimary = async (inspectorId: string) => {
    try {
      await apiFetch(`/inspection-groups/${id}/primary/${inspectorId}`, { method: 'PUT' });
      loadGroup();
    } catch (e: any) {
      setError(e.message || 'فشل تعيين الفرقة الرئيسية');
    }
  };

  const removePrimary = async (inspectorId: string) => {
    try {
      await apiFetch(`/inspection-groups/${inspectorId}/primary`, { method: 'DELETE' });
      loadGroup();
      setError('');
    } catch (e: any) {
      setError(e.message || 'فشل إلغاء الفرقة الرئيسية');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل بيانات الفرقة...</div>;

  if (!group) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-color)' }}>الفرقة غير موجودة</div>;

  const memberIds = group.members.map((m: any) => m.inspectorId);
  const availableInspectors = inspectors.filter((i: any) => !memberIds.includes(i.id));

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/inspection-groups')} className="btn-outline" style={{ marginBottom: '10px' }}>← العودة إلى الفرق</button>
          <h1 className="page-title">{group.name}</h1>
          <p className="page-subtitle">{group.code ? `الكود: ${group.code} — ` : ''}{group.description || ''}</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3>معلومات الفرقة</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ fontWeight: 'bold', padding: '8px 0', width: '140px' }}>الاسم:</td><td>{group.name}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '8px 0' }}>الكود:</td><td>{group.code || '—'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '8px 0' }}>الوصف:</td><td>{group.description || '—'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '8px 0' }}>المصدر:</td><td>{group.sourceReference || '—'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '8px 0' }}>عدد الأعضاء:</td><td>{group.memberCount}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '8px 0' }}>الحالة:</td><td><span className={`badge badge-${group.isActive ? 'success' : 'danger'}`}>{group.isActive ? 'نشطة' : 'معطلة'}</span></td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>إضافة عضو جديد</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <select value={selectedInspectorId} onChange={(e) => setSelectedInspectorId(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <option value="">-- اختر مفتشاً --</option>
              {availableInspectors.map((i: any) => (
                <option key={i.id} value={i.id}>{i.rank ? `${i.rank} ` : ''}{i.fullName}{i.department ? ` — ${i.department}` : ''}</option>
              ))}
            </select>
            <input type="text" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} placeholder="الدور في الفرقة (اختياري)" style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={addAsLeader} onChange={(e) => setAddAsLeader(e.target.checked)} />
              تعيين كقائد للزمرة
            </label>
            <button onClick={addMember} disabled={!selectedInspectorId} className="btn-primary" style={{ padding: '8px 15px' }}>
              + إضافة للفرقة
            </button>
          </div>
        </div>
      </div>

      {readiness && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>مؤشر جاهزية الفرقة</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', borderRadius: '12px', backgroundColor: readinessBg(readiness.readinessLevel) }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: readinessColor(readiness.readinessLevel) }}>
                {readiness.readinessScore}%
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: readinessColor(readiness.readinessLevel), marginTop: '4px' }}>
                {readinessLabel(readiness.readinessLevel)}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>تحليل المكونات</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>التوفر (%40)</span>
                    <span style={{ fontWeight: 600 }}>{readiness.availabilityScore}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.08)' }}>
                    <div style={{ width: `${readiness.availabilityScore}%`, height: '100%', borderRadius: '3px', backgroundColor: readiness.availabilityScore >= 80 ? '#10b981' : readiness.availabilityScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>عبء العمل (%35)</span>
                    <span style={{ fontWeight: 600 }}>{readiness.workloadScore}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.08)' }}>
                    <div style={{ width: `${readiness.workloadScore}%`, height: '100%', borderRadius: '3px', backgroundColor: readiness.workloadScore >= 80 ? '#10b981' : readiness.workloadScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>القيادة (%25)</span>
                    <span style={{ fontWeight: 600 }}>{readiness.leaderScore}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.08)' }}>
                    <div style={{ width: `${readiness.leaderScore}%`, height: '100%', borderRadius: '3px', backgroundColor: readiness.leaderScore >= 80 ? '#10b981' : readiness.leaderScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  👥 {readiness.availableMembers}/{readiness.totalMembers} متوفر
                </span>
                {readiness.overloadedMembers > 0 && (
                  <span style={{ fontSize: '12px', color: '#ef4444' }}>
                    ⚠️ {readiness.overloadedMembers} محمل فوق الطاقة
                  </span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {readiness.hasLeaderAssigned ? (readiness.leaderIsAvailable ? '👑 قائد متوفر' : '👑 قائد غير متوفر') : '🚫 لا يوجد قائد'}
                </span>
              </div>

              {readiness.issues && readiness.issues.length > 0 && (
                <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.08)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '6px' }}>المشكلات:</div>
                  <ul style={{ margin: 0, paddingRight: '20px', fontSize: '12px', lineHeight: '1.8', color: '#dc2626' }}>
                    {readiness.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {readiness.memberDetails && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>تفاصيل الأعضاء</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {readiness.memberDetails.map((m: any) => (
                      <div key={m.inspectorId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: m.availabilityStatus === 'AVAILABLE' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                        border: '1px solid',
                        borderColor: m.availabilityStatus === 'AVAILABLE' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {m.isLeader && <span style={{ fontSize: '14px' }}>👑</span>}
                          <div>
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>{m.fullName}</span>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {m.rank || ''}{m.rank && m.department ? ' — ' : ''}{m.department || ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {m.workloadLevel && (
                            <span style={{
                              fontSize: '11px', padding: '2px 8px', borderRadius: '12px',
                              backgroundColor: m.workloadLevel === 'OVERLOADED' ? 'rgba(239,68,68,0.1)' : m.workloadLevel === 'HEAVY' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                              color: m.workloadLevel === 'OVERLOADED' ? '#ef4444' : m.workloadLevel === 'HEAVY' ? '#f59e0b' : '#10b981',
                            }}>
                              {m.workloadLevel === 'OVERLOADED' ? 'محمل زائد' : m.workloadLevel === 'HEAVY' ? 'عبء عالي' : m.workloadLevel === 'NORMAL' ? 'طبيعي' : m.workloadLevel}
                            </span>
                          )}
                          <AvailabilityBadge status={m.availabilityStatus} />
                          {m.issues && m.issues.length > 0 && (
                            <span style={{ fontSize: '14px', cursor: 'pointer' }} title={m.issues.join(', ')}>⚠️</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>أعضاء الفرقة ({group.members.length})</h3>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'right' }}>الاسم</th>
              <th style={{ textAlign: 'right' }}>الرتبة</th>
              <th style={{ textAlign: 'right' }}>القسم</th>
              <th style={{ textAlign: 'center' }}>حالة التوفر</th>
              <th style={{ textAlign: 'right' }}>الدور</th>
              <th style={{ textAlign: 'center' }}>قائد</th>
              <th style={{ textAlign: 'center' }}>ترتيب</th>
              <th style={{ textAlign: 'center' }}>رئيسي</th>
              <th style={{ textAlign: 'center', width: '220px' }}>خيارات</th>
            </tr>
          </thead>
          <tbody>
            {group.members.map((m: any) => (
              <tr key={m.id}>
                <td><strong>{m.inspector.fullName}</strong></td>
                <td>{m.inspector.rank || '—'}</td>
                <td>{m.inspector.department || '—'}</td>
                <td style={{ textAlign: 'center' }}><AvailabilityBadge status={m.inspector.availabilityStatus} /></td>
                <td>{m.roleInGroup || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  {m.isLeader ? <span style={{ fontSize: '18px' }}>👑</span> : '—'}
                </td>
                <td style={{ textAlign: 'center' }}>{m.memberOrder || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  {group.primaryInspectors?.some((pi: any) => pi.id === m.inspectorId) ? (
                    <span className="badge badge-success">نعم</span>
                  ) : (
                    <span className="badge badge-light" style={{ backgroundColor: 'var(--bg-secondary)' }}>لا</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {!group.primaryInspectors?.some((pi: any) => pi.id === m.inspectorId) && (
                      <button onClick={() => setPrimary(m.inspectorId)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>تعيين رئيسي</button>
                    )}
                    {group.primaryInspectors?.some((pi: any) => pi.id === m.inspectorId) && (
                      <button onClick={() => removePrimary(m.inspectorId)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>إلغاء رئيسي</button>
                    )}
                    <button onClick={() => toggleLeader(m.id)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>{m.isLeader ? 'إلغاء قائد' : 'تعيين قائد'}</button>
                    <button onClick={() => navigate(`/inspectors/${m.inspector.id}/profile`)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>الملف</button>
                    <button onClick={() => removeMember(m.id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>إزالة</button>
                  </div>
                </td>
              </tr>
            ))}
            {group.members.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  لا يوجد أعضاء في هذه الفرقة بعد. استخدم قائمة إضافة عضو جديد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
