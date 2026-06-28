import React, { useState, useEffect, useCallback } from 'react';
import { useOfficialPrintReview } from './useOfficialPrintReview';

interface OfficialPrintReviewProps {
  campaignId: string;
  campaignName: string;
  overridePayload?: Record<string, unknown>;
  onReturnToEdit: () => void;
  onConfirmExport: (campaignId: string) => void;
}

const MODAL_OVERLAY: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  direction: 'rtl',
};

const MODAL_CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
  maxWidth: '900px',
  width: '92vw',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const HEADER: React.CSSProperties = {
  padding: '18px 24px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
};

const HEADER_TITLE: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 800,
  color: '#0c2340',
};

const BODY: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const FOOTER: React.CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
};

const BTN_BASE: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const BTN_PRIMARY: React.CSSProperties = {
  ...BTN_BASE,
  backgroundColor: '#0f766e',
  color: '#ffffff',
  borderColor: '#0f766e',
};

const BTN_SECONDARY: React.CSSProperties = {
  ...BTN_BASE,
  backgroundColor: '#ffffff',
  color: '#334155',
};

const STATE_BADGE: Record<string, React.CSSProperties> = {
  generating: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' },
  ready: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
  confirmed: { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #60a5fa' },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
  stale: { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
};

const STATE_LABELS: Record<string, string> = {
  generating: 'جاري التوليد...',
  ready: 'جاهز للمراجعة',
  confirmed: 'تم التأكيد',
  error: 'خطأ',
  stale: 'منتهي الصلاحية',
  idle: '',
};

const WARNING_ICONS: Record<string, string> = {
  'table-split': '⚠️',
  'section-across-pages': '📄',
  'signature-not-final': '🔴',
  'orphan-section-start': '⚠️',
};

const WarningRow: React.FC<{ w: { type: string; page: number; message: string } }> = ({ w }) => (
  <div
    style={{
      padding: '8px 12px',
      backgroundColor: '#fffbeb',
      borderRight: '4px solid #f59e0b',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#78350f',
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
    }}
  >
    <span style={{ fontSize: '16px', flexShrink: 0 }}>{WARNING_ICONS[w.type] || '📌'}</span>
    <span>{w.message}</span>
  </div>
);

export const OfficialPrintReview: React.FC<OfficialPrintReviewProps> = ({
  campaignId,
  campaignName,
  overridePayload,
  onReturnToEdit,
  onConfirmExport,
}) => {
  const {
    reviewState,
    reviewSession,
    pdfBlobUrl,
    errorMessage,
    generateReview,
    confirmReview,
    discardReview,
    reset,
  } = useOfficialPrintReview();

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    generateReview(campaignId, overridePayload);
    return () => { reset(); };
  }, [campaignId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reviewSession?.pageCount]);

  const handleClose = useCallback(() => {
    discardReview(campaignId).then(() => onReturnToEdit());
  }, [campaignId, discardReview, onReturnToEdit]);

  const handleConfirm = useCallback(async () => {
    await confirmReview(campaignId);
  }, [campaignId, confirmReview]);

  const session = reviewSession;
  const stateBadge = STATE_BADGE[reviewState] || STATE_BADGE.error;
  const stateLabel = STATE_LABELS[reviewState] || '';
  const totalPages = session?.pageCount || 0;

  return (
    <div style={MODAL_OVERLAY}>
      <div style={MODAL_CARD} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div style={HEADER}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={HEADER_TITLE}>المراجعة الرسمية للتقرير</span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{campaignName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {reviewState !== 'idle' && (
              <span style={{ ...stateBadge, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
                {stateLabel}
              </span>
            )}
            <button
              type="button"
              style={BTN_SECONDARY}
              onClick={handleClose}
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={BODY}>
          {/* Generating state */}
          {reviewState === 'generating' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>جاري توليد المراجعة...</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                يتم إنشاء التقرير باستخدام نفس pipeline التصدير الرسمي
              </div>
            </div>
          )}

          {/* Error state */}
          {reviewState === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b' }}>فشل توليد المراجعة</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', maxWidth: '500px', margin: '8px auto 0' }}>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Ready / Confirmed state — show PDF + metadata */}
          {(reviewState === 'ready' || reviewState === 'confirmed') && pdfBlobUrl && (
            <>
              {/* PDF viewer */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc',
                  height: `calc(90vh - 280px)`,
                  minHeight: '400px',
                }}
              >
                <embed
                  src={pdfBlobUrl}
                  type="application/pdf"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="معاينة التقرير الرسمي"
                />
              </div>

              {/* Page navigation + metadata */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        ...BTN_BASE, padding: '6px 14px', fontSize: '12px',
                        opacity: currentPage <= 1 ? 0.45 : 1,
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      }}
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      ◀ السابق
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0c2340', minWidth: '80px', textAlign: 'center' }}>
                      الصفحة {currentPage} من {totalPages}
                    </span>
                    <button
                      type="button"
                      style={{
                        ...BTN_BASE, padding: '6px 14px', fontSize: '12px',
                        opacity: currentPage >= totalPages ? 0.45 : 1,
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      }}
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      التالي ▶
                    </button>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {session?.generationDurationMs ? `مدة التوليد: ${(session.generationDurationMs / 1000).toFixed(1)} ثانية` : ''}
                  </span>
                </div>

                {session && (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.6,
                      fontFamily: 'monospace',
                      maxHeight: '60px',
                      overflowY: 'auto',
                    }}
                  >
                    <div>عدد الصفحات: {session.pageCount}</div>
                    <div>الحالة: {stateLabel}</div>
                    {session.confirmedAt && (
                      <div>تم التأكيد في: {new Date(session.confirmedAt).toLocaleString('ar-IQ')}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Warnings */}
              {session && session.warnings.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#78350f', marginBottom: '8px' }}>
                    التنبيهات ({session.warnings.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {session.warnings.map((w, i) => (
                      <WarningRow key={i} w={w} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Stale state */}
          {reviewState === 'stale' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🕒</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#6b7280' }}>انتهت صلاحية المراجعة</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                تم إنشاء مراجعة جديدة للبيانات المعدلة
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={FOOTER}>
          <button
            type="button"
            style={BTN_SECONDARY}
            onClick={handleClose}
          >
            العودة إلى التحرير
          </button>

          {reviewState === 'ready' && (
            <button
              type="button"
              style={{
                ...BTN_PRIMARY,
                backgroundColor: '#1d4ed8',
                borderColor: '#1d4ed8',
              }}
              onClick={handleConfirm}
            >
              تأكيد المراجعة
            </button>
          )}

          {reviewState === 'confirmed' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>✓ تم التأكيد</span>
              <button
                type="button"
                style={BTN_PRIMARY}
                onClick={() => onConfirmExport(campaignId)}
              >
                تصدير PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
