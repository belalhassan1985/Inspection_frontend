import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { fetchRiskLevelOptions, getRiskLevelMap, hexToRgba } from '../services/riskLevelService';

export const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'recommendations' | 'appendices' | 'evaluation'>('info');

  // Modal forms states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ id: '', type: 'positive', text: '', parentNoteId: '' as string | null });

  const [showRecModal, setShowRecModal] = useState(false);
  const [recForm, setRecForm] = useState({ id: '', authorityName: '', recommendationText: '', parentRecId: '' as string | null, riskLevel: 'MEDIUM' as any });

  const [riskLevelOptions, setRiskLevelOptions] = useState<any[]>([]);
  const [riskMap, setRiskMap] = useState<Record<string, any>>({});

  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({ id: '', symbol: '', text: '' });

  const isEditable = user?.role === 'ADMIN' || user?.role === 'EDITOR' || user?.role === 'EVALUATOR';
  const isAdminOrEditor = user?.role === 'ADMIN' || user?.role === 'EDITOR';

  const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق'];

  const loadCampaign = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/campaigns/${id}`);
      setCampaign(data);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل تفاصيل اللجنة التفتيشية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
    fetchRiskLevelOptions().then(opts => {
      setRiskLevelOptions(opts);
      setRiskMap(getRiskLevelMap(opts));
    }).catch(() => {});
  }, [id]);

  // Notes CRUD Handlers
  const handleOpenNoteModal = (type: string, parentNoteId: string | null = null, editNote: any = null) => {
    if (editNote) {
      setNoteForm({ id: editNote.id, type: editNote.type, text: editNote.text, parentNoteId: editNote.parentNoteId });
    } else {
      setNoteForm({ id: '', type, text: '', parentNoteId });
    }
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.text.trim()) return;

    try {
      if (noteForm.id) {
        // Edit Note
        await apiFetch(`/campaigns/notes/${noteForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({ text: noteForm.text, sortOrder: 0 }),
        });
      } else {
        // Add Note
        await apiFetch(`/campaigns/${id}/notes`, {
          method: 'POST',
          body: JSON.stringify({
            type: noteForm.type,
            text: noteForm.text,
            parentNoteId: noteForm.parentNoteId,
            sortOrder: 0,
          }),
        });
      }
      setShowNoteModal(false);
      loadCampaign();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الملاحظة');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة (وسيتم حذف جميع البنود الفرعية التابعة لها تلقائياً)؟')) return;
    try {
      await apiFetch(`/campaigns/notes/${noteId}`, { method: 'DELETE' });
      loadCampaign();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الملاحظة');
    }
  };

  // Recommendations CRUD Handlers
  const handleOpenRecModal = (parentRecId: string | null = null, editRec: any = null, defaultAuthName = '') => {
    if (editRec) {
      setRecForm({
        id: editRec.id,
        authorityName: editRec.authorityName || '',
        recommendationText: editRec.recommendationText || '',
        parentRecId: editRec.parentRecId,
        riskLevel: editRec.riskLevel || 'MEDIUM',
      });
    } else {
      setRecForm({
        id: '',
        authorityName: defaultAuthName,
        recommendationText: '',
        parentRecId,
        riskLevel: 'MEDIUM',
      });
    }
    setShowRecModal(true);
  };

  const handleSaveRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (recForm.id) {
        // Edit
        await apiFetch(`/campaigns/recommendations/${recForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            authorityName: recForm.authorityName,
            recommendationText: recForm.recommendationText,
            riskLevel: recForm.riskLevel,
            sortOrder: 0,
          }),
        });
      } else {
        // Add
        await apiFetch(`/campaigns/${id}/recommendations`, {
          method: 'POST',
          body: JSON.stringify({
            authorityName: recForm.authorityName,
            recommendationText: recForm.recommendationText,
            parentRecId: recForm.parentRecId,
            riskLevel: recForm.riskLevel,
            sortOrder: 0,
          }),
        });
      }
      setShowRecModal(false);
      loadCampaign();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التوصية');
    }
  };

  const handleDeleteRecommendation = async (recId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البند التوصياتي؟')) return;
    try {
      await apiFetch(`/campaigns/recommendations/${recId}`, { method: 'DELETE' });
      loadCampaign();
    } catch (err: any) {
      alert(err.message || 'فشل حذف التوصية');
    }
  };

  // Appendices CRUD Handlers
  const handleOpenAppModal = (editApp: any = null) => {
    if (editApp) {
      setAppForm({ id: editApp.id, symbol: editApp.symbol, text: editApp.text });
    } else {
      const nextIndex = campaign?.appendices?.length || 0;
      const nextSymbol = arabicLetters[nextIndex] || String(nextIndex + 1);
      setAppForm({ id: '', symbol: nextSymbol, text: '' });
    }
    setShowAppModal(true);
  };

  const handleSaveAppendix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.text.trim()) return;

    try {
      if (appForm.id) {
        // Edit
        await apiFetch(`/campaigns/appendices/${appForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({ symbol: appForm.symbol, text: appForm.text }),
        });
      } else {
        // Add
        await apiFetch(`/campaigns/${id}/appendices`, {
          method: 'POST',
          body: JSON.stringify({ symbol: appForm.symbol, text: appForm.text }),
        });
      }
      setShowAppModal(false);
      loadCampaign();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الملحق');
    }
  };

  const handleDeleteAppendix = async (appId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الملحق؟')) return;
    try {
      await apiFetch(`/campaigns/appendices/${appId}`, { method: 'DELETE' });
      loadCampaign();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الملحق');
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', direction: 'rtl' }}>جاري تحميل تفاصيل اللجنة...</div>;
  }

  if (error || !campaign) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-color)', direction: 'rtl' }}>
        ⚠️ {error || 'اللجنة المطلوبة غير موجودة'}
        <br />
        <button onClick={() => navigate('/campaigns')} className="btn-outline m-t-20">عودة لقائمة اللجان</button>
      </div>
    );
  }

  // Group Notes by type
  const notesByType = {
    positive: campaign.notes?.filter((n: any) => n.type === 'positive' && !n.parentNoteId) || [],
    negative: campaign.notes?.filter((n: any) => n.type === 'negative' && !n.parentNoteId) || [],
    obstacle: campaign.notes?.filter((n: any) => n.type === 'obstacle' && !n.parentNoteId) || [],
    impediment: campaign.notes?.filter((n: any) => n.type === 'impediment' && !n.parentNoteId) || [],
  };

  // Group Recommendations by Authority (Level 0)
  // Level 0: recommendations where parentRecId is null.
  // Level 1: child of Level 0.
  // Level 2: child of Level 1.
  const authorities = campaign.recommendations?.filter((r: any) => !r.parentRecId) || [];

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">تفاصيل اللجنة التفتيشية</h1>
          <p className="page-subtitle">
            اللجنة رقم: <strong style={{ color: 'var(--secondary-color)' }}>{campaign.assignmentReference}</strong> | الجهة: <strong>{campaign.entity?.name || 'غير محددة'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/campaigns')} className="btn-outline">
            ⬅️ عودة للقائمة
          </button>
          <button
            onClick={() => navigate('/reports', { state: { campaignId: campaign.id } })}
            className="btn-secondary"
          >
            🖨️ الطباعة والتصدير
          </button>
        </div>
      </div>

      {/* Campaign Metadata Cards (Sections 1 to 5) */}
      <div className="card m-b-20" style={{ borderRight: '6px solid var(--secondary-color)', padding: '20px' }}>
        <h3 style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px', color: 'var(--primary-color)', marginBottom: '15px' }}>
          📋 البيانات الإدارية الأساسية وتشكيل اللجنة
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Section 1: التكليف والأمر الإداري */}
          <div>
            <h4 style={{ color: 'var(--primary-light)', marginBottom: '6px', fontSize: '14px' }}>1. الأمر الإداري والتكليف</h4>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '6px', fontSize: '13px' }}>
              <div><strong>رقم كتاب التكليف:</strong> {campaign.assignmentReference}</div>
              <div><strong>تاريخ التكليف:</strong> {campaign.assignmentDate ? campaign.assignmentDate.substring(0, 10) : 'غير محدد'}</div>
              <div><strong>رقم التشكيل الإداري:</strong> {campaign.formationNumber || 'غير محدد'}</div>
              <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', whiteSpace: 'pre-line' }}>
                <strong>نص الأمر الصادر:</strong><br />
                {campaign.assignmentText}
              </div>
            </div>
          </div>

          {/* Section 2: التأليف وتفاصيل الأعضاء */}
          <div>
            <h4 style={{ color: 'var(--primary-light)', marginBottom: '6px', fontSize: '14px' }}>2. تأليف وهيكلية اللجنة</h4>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '6px', fontSize: '13px' }}>
              <div>👤 <strong>رئيس اللجنة (المفتش):</strong> {campaign.leader?.fullName || 'غير معين'}</div>
              <div>👤 <strong>المقرر/المعاون:</strong> {campaign.deputy?.fullName || 'غير معين'}</div>
              <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <strong>أعضاء المفتشية الآخرين:</strong>
                {campaign.members && campaign.members.length > 0 ? (
                  <ul style={{ margin: '5px 15px 0 0', padding: 0, listStyleType: 'circle' }}>
                    {campaign.members.map((m: any) => (
                      <li key={m.inspectorId}>{m.inspector?.fullName}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: '#718096', marginRight: '5px' }}>لا يوجد أعضاء إضافيين</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3, 4, 5: الغاية، الجهة، التواريخ */}
          <div>
            <h4 style={{ color: 'var(--primary-light)', marginBottom: '6px', fontSize: '14px' }}>3. غاية وجهة وفترة التفتيش</h4>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>🎯 <strong>الغاية والأهداف العامة:</strong> {campaign.purpose || 'غير محددة'}</div>
              <div>🏢 <strong>الجهة التنظيمية المستهدفة:</strong> <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{campaign.entity?.name || 'غير محددة'}</span></div>
              <div>📅 <strong>فترة التفتيش الميداني:</strong>
                <div style={{ marginRight: '10px', color: 'var(--text-secondary)' }}>
                  من: {campaign.startDate ? campaign.startDate.substring(0, 10) : '—'} <br />
                  إلى: {campaign.endDate ? campaign.endDate.substring(0, 10) : 'مستمر'}
                </div>
              </div>
              <div>🏷️ <strong>حالة اللجنة الحالية:</strong> 
                <span style={{ marginRight: '6px' }} className={`badge badge-${campaign.status === 'active' ? 'success' : campaign.status === 'completed' ? 'info' : 'danger'}`}>
                  {campaign.status === 'active' ? 'نشطة' : campaign.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '20px', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn-outline ${activeTab === 'info' ? 'active' : ''}`}
          style={{ padding: '10px 20px', borderBottom: activeTab === 'info' ? '3px solid var(--secondary-color)' : 'none', borderRadius: '6px 6px 0 0' }}
        >
          📄 التقرير الإداري العام
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`btn-outline ${activeTab === 'notes' ? 'active' : ''}`}
          style={{ padding: '10px 20px', borderBottom: activeTab === 'notes' ? '3px solid var(--secondary-color)' : 'none', borderRadius: '6px 6px 0 0' }}
        >
          🔍 6. الملاحظات والمشاهدات ({campaign.notes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`btn-outline ${activeTab === 'recommendations' ? 'active' : ''}`}
          style={{ padding: '10px 20px', borderBottom: activeTab === 'recommendations' ? '3px solid var(--secondary-color)' : 'none', borderRadius: '6px 6px 0 0' }}
        >
          💡 7. التوصيات والجهات ({campaign.recommendations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('appendices')}
          className={`btn-outline ${activeTab === 'appendices' ? 'active' : ''}`}
          style={{ padding: '10px 20px', borderBottom: activeTab === 'appendices' ? '3px solid var(--secondary-color)' : 'none', borderRadius: '6px 6px 0 0' }}
        >
          📎 8. الملاحق المستندية ({campaign.appendices?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`btn-outline ${activeTab === 'evaluation' ? 'active' : ''}`}
          style={{ padding: '10px 20px', borderBottom: activeTab === 'evaluation' ? '3px solid var(--secondary-color)' : 'none', borderRadius: '6px 6px 0 0' }}
        >
          ⭐ 9. التقييم الفني الميداني
        </button>
      </div>

      {/* Tab Panels */}
      
      {/* 1. Administrative report overview info tab */}
      {activeTab === 'info' && (
        <div className="card">
          <h3 className="m-b-15">ملخص المسار الإداري للجنة</h3>
          <p>
            تأسست هذه اللجنة بناءً على توجيهات وزارة الداخلية / هيئة التفتيش العام لتقييم أداء الكيان التنظيمي 
            (<strong>{campaign.entity?.name}</strong>) في شتى الجوانب الفنية والعملياتية والإدارية.
          </p>
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
            <h4>الأقسام التنظيمية العشرة للنظام القديم:</h4>
            <ol style={{ paddingRight: '20px', lineHeight: '2' }}>
              <li><strong>التكليف:</strong> موثق ومثبت في لوحة البيانات الإدارية.</li>
              <li><strong>التأليف:</strong> تم تشكيل القوة التفتيشية وتخصيص رئيس ومقرر وأعضاء اللجنة.</li>
              <li><strong>الغاية:</strong> تقييم شامل للأداء وتوثيق الجاهزية والضبط.</li>
              <li><strong>الجهة:</strong> مستهدفة ومحددة في شجرة التشكيل.</li>
              <li><strong>تاريخ التفتيش:</strong> محدد للفترة الميدانية للرصد والمطابقة.</li>
              <li><strong>الملاحظات:</strong> الإيجابيات، السلبيات، المعاضل، المعوقات (متوفرة في علامة التبويب الثانية).</li>
              <li><strong>التوصيات:</strong> موجهة ومقسمة حسب الجهة ذات الصلاحية لمعالجة المشكلات (تبويب 3).</li>
              <li><strong>الملاحق:</strong> الوثائق والملفات والمستندات الثبوتية المرفقة بالتقرير (تبويب 4).</li>
              <li><strong>التقييم:</strong> الدرجات الفنية والتدقيقية للبنود المعيارية المعتمدة (تبويب 5).</li>
              <li><strong>الطباعة والتصدير:</strong> زر تصدير التقرير PDF بتبويب 5 وبأعلى الصفحة.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 6. Notes Tab with Nested CRUD */}
      {activeTab === 'notes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>6. الملاحظات الختامية والمشاهدات الميدانية للجنة</h3>
            {isEditable && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenNoteModal('positive')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>+ إيجابية</button>
                <button onClick={() => handleOpenNoteModal('negative')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>+ سلبية</button>
                <button onClick={() => handleOpenNoteModal('obstacle')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>+ معضلة</button>
                <button onClick={() => handleOpenNoteModal('impediment')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>+ عائق</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Positives Card */}
            <div className="card" style={{ borderRight: '5px solid var(--success-color)' }}>
              <h4 style={{ color: 'var(--success-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>🟢 الإيجابيات (نقاط القوة المرصودة)</span>
              </h4>
              {renderNotesList(notesByType.positive, 'positive')}
            </div>

            {/* Negatives Card */}
            <div className="card" style={{ borderRight: '5px solid var(--accent-color)' }}>
              <h4 style={{ color: 'var(--accent-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                🔴 السلبيات (نقاط الضعف والمخالفات)
              </h4>
              {renderNotesList(notesByType.negative, 'negative')}
            </div>

            {/* Obstacles Card */}
            <div className="card" style={{ borderRight: '5px solid var(--secondary-color)' }}>
              <h4 style={{ color: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                🟠 المعاضل (المشاكل الهيكلية الكبيرة)
              </h4>
              {renderNotesList(notesByType.obstacle, 'obstacle')}
            </div>

            {/* Impediments Card */}
            <div className="card" style={{ borderRight: '5px solid #4a5568' }}>
              <h4 style={{ color: '#4a5568', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                ⚫ المعوقات (الصعوبات الخارجية والتحديات)
              </h4>
              {renderNotesList(notesByType.impediment, 'impediment')}
            </div>

          </div>
        </div>
      )}

      {/* 7. Recommendations Tab with Nested CRUD */}
      {activeTab === 'recommendations' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>7. التوصيات المقترحة لحل المشكلات والسلبيات</h3>
            {isEditable && (
              <button onClick={() => handleOpenRecModal(null, null, '')} className="btn-primary">
                + إضافة جهة للتوصيات
              </button>
            )}
          </div>

          {authorities.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              لا توجد توصيات مسجلة لهذه اللجنة.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {authorities.map((auth: any) => {
                // Get Level 1 recommendations (children of this authority)
                const lvl1Recs = campaign.recommendations?.filter((r: any) => r.parentRecId === auth.id) || [];

                return (
                  <div key={auth.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', backgroundColor: '#fcfcfc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        🏛️ الجهة ذات الصلاحية: {auth.authorityName}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isEditable && (
                          <>
                            <button
                              onClick={() => handleOpenRecModal(auth.id, null, auth.authorityName)}
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              + إضافة توصية رئيسية
                            </button>
                            <button
                              onClick={() => handleOpenRecModal(null, auth, auth.authorityName)}
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            >
                              تعديل ✏️
                            </button>
                            {isAdminOrEditor && (
                              <button
                                onClick={() => handleDeleteRecommendation(auth.id)}
                                className="btn-danger"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                حذف 🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {lvl1Recs.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#a0aec0', margin: '5px 0' }}>لا يوجد توصيات رئيسية مضافة تحت هذه الجهة بعد.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '15px' }}>
                        {lvl1Recs.map((rec: any, rIdx: number) => {
                          // Get Level 2 subpoints (children of this recommendation)
                          const lvl2Subpoints = campaign.recommendations?.filter((r: any) => r.parentRecId === rec.id) || [];

                          return (
                            <div key={rec.id} style={{ borderRight: '3px solid var(--secondary-color)', paddingRight: '10px', backgroundColor: '#f7fafc', padding: '8px 12px', borderRadius: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                  {rIdx + 1}. {rec.recommendationText}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '10px' }}>
                                  {rec.riskLevel && (
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px',
                                      fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                                      color: riskMap[rec.riskLevel]?.color || '#718096',
                                      backgroundColor: riskMap[rec.riskLevel] ? hexToRgba(riskMap[rec.riskLevel].color, 0.1) : 'rgba(113,128,150,0.1)',
                                    }}>
                                      {riskMap[rec.riskLevel]?.nameAr || rec.riskLevel}
                                    </span>
                                  )}
                                  {isEditable && (
                                    <>
                                      <button
                                        onClick={() => handleOpenRecModal(rec.id, null, auth.authorityName)}
                                        className="btn-outline"
                                        style={{ padding: '2px 6px', fontSize: '10px' }}
                                      >
                                        + نقطة فرعية
                                      </button>
                                      <button
                                        onClick={() => handleOpenRecModal(null, rec, auth.authorityName)}
                                        className="btn-outline"
                                        style={{ padding: '2px 6px', fontSize: '10px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                                      >
                                        ✏️
                                      </button>
                                      {isAdminOrEditor && (
                                        <button
                                          onClick={() => handleDeleteRecommendation(rec.id)}
                                          className="btn-danger"
                                          style={{ padding: '2px 6px', fontSize: '10px' }}
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {lvl2Subpoints.length > 0 && (
                                <ul style={{ listStyleType: 'square', marginRight: '20px', marginTop: '6px', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {lvl2Subpoints.map((sub: any) => (
                                      <li key={sub.id} style={{ fontSize: '12.5px', color: '#4a5568' }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                         <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                           <span>• {sub.recommendationText}</span>
{sub.riskLevel && (
                                              <span style={{
                                                display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: '999px',
                                                fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
                                                color: riskMap[sub.riskLevel]?.color || '#718096',
                                                backgroundColor: riskMap[sub.riskLevel] ? hexToRgba(riskMap[sub.riskLevel].color, 0.1) : 'rgba(113,128,150,0.1)',
                                              }}>
                                                {riskMap[sub.riskLevel]?.nameAr || sub.riskLevel}
                                              </span>
                                            )}
                                         </span>
                                         <div style={{ display: 'flex', gap: '4px', marginRight: '10px' }}>
                                          {isEditable && (
                                            <>
                                              <button
                                                onClick={() => handleOpenRecModal(null, sub, auth.authorityName)}
                                                className="btn-outline"
                                                style={{ padding: '1px 4px', fontSize: '9px' }}
                                              >
                                                ✏️
                                              </button>
                                              {isAdminOrEditor && (
                                                <button
                                                  onClick={() => handleDeleteRecommendation(sub.id)}
                                                  className="btn-danger"
                                                  style={{ padding: '1px 4px', fontSize: '9px' }}
                                                >
                                                  🗑️
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. Appendices Tab with CRUD */}
      {activeTab === 'appendices' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>8. الملاحق المستندية والإيضاحات الإضافية</h3>
            {isEditable && (
              <button onClick={() => handleOpenAppModal()} className="btn-primary">
                + إضافة ملحق مستندي
              </button>
            )}
          </div>

          {!campaign.appendices || campaign.appendices.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              لا يوجد ملاحق مستندية مضافة للتقرير حالياً.
            </div>
          ) : (
            <table style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px', textAlign: 'center' }}>رمز الملحق</th>
                  <th style={{ textAlign: 'right' }}>نص ومضمون الملحق</th>
                  {isEditable && <th style={{ width: '150px', textAlign: 'center' }}>العمليات</th>}
                </tr>
              </thead>
              <tbody>
                {campaign.appendices.map((app: any) => (
                  <tr key={app.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--secondary-color)', fontSize: '18px' }}>
                      الملحق ({app.symbol})
                    </td>
                    <td style={{ fontSize: '13.5px', whiteSpace: 'pre-line' }}>{app.text}</td>
                    {isEditable && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenAppModal(app)}
                            className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                          >
                            تعديل ✏️
                          </button>
                          {isAdminOrEditor && (
                            <button
                              onClick={() => handleDeleteAppendix(app.id)}
                              className="btn-danger"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              حذف 🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 9. Evaluation Results Tab */}
      {activeTab === 'evaluation' && (
        <div className="card">
          <h3 className="m-b-15">9. نتائج التقييم الفني ودرجات معايير التفتيش</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            تشتمل هذه النافذة على التقديرات الفنية المحتسبة للكيان الخاضع للتفتيش بناءً على استمارة التدقيق الميداني.
          </p>

          {!campaign.inspections || campaign.inspections.length === 0 ? (
            <div style={{
              padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px',
              backgroundColor: 'rgba(212, 175, 55, 0.03)'
            }}>
              <span style={{ fontSize: '32px' }}>⭐</span>
              <h4 style={{ color: 'var(--primary-color)', marginTop: '10px' }}>لا توجد استمارات تقييم مسجلة لهذه اللجنة حتى الآن</h4>
              <p style={{ fontSize: '13px', color: '#718096', maxWidth: '500px', margin: '8px auto 20px auto' }}>
                يتطلب احتساب النسبة الفنية للجنة إجراء التدقيق الميداني وتدوين درجات المحاور الأساسية في ورقة الفحص.
              </p>
              {isEditable && (
                <button
                  onClick={() => navigate('/inspections', { state: { campaignId: campaign.id } })}
                  className="btn-primary"
                  style={{ padding: '10px 25px' }}
                >
                  الذهاب إلى صفحة التقييم والتدقيق الفني
                </button>
              )}
            </div>
          ) : (
            <div>
              <table className="m-b-20">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>الكيان الخاضع للتقييم</th>
                    <th style={{ textAlign: 'right' }}>المفتش القائم بالتدقيق</th>
                    <th style={{ textAlign: 'right' }}>تاريخ التسجيل</th>
                    <th style={{ textAlign: 'center' }}>الدرجة النهائية</th>
                    <th style={{ textAlign: 'center' }}>التقدير اللفظي</th>
                    <th style={{ textAlign: 'center' }}>حالة المصادقة</th>
                    <th style={{ textAlign: 'center' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.inspections.map((insp: any) => (
                    <tr key={insp.id}>
                      <td style={{ fontWeight: 'bold' }}>{insp.entity?.name}</td>
                      <td>{insp.inspector?.fullName || 'غير متوفر'}</td>
                      <td>{insp.createdAt ? insp.createdAt.substring(0, 10) : '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--success-color)', fontSize: '16px' }}>
                        {parseFloat(insp.totalScore).toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'center' }}>{insp.performanceRating || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${insp.status === 'approved' ? 'success' : insp.status === 'pendingReview' ? 'warning' : 'danger'}`}>
                          {insp.status === 'approved' ? 'مصادق' : insp.status === 'pendingReview' ? 'قيد المراجعة' : 'مرفوض'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => navigate('/review', { state: { inspectionId: insp.id } })}
                          className="btn-outline"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          عرض الورقة التفصيلية 🔍
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {isEditable && (
                  <button
                    onClick={() => navigate('/inspections', { state: { campaignId: campaign.id } })}
                    className="btn-primary"
                    style={{ fontSize: '13px' }}
                  >
                    + إضافة استمارة تقييم جديدة
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTES MODAL */}
      {showNoteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', borderTop: '6px solid var(--primary-color)' }}>
            <h3 style={{ color: 'var(--primary-color)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
              {noteForm.id ? 'تعديل الملاحظة الميدانية' : noteForm.parentNoteId ? 'إضافة ملاحظة فرعية (Level 2)' : 'إضافة ملاحظة رئيسية (Level 1)'}
            </h3>
            <form onSubmit={handleSaveNote} style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>نوع الملاحظة</label>
                <select
                  value={noteForm.type}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, type: e.target.value }))}
                  disabled={!!noteForm.parentNoteId || !!noteForm.id}
                  required
                >
                  <option value="positive">إيجابية 🟢</option>
                  <option value="negative">سلبية 🔴</option>
                  <option value="obstacle">معضلة 🟠</option>
                  <option value="impediment">عائق ⚫</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>نص الملاحظة والمضمون الميداني</label>
                <textarea
                  value={noteForm.text}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, text: e.target.value }))}
                  rows={4}
                  placeholder="اكتب تفاصيل الملاحظة هنا..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowNoteModal(false)} className="btn-outline">إلغاء</button>
                <button type="submit" className="btn-primary">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS MODAL */}
      {showRecModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', borderTop: '6px solid var(--primary-color)' }}>
            <h3 style={{ color: 'var(--primary-color)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
              {recForm.id ? 'تعديل التوصية' : recForm.parentRecId ? 'إضافة نقطة فرعية' : 'إضافة توصية رئيسية'}
            </h3>
            <form onSubmit={handleSaveRecommendation} style={{ marginTop: '15px' }}>
              
              {!recForm.parentRecId && (
                <div className="form-group">
                  <label>اسم جهة الصلاحية المعنية بالتطبيق</label>
                  <input
                    type="text"
                    value={recForm.authorityName}
                    onChange={(e) => setRecForm(prev => ({ ...prev, authorityName: e.target.value }))}
                    placeholder="مثال: مكتب معالي الوزير، مديرية المرور العامة..."
                    required
                    disabled={!!recForm.parentRecId && !recForm.id}
                  />
                </div>
              )}

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>{recForm.parentRecId ? 'نص النقطة الفرعية' : 'مضمون ونص التوصية الرئيسية'}</label>
                <textarea
                  value={recForm.recommendationText}
                  onChange={(e) => setRecForm(prev => ({ ...prev, recommendationText: e.target.value }))}
                  rows={4}
                  placeholder="اكتب نص التوصية بوضوح وصياغة إدارية عسكرية رسمية..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>مستوى الخطورة</label>
                  <select
                    value={recForm.riskLevel}
                    onChange={(e) => setRecForm(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                    required
                  >
                    {riskLevelOptions.filter(o => o.isActive).map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.nameAr}</option>
                    ))}
                  </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowRecModal(false)} className="btn-outline">إلغاء</button>
                <button type="submit" className="btn-primary">حفظ التوصية</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPENDICES MODAL */}
      {showAppModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', borderTop: '6px solid var(--primary-color)' }}>
            <h3 style={{ color: 'var(--primary-color)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
              {appForm.id ? 'تعديل الملحق المستندي' : 'إضافة ملحق مستندي جديد'}
            </h3>
            <form onSubmit={handleSaveAppendix} style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>رمز الملحق (أ، ب، ج، إلخ)</label>
                <input
                  type="text"
                  value={appForm.symbol}
                  onChange={(e) => setAppForm(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="أ"
                  maxLength={5}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>تفاصيل ومحتوى الملحق</label>
                <textarea
                  value={appForm.text}
                  onChange={(e) => setAppForm(prev => ({ ...prev, text: e.target.value }))}
                  rows={5}
                  placeholder="اكتب مضمون الملحق، مثل تفاصيل البيانات الإحصائية، المستندات المرفقة، أو محاضر الجرد العيني..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAppModal(false)} className="btn-outline">إلغاء</button>
                <button type="submit" className="btn-primary">حفظ الملحق</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render hierarchical notes list
  function renderNotesList(parentNotes: any[], type: string) {
    if (parentNotes.length === 0) {
      return <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '15px 0' }}>لا يوجد بنود مسجلة.</p>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
        {parentNotes.map((note: any, index: number) => {
          // Get children of this note
          const subNotes = campaign.notes?.filter((n: any) => n.parentNoteId === note.id) || [];

          return (
            <div key={note.id} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600 }}>
                  {index + 1}. {note.text}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginRight: '10px', flexShrink: 0 }}>
                  {isEditable && (
                    <>
                      <button
                        onClick={() => handleOpenNoteModal(type, note.id)}
                        className="btn-outline"
                        style={{ padding: '2px 5px', fontSize: '9px' }}
                      >
                        + تفريع
                      </button>
                      <button
                        onClick={() => handleOpenNoteModal(type, null, note)}
                        className="btn-outline"
                        style={{ padding: '2px 5px', fontSize: '9px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                      >
                        ✏️
                      </button>
                      {isAdminOrEditor && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="btn-danger"
                          style={{ padding: '2px 5px', fontSize: '9px' }}
                        >
                          🗑️
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Render sub-notes */}
              {subNotes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginRight: '20px', marginTop: '8px' }}>
                  {subNotes.map((sub: any) => (
                    <div key={sub.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '4px', borderRight: '2px solid #cbd5e0'
                    }}>
                      <span style={{ fontSize: '12.5px', color: '#4a5568' }}>
                        - {sub.text}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', marginRight: '10px' }}>
                        {isEditable && (
                          <>
                            <button
                              onClick={() => handleOpenNoteModal(type, null, sub)}
                              className="btn-outline"
                              style={{ padding: '1px 4px', fontSize: '8px' }}
                            >
                              ✏️
                            </button>
                            {isAdminOrEditor && (
                              <button
                                onClick={() => handleDeleteNote(sub.id)}
                                className="btn-danger"
                                style={{ padding: '1px 4px', fontSize: '8px' }}
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
};
