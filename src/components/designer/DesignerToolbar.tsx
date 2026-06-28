import React, { useState } from 'react';

export interface DesignerToolbarProps {
  selectedCampId: string;
  handleCampaignChange: (id: string) => void;
  campaigns: any[];
  saveDraftNow: (notice: string) => void;
  undo: () => void;
  canUndo: boolean;
  redo: () => void;
  canRedo: boolean;
  loadDraftForCurrentCampaign: () => void;
  availableDraft: any;
  startNewDraft: () => void;
  clearDesignerDraft: () => void;
  handleOfficialExportPdf: () => void;
  handleSnapshotExportPdf: () => void;
  handleOfficialExportWord: () => void;
  onReviewClick: () => void;
  reportPayload: any;
  officialExportStatus: 'idle' | 'exporting' | 'success' | 'error';
  officialExportError: string;
  snapshotExportStatus: 'idle' | 'exporting' | 'success' | 'error';
  snapshotExportError: string;
  snapshotExportProgress: { completed: number; total: number } | null;
  wordExportStatus: 'idle' | 'exporting' | 'success' | 'error';
  wordExportError: string;
  onToggleFormatting: () => void;
}

export const DesignerToolbar: React.FC<DesignerToolbarProps> = ({
  selectedCampId,
  handleCampaignChange,
  campaigns,
  saveDraftNow,
  undo: _undo,
  canUndo: _canUndo,
  redo: _redo,
  canRedo: _canRedo,
  loadDraftForCurrentCampaign,
  availableDraft,
  startNewDraft,
  clearDesignerDraft,
  handleOfficialExportPdf,
  handleSnapshotExportPdf,
  handleOfficialExportWord,
  onReviewClick,
  reportPayload,
  officialExportStatus,
  officialExportError,
  snapshotExportStatus,
  snapshotExportError,
  snapshotExportProgress,
  wordExportStatus,
  wordExportError,
  onToggleFormatting,
}) => {
  const [clearDraftPending, setClearDraftPending] = useState(false);

  const canExportPdf = Boolean(selectedCampId && reportPayload && officialExportStatus !== 'exporting');
  const canExportSnapshotPdf = Boolean(selectedCampId && reportPayload && snapshotExportStatus !== 'exporting');
  const canExportWord = Boolean(selectedCampId && reportPayload && wordExportStatus !== 'exporting');
  const canReview = Boolean(selectedCampId && reportPayload);

  const btnBase: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const btnExport: React.CSSProperties = {
    ...btnBase,
    borderColor: canExportPdf ? '#0f766e' : '#9ca3af',
    color: canExportPdf ? '#0f766e' : '#9ca3af',
    backgroundColor: canExportPdf ? '#f0fdfa' : '#f9fafb',
    cursor: canExportPdf ? 'pointer' : 'not-allowed',
    opacity: canExportPdf ? 1 : 0.65,
  };

  const btnExportWord: React.CSSProperties = {
    ...btnBase,
    borderColor: canExportWord ? '#1d4ed8' : '#9ca3af',
    color: canExportWord ? '#1d4ed8' : '#9ca3af',
    backgroundColor: canExportWord ? '#eff6ff' : '#f9fafb',
    cursor: canExportWord ? 'pointer' : 'not-allowed',
    opacity: canExportWord ? 1 : 0.65,
  };

  const btnSnapshotExport: React.CSSProperties = {
    ...btnBase,
    borderColor: canExportSnapshotPdf ? '#7c3aed' : '#9ca3af',
    color: canExportSnapshotPdf ? '#6d28d9' : '#9ca3af',
    backgroundColor: canExportSnapshotPdf ? '#f5f3ff' : '#f9fafb',
    cursor: canExportSnapshotPdf ? 'pointer' : 'not-allowed',
    opacity: canExportSnapshotPdf ? 1 : 0.65,
  };

  const btnDanger: React.CSSProperties = {
    ...btnBase,
    borderColor: '#dc2626',
    color: '#dc2626',
  };

  const btnDisabled = (disabled: boolean): React.CSSProperties => ({
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div
      style={{
        border: '1px solid #d8e0ea',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        padding: '12px 14px',
        marginBottom: '16px',
        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
        display: 'grid',
        gap: '10px',
      }}
    >
      {/* ── Row 1: Campaign + mode indicator ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ color: '#475569', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
          الحملة
        </label>
        <select
          value={selectedCampId}
          onChange={(e) => handleCampaignChange(e.target.value)}
          style={{
            minWidth: '280px',
            maxWidth: '520px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 10px',
            backgroundColor: '#ffffff',
            fontSize: '13px',
          }}
        >
          <option value="">اختر الحملة التفتيشية</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} [العدد: {c.formationNumber || 'غير متوفر'}]
            </option>
          ))}
        </select>
        <span
          style={{
            border: '1px solid #d8e0ea',
            borderRadius: '999px',
            padding: '5px 10px',
            color: '#5b21b6',
            backgroundColor: '#f5f3ff',
            fontSize: '12px',
            fontWeight: 800,
          }}
        >
          تحرير
        </span>
      </div>

      {/* ── Row 2: Production actions ── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Draft actions */}
        <button
          type="button"
          style={{ ...btnBase, ...btnDisabled(!selectedCampId) }}
          disabled={!selectedCampId}
          onClick={() => saveDraftNow('تم حفظ المسودة')}
        >
          حفظ المسودة
        </button>
        <button
          type="button"
          style={{ ...btnBase, ...btnDisabled(!selectedCampId || !availableDraft) }}
          disabled={!selectedCampId || !availableDraft}
          onClick={loadDraftForCurrentCampaign}
        >
          تحميل المسودة
        </button>
        <button
          type="button"
          style={{ ...btnBase, ...btnDisabled(!selectedCampId) }}
          disabled={!selectedCampId}
          onClick={startNewDraft}
        >
          مسودة جديدة
        </button>
        {clearDraftPending ? (
          <>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>حذف هذه المسودة؟</span>
            <button
              type="button"
              style={{ ...btnDanger, fontSize: '12px', padding: '6px 10px' }}
              onClick={() => { clearDesignerDraft(); setClearDraftPending(false); }}
            >
              نعم، حذف
            </button>
            <button
              type="button"
              style={{ ...btnBase, fontSize: '12px', padding: '6px 10px' }}
              onClick={() => setClearDraftPending(false)}
            >
              إلغاء
            </button>
          </>
        ) : (
          <button
            type="button"
            style={{ ...btnDanger, ...btnDisabled(!selectedCampId) }}
            disabled={!selectedCampId}
            onClick={() => setClearDraftPending(true)}
          >
            حذف المسودة
          </button>
        )}

        <span style={{ borderLeft: '1px solid #e2e8f0', height: '24px', display: 'inline-block', margin: '0 4px' }} />

        {/* Review */}
        <button
          type="button"
          style={{
            ...btnBase,
            borderColor: canReview ? '#7c3aed' : '#9ca3af',
            color: canReview ? '#7c3aed' : '#9ca3af',
            backgroundColor: canReview ? '#f5f3ff' : '#f9fafb',
            cursor: canReview ? 'pointer' : 'not-allowed',
            opacity: canReview ? 1 : 0.65,
          }}
          disabled={!canReview}
          onClick={onReviewClick}
          title={!selectedCampId || !reportPayload ? 'اختر الحملة أولاً' : 'مراجعة التقرير النهائي'}
        >
          مراجعة
        </button>

        {/* Export PDF */}
        <button
          type="button"
          style={btnExport}
          disabled={!canExportPdf}
          onClick={handleOfficialExportPdf}
          title={!selectedCampId || !reportPayload ? 'اختر الحملة أولاً' : 'تصدير التقرير بصيغة PDF'}
        >
          {officialExportStatus === 'exporting' ? 'جاري التصدير...' : 'تصدير PDF'}
        </button>
        {officialExportStatus === 'success' && (
          <span style={{ color: '#166534', fontSize: '12px', fontWeight: 700 }}>تم التنزيل</span>
        )}
        {officialExportStatus === 'error' && (
          <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 700 }} title={officialExportError}>
            تعذر التصدير، يرجى المحاولة مرة أخرى
          </span>
        )}

        {/* Snapshot PDF from the rendered Designer pages */}
        <button
          type="button"
          style={btnSnapshotExport}
          disabled={!canExportSnapshotPdf}
          onClick={handleSnapshotExportPdf}
          title={!selectedCampId || !reportPayload ? 'اختر الحملة أولاً' : 'تصدير صفحات المعاينة كما تظهر في المصمم'}
        >
          {snapshotExportStatus === 'exporting'
            ? `جاري إنشاء PDF مطابق للمعاينة...${snapshotExportProgress ? ` (${snapshotExportProgress.completed}/${snapshotExportProgress.total})` : ''}`
            : 'تصدير PDF مطابق للمعاينة'}
        </button>
        {snapshotExportStatus === 'success' && (
          <span style={{ color: '#166534', fontSize: '12px', fontWeight: 700 }}>تم تنزيل PDF المطابق للمعاينة</span>
        )}
        {snapshotExportStatus === 'error' && (
          <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 700, maxWidth: '520px', whiteSpace: 'normal' }} title={snapshotExportError}>
            {snapshotExportError || 'تعذر إنشاء PDF مطابق للمعاينة'}
          </span>
        )}

        {/* Export Word */}
        <button
          type="button"
          style={btnExportWord}
          disabled={!canExportWord}
          onClick={handleOfficialExportWord}
          title={!selectedCampId || !reportPayload ? 'اختر الحملة أولاً' : 'تصدير التقرير بصيغة Word'}
        >
          {wordExportStatus === 'exporting' ? 'جاري التصدير...' : 'تصدير Word'}
        </button>
        {wordExportStatus === 'success' && (
          <span style={{ color: '#166534', fontSize: '12px', fontWeight: 700 }}>تم التنزيل</span>
        )}
        {wordExportStatus === 'error' && (
          <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 700 }} title={wordExportError}>
            تعذر تصدير Word
          </span>
        )}

        {/* Formatting toggle */}
        <button
          type="button"
          style={btnBase}
          onClick={onToggleFormatting}
          title="تنسيق التقرير - أرقام الصفحات والترقيم"
        >
          تنسيق التقرير
        </button>

      </div>


    </div>
  );
};
