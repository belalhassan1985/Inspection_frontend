import React from 'react';

type ExperimentalExportStatus = 'idle' | 'exporting' | 'success' | 'error';

interface DesignerExperimentalExportModalProps {
  status: ExperimentalExportStatus;
  error: string;
  filename: string;
  blobSizeKB: number;
  pageDocument: { generatedAt?: string; pages: unknown[] } | null;
  fragmentsCount: number;
  onBackdropClick: (() => void) | undefined;
  onConfirm: () => void;
  onDismiss: () => void;
  onDismissError: () => void;
  onRetry: () => void;
}

export const DesignerExperimentalExportModal: React.FC<DesignerExperimentalExportModalProps> = ({
  status,
  error,
  filename,
  blobSizeKB,
  pageDocument,
  fragmentsCount,
  onBackdropClick,
  onConfirm,
  onDismiss,
  onDismissError,
  onRetry,
}) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onClick={onBackdropClick}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        maxWidth: '520px',
        width: '90vw',
        padding: '24px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ?? Confirm state (idle) ?? */}
      {status === 'idle' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#0f766e', fontWeight: 900, fontSize: '16px' }}>Confirm Experimental Export</h3>
            <button
              type="button"
              onClick={onDismiss}
              style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
          <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: '#f0fdfa', padding: '14px', marginBottom: '12px' }}>
            <div style={{ color: '#0f766e', fontSize: '11px', fontWeight: 800, marginBottom: '8px' }}>Phase 14A — Guarded Export Confirmation</div>
            <div style={{ display: 'grid', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#166534', fontWeight: 900, fontSize: '13px' }}>&#10003;</span>
                <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>Payload ready</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#166534', fontWeight: 900, fontSize: '13px' }}>&#10003;</span>
                <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>PageDocument preview valid</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#166534', fontWeight: 900, fontSize: '13px' }}>&#10003;</span>
                <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>Final Pre-Integration Audit passed</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '10px', border: '1px solid #bae6fd', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', lineHeight: 1.6, marginBottom: '12px' }}>
            This uses the <strong>experimental endpoint</strong> only. Official PDF, /reports, backend, and Prisma remain untouched.
          </div>
          <div style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6, marginBottom: '8px' }}>
            The request will send <code>pageDocument</code> (with full pages, fragments, and overrides) to <code>POST /reports/experimental/page-document/pdf</code>. A PDF will be downloaded if the endpoint responds successfully.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={onDismiss}
              style={{ padding: '8px 16px', border: '1px solid #64748b', borderRadius: '6px', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{ padding: '8px 16px', border: '1px solid #0f766e', borderRadius: '6px', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              Confirm & Export
            </button>
          </div>
        </>
      )}

      {/* ?? Exporting state ?? */}
      {status === 'exporting' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#0f766e', fontWeight: 900, fontSize: '16px' }}>Exporting Experimental PDF...</h3>
          </div>
          <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: '#f0fdfa', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px', color: '#0f766e' }}>&#8987;</div>
            <div style={{ color: '#0f766e', fontSize: '13px', fontWeight: 700 }}>Sending request to experimental endpoint...</div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '6px' }}>This may take a moment.</div>
          </div>
        </>
      )}

      {/* ?? Success state ?? */}
      {status === 'success' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#166534', fontWeight: 900, fontSize: '16px' }}>Export Successful</h3>
            <button
              type="button"
              onClick={onDismiss}
              style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
          <div style={{ border: '1px solid #86efac', borderRadius: '8px', backgroundColor: '#f0fdf4', padding: '14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#166534', fontWeight: 900, fontSize: '18px' }}>&#10003;</span>
              <span style={{ color: '#166534', fontSize: '13px', fontWeight: 700 }}>Experimental PDF downloaded successfully</span>
            </div>
            <div style={{ display: 'grid', gap: '3px', fontSize: '11px', color: '#374151', lineHeight: 1.6 }}>
              <div><strong>Filename:</strong> {filename || 'experimental-designer-report.pdf'}</div>
              <div><strong>Size:</strong> {blobSizeKB > 0 ? `${blobSizeKB} KB` : '—'}</div>
              <div><strong>Generated at:</strong> {pageDocument?.generatedAt ? new Date(pageDocument.generatedAt).toLocaleString() : '—'}</div>
              <div><strong>Page count:</strong> {pageDocument?.pages.length ?? '—'}</div>
              <div><strong>Fragment count:</strong> {fragmentsCount}</div>
              <div style={{ marginTop: '4px', color: '#64748b', fontStyle: 'italic' }}>Official PDF and /reports remain untouched.</div>
            </div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', padding: '10px', marginBottom: '12px' }}>
            <div style={{ color: '#475569', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>Comparison Checklist</div>
            <div style={{ display: 'grid', gap: '2px', fontSize: '11px', color: '#64748b', lineHeight: 1.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" readOnly style={{ margin: 0, accentColor: '#166534' }} />
                <span>Open downloaded PDF</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" readOnly style={{ margin: 0, accentColor: '#166534' }} />
                <span>Compare page count with official report</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" readOnly style={{ margin: 0, accentColor: '#166534' }} />
                <span>Compare title / committee / recommendations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" readOnly style={{ margin: 0, accentColor: '#166534' }} />
                <span>Check manual page breaks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" readOnly style={{ margin: 0, accentColor: '#166534' }} />
                <span>Check Arabic rendering</span>
              </div>
            </div>
            <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>Manual checklist — no automatic comparison performed.</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={onDismiss}
              style={{ padding: '8px 16px', border: '1px solid #166534', borderRadius: '6px', backgroundColor: '#166534', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* ?? Error state ?? */}
      {status === 'error' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#b91c1c', fontWeight: 900, fontSize: '16px' }}>Export Failed</h3>
            <button
              type="button"
              onClick={onDismissError}
              style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
          <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', backgroundColor: '#fef2f2', padding: '14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: '#b91c1c', fontWeight: 900, fontSize: '18px' }}>&#10007;</span>
              <span style={{ color: '#b91c1c', fontSize: '13px', fontWeight: 700 }}>Error during export</span>
            </div>
            <div style={{ color: '#991b1b', fontSize: '11px', lineHeight: 1.6, marginTop: '6px' }}>
              {error}
            </div>
            <div style={{ marginTop: '8px', borderTop: '1px solid #fecaca', paddingTop: '8px' }}>
              <div style={{ color: '#64748b', fontSize: '10px', lineHeight: 1.6 }}>
                <div><strong>Endpoint:</strong> POST /reports/experimental/page-document/pdf</div>
                {error.includes('disabled') || error.includes('unavailable') || error.includes('404') ? (
                  <div style={{ marginTop: '4px', color: '#b45309', fontWeight: 600 }}>Hint: <code>EXPERIMENTAL_PAGE_DOCUMENT_PDF</code> may be false on the server.</div>
                ) : null}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={onDismissError}
              style={{ padding: '8px 16px', border: '1px solid #64748b', borderRadius: '6px', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={onRetry}
              style={{ padding: '8px 16px', border: '1px solid #0f766e', borderRadius: '6px', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              Try Again
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);
