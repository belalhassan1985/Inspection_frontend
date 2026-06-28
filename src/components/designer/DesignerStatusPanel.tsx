import React from 'react';
import type { DraftSaveStatus } from './types';

export interface DesignerStatusPanelProps {
  draftStatus: DraftSaveStatus;
  lastDraftSavedAt: string | null;
  draftNotice: string;
  showDraftRestorePrompt: boolean;
  availableDraft: any;
  applyDraft: (draft: any, notice: string) => void;
  setShowDraftRestorePrompt: (show: boolean) => void;
  deleteCurrentDraft: () => void; // kept for API compatibility; accessible via Advanced Tools > Clear Draft
}

export const DesignerStatusPanel: React.FC<DesignerStatusPanelProps> = ({
  draftStatus,
  lastDraftSavedAt,
  draftNotice,
  showDraftRestorePrompt,
  availableDraft,
  applyDraft,
  setShowDraftRestorePrompt,
  deleteCurrentDraft: _deleteCurrentDraft,
}) => {
  const lastSavedLabel = lastDraftSavedAt ? new Date(lastDraftSavedAt).toLocaleString() : '';
  const draftStatusLabel =
    draftStatus === 'unsaved'
      ? 'تعديلات غير محفوظة'
      : draftStatus === 'saving'
        ? 'جاري الحفظ...'
        : draftStatus === 'saved'
          ? `تم حفظ المسودة: ${lastSavedLabel}`
          : draftStatus === 'error'
            ? 'تعذر حفظ المسودة'
            : lastSavedLabel
              ? `آخر حفظ: ${lastSavedLabel}`
              : 'لا توجد مسودة محفوظة لهذا التقرير';

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        <span
          style={{
            padding: '5px 10px',
            borderRadius: '999px',
            backgroundColor: draftStatus === 'unsaved' ? '#fef3c7' : draftStatus === 'error' ? '#fee2e2' : '#eef2f7',
            color: draftStatus === 'unsaved' ? '#92400e' : draftStatus === 'error' ? '#b91c1c' : '#475569',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {draftStatusLabel}
        </span>
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          يتم حفظ التعديلات كمسودة ويمكن اعتمادها عند تصدير التقرير.
        </span>
      </div>

      {draftNotice && (
        <div style={{ marginBottom: '14px', color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 10px', fontSize: '13px' }}>
          {draftNotice}
        </div>
      )}

      {showDraftRestorePrompt && availableDraft && (
        <div style={{ marginBottom: '14px', border: '1px solid #f59e0b', backgroundColor: '#fffbeb', color: '#92400e', borderRadius: '8px', padding: '12px' }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>
            توجد مسودة محفوظة لهذا التقرير، يمكنك استعادتها أو البدء من جديد.
          </strong>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => applyDraft(availableDraft, 'تمت استعادة المسودة')}
              style={{ padding: '7px 11px' }}
            >
              استعادة المسودة
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowDraftRestorePrompt(false)}
              style={{ padding: '7px 11px' }}
            >
              بدء جديد
            </button>
            <span style={{ fontSize: '12px' }}>{lastSavedLabel ? `آخر حفظ: ${lastSavedLabel}` : ''}</span>
          </div>
        </div>
      )}
    </>
  );
};
