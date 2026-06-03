import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export const Review: React.FC = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewFindings, setReviewFindings] = useState('');

  const loadInspections = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inspections');
      setInspections(data.filter((insp: any) => insp.status !== 'draft'));
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const handleReviewAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    setError('');
    try {
      await apiFetch(`/inspections/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, findings: reviewFindings || undefined }),
      });
      setSelectedInspection(null);
      setReviewFindings('');
      loadInspections();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ قرار المراجعة');
    } finally {
      setActionLoading(false);
    }
  };

  const showDetails = async (id: string) => {
    try {
      const data = await apiFetch(`/inspections/${id}`);
      setSelectedInspection(data);
      setReviewFindings(data.findings || '');
    } catch (e: any) {
      setError('فشل تحميل تفاصيل التفتيش');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">مراجعة واعتماد التقييمات</h1>
          <p className="page-subtitle">مصادقة تقارير التفتيش الفردية أو إعادتها لإعادة التقييم</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل التفتيشات...</div>
      ) : (
        <div className="grid-2">
          {/* List of inspections */}
          <div className="card">
            <h3 className="m-b-15">طلبات التفتيش بانتظار الاعتماد</h3>
            <table>
              <thead>
                <tr>
                  <th>الكيان المفتش</th>
                  <th>الحملة</th>
                  <th>الدرجة</th>
                  <th>الحالة</th>
                  <th>خيارات</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => (
                  <tr key={insp.id}>
                    <td>
                      <strong>{insp.entity?.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>مكان: {insp.location}</div>
                    </td>
                    <td>{insp.campaign?.name}</td>
                    <td>{parseFloat(insp.totalScore).toFixed(1)}% ({insp.performanceRating})</td>
                    <td>
                      <span className={`badge badge-${insp.status === 'approved' ? 'success' : insp.status === 'rejected' ? 'danger' : 'warning'}`}>
                        {insp.status === 'approved' ? 'معتمد' : insp.status === 'rejected' ? 'مرفوض' : 'بانتظار المراجعة'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => showDetails(insp.id)}
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        عرض التفاصيل 🔍
                      </button>
                    </td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>لا توجد تقييمات تفتيش مدخلة في النظام حالياً.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inspection details & Review form */}
          <div>
            {selectedInspection ? (
              <div className="card" style={{ borderTop: '5px solid var(--primary-color)' }}>
                <div className="flex justify-between align-center m-b-20" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
                  <h3 style={{ color: 'var(--primary-color)' }}>🔎 تفاصيل تقييم الكيان: {selectedInspection.entity?.name}</h3>
                  <button onClick={() => setSelectedInspection(null)} style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>إغلاق ×</button>
                </div>

                <div className="grid-2 m-b-20" style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', fontSize: '13px' }}>
                  <div>
                    <div>الحملة: <strong>{selectedInspection.campaign?.name}</strong></div>
                    <div>المفتش: <strong>{selectedInspection.inspector?.fullName || 'غير محدد'}</strong></div>
                  </div>
                  <div>
                    <div>الدرجة الكلية: <strong style={{ color: 'var(--success-color)', fontSize: '16px' }}>{parseFloat(selectedInspection.totalScore).toFixed(1)}%</strong></div>
                    <div>التقدير اللفظي: <strong>{selectedInspection.performanceRating}</strong></div>
                  </div>
                </div>

                {/* Specific grades item list */}
                <h4 className="m-b-15">الدرجات التفصيلية المسجلة:</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                  {selectedInspection.grades && selectedInspection.grades.map((grade: any) => (
                    <div key={grade.id} style={{
                      padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#ffffff', fontSize: '12px'
                    }}>
                      <div className="flex justify-between">
                        <strong>{grade.criteriaDetail?.detailText}</strong>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{parseFloat(grade.gradeEarned)} / {parseFloat(grade.criteriaDetail?.maxGrade)}</span>
                      </div>
                      {grade.notes && <div style={{ color: 'var(--text-secondary)', marginTop: '3px', fontStyle: 'italic' }}>ملاحظة المفتش: {grade.notes}</div>}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>ملاحظات المراجعة والمصادقة النهائية</label>
                  <textarea
                    value={reviewFindings}
                    onChange={(e) => setReviewFindings(e.target.value)}
                    rows={3}
                    placeholder="اكتب التوجيهات أو الملاحظات الختامية حول هذا التقييم هنا..."
                  />
                </div>

                {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && selectedInspection.status === 'pendingReview' ? (
                  <div className="flex gap-15" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReviewAction(selectedInspection.id, 'rejected')}
                      className="btn-danger"
                      style={{ flex: 1 }}
                    >
                      {actionLoading ? 'جاري الحفظ...' : '❌ رفض التقييم وإعادته'}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReviewAction(selectedInspection.id, 'approved')}
                      className="btn-primary"
                      style={{ flex: 2 }}
                    >
                      {actionLoading ? 'جاري الاعتماد...' : '✅ مصادقة واعتماد التقييم'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', border: '1px dashed var(--border-color)', padding: '10px', borderRadius: '8px' }}>
                    {selectedInspection.status === 'approved' ? 'هذا التقييم معتمد ومصادق عليه بالكامل' : selectedInspection.status === 'rejected' ? 'هذا التقييم مرفوض ومعاد للمفتش' : 'ليست لديك صلاحية اعتماد التقييمات (للمسؤولين فقط)'}
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                قم باختيار تفتيش من القائمة اليمنى لعرض تفاصيله وإجراء المراجعة.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
