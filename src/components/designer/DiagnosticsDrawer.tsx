import React from 'react';
import type { Fragment } from '../../utils/reportFragments';
import type { PageModel, PaginationResult } from '../../utils/paginate';
import { PageDiagnostics } from './PageDiagnostics';
import { findStructureNodeById, officialStructureTree } from './StructureTree';

export type DiagnosticsDrawerProps = {
  documentPages: PageModel[];
  fragments: Fragment[];
  noContentLost: boolean;
  placedCount: number;
  pagination: PaginationResult | null;
  pdfReviewMode: boolean;
  pageDocument: { pages: Array<{ fragmentIds: string[] }> } | null;
  lastExportSession: any;
  pdfReviewDecision: 'pending' | 'approved' | 'needs_changes';
  setPdfReviewDecision: React.Dispatch<React.SetStateAction<'pending' | 'approved' | 'needs_changes'>>;
  pdfReviewNotes: string;
  setPdfReviewNotes: React.Dispatch<React.SetStateAction<string>>;
  manualPageBreaks: string[];
  togglePageBreakBefore: (nodeId: string) => void;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, unknown>;
  renderedPages: PageModel[];
  buildDesignerExportBridgePayload: () => any;
  validateDesignerExportBridgePayload: (payload: any) => { valid: boolean; warnings: string[]; errors: string[] };
  getExperimentalExportReadiness: () => { ready: boolean; reasons: string[] };
  buildDesignerPageDocumentRequestPreview: () => any;
  validateDesignerPageDocumentRequestPreview: (payload: any, estimatedJsonBytes: number) => { valid: boolean; warnings: string[]; errors: string[] };
  availableDraft: any;
  selectedNodeId: string | null;
  lastDraftSavedAt: string | null;
  selectedCampId: string;
  reportPayload: any;
  canUndo: boolean;
  canRedo: boolean;
  DESIGNER_DRAFT_VERSION: number;
  experimentalParityChecks: Record<string, boolean>;
  setExperimentalParityChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  lastOfficialExport: any;
  exportSessionHistory: any[];
  setExportSessionHistory: React.Dispatch<React.SetStateAction<any[]>>;
  exportAttemptStats: { total: number; success: number; failed: number };
  setExportAttemptStats: React.Dispatch<React.SetStateAction<{ total: number; success: number; failed: number }>>;
};

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  documentPages,
  fragments,
  noContentLost,
  placedCount,
  pagination,
  pdfReviewMode,
  pageDocument,
  lastExportSession,
  pdfReviewDecision,
  setPdfReviewDecision,
  pdfReviewNotes,
  setPdfReviewNotes,
  manualPageBreaks,
  togglePageBreakBefore,
  elementTextOverrides,
  elementStyleOverrides,
  renderedPages,
  buildDesignerExportBridgePayload,
  validateDesignerExportBridgePayload,
  getExperimentalExportReadiness,
  buildDesignerPageDocumentRequestPreview,
  validateDesignerPageDocumentRequestPreview,
  availableDraft,
  selectedNodeId,
  lastDraftSavedAt,
  selectedCampId,
  reportPayload,
  canUndo,
  canRedo,
  DESIGNER_DRAFT_VERSION,
  experimentalParityChecks,
  setExperimentalParityChecks,
  lastOfficialExport,
  exportSessionHistory,
  setExportSessionHistory,
  exportAttemptStats,
  setExportAttemptStats,
}) => (
  <details style={{ marginTop: '16px', border: '1px solid #d7dee8', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)' }}>
      <summary style={{ padding: '12px 14px', cursor: 'pointer', fontWeight: 800, color: '#334155', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        Diagnostics
      </summary>
      <div style={{ padding: '14px', display: 'grid', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
          <div style={{ border: '1px solid #d8e0ea', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800 }}>Pages</div>
            <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 900 }}>{documentPages.length}</div>
          </div>
          <div style={{ border: '1px solid #d8e0ea', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800 }}>Fragments</div>
            <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 900 }}>{fragments.length}</div>
          </div>
          <div style={{ border: '1px solid #d8e0ea', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800 }}>Content</div>
            <div style={{ color: noContentLost ? '#166534' : '#b91c1c', fontSize: '13px', fontWeight: 900 }}>
              {noContentLost ? 'No content loss' : `Loss ${placedCount}/${fragments.length}`}
            </div>
          </div>
          <div style={{ border: '1px solid #d8e0ea', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800 }}>Warnings</div>
            <div style={{ color: pagination?.warnings.length ? '#92400e' : '#0f172a', fontSize: '18px', fontWeight: 900 }}>{pagination?.warnings.length || 0}</div>
          </div>
        </div>
        {pdfReviewMode && (
          <>
            {(() => {
              const allFragmentsSupported = fragments.length > 0 && !fragments.some((f) => f.kind === 'unsupported');
              let orderPreserved = true;
              let noMissingFragments = true;
              if (pageDocument) {
                const pageFragmentIds = pageDocument.pages.flatMap((p) => p.fragmentIds);
                const originalIds = fragments.map((f) => f.id);
                const pageIdsInOrder = pageFragmentIds.filter((id) => originalIds.includes(id));
                orderPreserved = pageIdsInOrder.every((id, i) => id === originalIds[i]);
                const pageIdSet = new Set(pageFragmentIds);
                noMissingFragments = fragments.every((f) => pageIdSet.has(f.id));
              }
              const exportSucceeded = lastExportSession?.status === 'success';
              const pageCountGenerated = documentPages.length > 0;
              const fileSizeGenerated = exportSucceeded && (lastExportSession?.blobSizeKB ?? 0) > 0;
              const gateReady = allFragmentsSupported && orderPreserved && noMissingFragments && exportSucceeded && pageCountGenerated && fileSizeGenerated;
              const finalReady = gateReady && pdfReviewDecision === 'approved' && lastExportSession?.status === 'success';
              const reasons: string[] = [];
              if (!allFragmentsSupported || !orderPreserved || !noMissingFragments || !exportSucceeded || !pageCountGenerated || !fileSizeGenerated) reasons.push('Gate not ready');
              if (pdfReviewDecision === 'pending') reasons.push('Review decision pending');
              if (pdfReviewDecision === 'needs_changes') reasons.push('Review needs changes');
              if (lastExportSession?.status !== 'success') reasons.push('No successful export yet');
              return (
                <div style={{ padding: '12px 14px', borderRadius: '8px', border: finalReady ? '2px solid #34d399' : '2px solid #f59e0b', backgroundColor: finalReady ? '#d1fae5' : '#fffbeb', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: finalReady ? '0' : '6px' }}>
                    <span style={{ fontSize: '16px' }}>{finalReady ? '✅' : '⚠️'}</span>
                    <span style={{ fontWeight: 900, fontSize: '13px', color: finalReady ? '#065f46' : '#92400e' }}>
                      PDF Review Status
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: finalReady ? '#065f46' : '#92400e', marginBottom: !finalReady && reasons.length > 0 ? '6px' : '0' }}>
                    {finalReady ? 'Designer PDF is ready for final manual acceptance' : 'Designer PDF review is not final yet'}
                  </div>
                  {!finalReady && reasons.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#92400e', lineHeight: 1.7 }}>
                      {reasons.map((r) => (
                        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#d97706' }}>•</span> {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <details open style={{ border: '2px solid #7c3aed', borderRadius: '8px', backgroundColor: '#f5f3ff' }}>
              <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#5b21b6' }}>
                Experimental PDF Acceptance Gate (Review Mode)
              </summary>
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
                {(() => {
                  const allFragmentsSupported = fragments.length > 0 && !fragments.some((f) => f.kind === 'unsupported');
                  let orderPreserved = true;
                  let noMissingFragments = true;
                  if (pageDocument) {
                    const pageFragmentIds = pageDocument.pages.flatMap((p) => p.fragmentIds);
                    const originalIds = fragments.map((f) => f.id);
                    const pageIdsInOrder = pageFragmentIds.filter((id) => originalIds.includes(id));
                    orderPreserved = pageIdsInOrder.every((id, i) => id === originalIds[i]);
                    const pageIdSet = new Set(pageFragmentIds);
                    noMissingFragments = fragments.every((f) => pageIdSet.has(f.id));
                  }
                  const exportSucceeded = lastExportSession?.status === 'success';
                  const pageCountGenerated = documentPages.length > 0;
                  const fileSizeGenerated = exportSucceeded && (lastExportSession?.blobSizeKB ?? 0) > 0;
                  const checks = [
                    { label: 'All fragments supported', pass: allFragmentsSupported },
                    { label: 'Order preserved', pass: orderPreserved },
                    { label: 'No missing fragments', pass: noMissingFragments },
                    { label: 'Export succeeded', pass: exportSucceeded },
                    { label: 'Page count generated', pass: pageCountGenerated },
                    { label: 'File size generated', pass: fileSizeGenerated },
                  ];
                  const passedCount = checks.filter((c) => c.pass).length;
                  const allPass = passedCount === checks.length;
                  return (
                    <>
                      <div style={{ display: 'grid', gap: '4px', marginBottom: '10px' }}>
                        {checks.map((c) => (
                          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.pass ? '#166534' : '#b91c1c', fontWeight: c.pass ? 700 : 400 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: 900, color: '#ffffff', backgroundColor: c.pass ? '#16a34a' : '#dc2626', flexShrink: 0 }}>
                              {c.pass ? '✓' : '✗'}
                            </span>
                            {c.label}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: allPass ? '#166534' : '#475569' }}>
                          {passedCount}/{checks.length} passed
                        </span>
                      </div>
                      {allPass && (
                        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#d1fae5', border: '2px solid #34d399', textAlign: 'center' }}>
                          <div style={{ color: '#065f46', fontSize: '16px', fontWeight: 900 }}>
                            READY FOR DESIGNER PDF REVIEW
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </details>
            <details open style={{ border: '2px solid #0891b2', borderRadius: '8px', backgroundColor: '#ecfeff' }}>
              <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#155e75' }}>
                PDF Review Decision
              </summary>
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {(['pending', 'approved', 'needs_changes'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPdfReviewDecision(value)}
                      style={{
                        padding: '6px 14px',
                        border: pdfReviewDecision === value
                          ? (value === 'approved' ? '2px solid #16a34a'
                            : value === 'needs_changes' ? '2px solid #dc2626'
                            : '2px solid #64748b')
                          : '1px solid #94a3b8',
                        borderRadius: '6px',
                        backgroundColor: pdfReviewDecision === value
                          ? (value === 'approved' ? '#dcfce7'
                            : value === 'needs_changes' ? '#fee2e2'
                            : '#f1f5f9')
                          : '#ffffff',
                        color: pdfReviewDecision === value
                          ? (value === 'approved' ? '#166534'
                            : value === 'needs_changes' ? '#991b1b'
                            : '#475569')
                          : '#475569',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {value === 'pending' ? 'Pending'
                        : value === 'approved' ? 'Approved'
                        : 'Needs Changes'}
                    </button>
                  ))}
                </div>
                {pdfReviewDecision === 'pending' && (
                  <div style={{ color: '#64748b', fontStyle: 'italic' }}>No review decision selected</div>
                )}
                {pdfReviewDecision === 'approved' && (
                  <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#d1fae5', border: '1px solid #86efac', textAlign: 'center' }}>
                    <span style={{ color: '#065f46', fontSize: '13px', fontWeight: 900 }}>
                      Designer PDF Approved for Review
                    </span>
                  </div>
                )}
                {pdfReviewDecision === 'needs_changes' && (
                  <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', textAlign: 'center' }}>
                    <span style={{ color: '#991b1b', fontSize: '13px', fontWeight: 900 }}>
                      Designer PDF Needs Changes
                    </span>
                  </div>
                )}
                <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                  <strong>Phase 16C:</strong> Review decision is session-only and does not affect export, backend, Prisma, database, or official PDF.
                </div>
              </div>
            </details>
            <details open style={{ border: '2px solid #0d9488', borderRadius: '8px', backgroundColor: '#f0fdfa' }}>
              <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#115e59' }}>
                PDF Review Notes
              </summary>
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
                <textarea
                  value={pdfReviewNotes}
                  onChange={(e) => setPdfReviewNotes(e.target.value)}
                  placeholder="اكتب ملاحظات المراجعة هنا..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    lineHeight: 1.7,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    direction: 'rtl',
                    textAlign: 'right',
                  }}
                />
                <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                  <strong>Phase 16D:</strong> Notes are session-only. Not saved to localStorage, not sent to backend. No impact on export, official PDF, Prisma, or database.
                </div>
              </div>
            </details>
            <details open style={{ border: '2px solid #0f172a', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#0f172a' }}>
                PDF Review Summary
              </summary>
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
                {(() => {
                  const allFragmentsSupported = fragments.length > 0 && !fragments.some((f) => f.kind === 'unsupported');
                  let orderPreserved = true;
                  let noMissingFragments = true;
                  if (pageDocument) {
                    const pageFragmentIds = pageDocument.pages.flatMap((p) => p.fragmentIds);
                    const originalIds = fragments.map((f) => f.id);
                    const pageIdsInOrder = pageFragmentIds.filter((id) => originalIds.includes(id));
                    orderPreserved = pageIdsInOrder.every((id, i) => id === originalIds[i]);
                    const pageIdSet = new Set(pageFragmentIds);
                    noMissingFragments = fragments.every((f) => pageIdSet.has(f.id));
                  }
                  const exportSucceeded = lastExportSession?.status === 'success';
                  const pageCountGenerated = documentPages.length > 0;
                  const fileSizeGenerated = exportSucceeded && (lastExportSession?.blobSizeKB ?? 0) > 0;
                  const gateReady = allFragmentsSupported && orderPreserved && noMissingFragments && exportSucceeded && pageCountGenerated && fileSizeGenerated;
                  const lastExportStatus = !lastExportSession ? 'None' : lastExportSession.status === 'success' ? 'Success' : 'Failed';
                  const notesStatus = pdfReviewNotes.trim().length > 0 ? 'Notes added' : 'No notes';
                  const allFinal = gateReady && pdfReviewDecision === 'approved' && lastExportSession?.status === 'success';
                  return (
                    <>
                      <div style={{ display: 'grid', gap: '6px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', backgroundColor: gateReady ? '#f0fdf4' : '#fef2f2' }}>
                          <strong>Acceptance Gate status</strong>
                          <span style={{ fontWeight: 900, fontSize: '11px', color: gateReady ? '#166534' : '#b91c1c' }}>
                            {gateReady ? 'READY' : 'NOT READY'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', backgroundColor: pdfReviewDecision === 'approved' ? '#f0fdf4' : pdfReviewDecision === 'needs_changes' ? '#fef2f2' : '#f8fafc' }}>
                          <strong>Review Decision</strong>
                          <span style={{ fontWeight: 900, fontSize: '11px', color: pdfReviewDecision === 'approved' ? '#166534' : pdfReviewDecision === 'needs_changes' ? '#b91c1c' : '#64748b' }}>
                            {pdfReviewDecision === 'approved' ? 'Approved' : pdfReviewDecision === 'needs_changes' ? 'Needs Changes' : 'Pending'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', backgroundColor: notesStatus === 'Notes added' ? '#f0fdf4' : '#f8fafc' }}>
                          <strong>Notes status</strong>
                          <span style={{ fontWeight: 900, fontSize: '11px', color: notesStatus === 'Notes added' ? '#166534' : '#64748b' }}>
                            {notesStatus}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', backgroundColor: lastExportStatus === 'Success' ? '#f0fdf4' : lastExportStatus === 'Failed' ? '#fef2f2' : '#f8fafc' }}>
                          <strong>Last export status</strong>
                          <span style={{ fontWeight: 900, fontSize: '11px', color: lastExportStatus === 'Success' ? '#166534' : lastExportStatus === 'Failed' ? '#b91c1c' : '#64748b' }}>
                            {lastExportStatus}
                          </span>
                        </div>
                      </div>
                      {allFinal ? (
                        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#d1fae5', border: '2px solid #34d399', textAlign: 'center' }}>
                          <span style={{ color: '#065f46', fontSize: '14px', fontWeight: 900 }}>
                            READY FOR FINAL MANUAL ACCEPTANCE
                          </span>
                        </div>
                      ) : (
                        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '2px solid #fca5a5', textAlign: 'center' }}>
                          <span style={{ color: '#991b1b', fontSize: '14px', fontWeight: 900 }}>
                            REVIEW NOT FINAL
                          </span>
                        </div>
                      )}
                      <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                        <strong>Phase 16E:</strong> Summary card only. Does not affect export, backend, Prisma, database, or official PDF.
                      </div>
                    </>
                  );
                })()}
              </div>
            </details>
            <details open style={{ border: '2px solid #dc2626', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
              <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#991b1b' }}>
                PDF Review Controls
              </summary>
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPdfReviewDecision('pending')}
                    style={{ padding: '6px 14px', border: '1px solid #94a3b8', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 800, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Reset Decision
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfReviewNotes('')}
                    style={{ padding: '6px 14px', border: '1px solid #94a3b8', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 800, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Clear Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPdfReviewDecision('pending'); setPdfReviewNotes(''); }}
                    style={{ padding: '6px 14px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 800, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Reset Review Session
                  </button>
                </div>
                <div style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                  <strong>Phase 16G:</strong> Reset affects only local review state. Does not clear export history, attempt stats, or affect backend, Prisma, database, or official PDF.
                </div>
              </div>
            </details>
            <div style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', border: '1px dashed #94a3b8', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>
              Secondary diagnostics hidden in PDF Review Mode. Toggle off to view all panels.
            </div>
          </>
        )}
        {!pdfReviewMode && (
        <details style={{ border: '1px solid #fde68a', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', color: '#92400e', fontWeight: 'bold' }}>
            Pre-flight warnings
          </summary>
          {pagination && pagination.warnings.length > 0 ? (
            <ul style={{ margin: 0, padding: '10px 26px', color: '#92400e', fontSize: '13px', lineHeight: 1.9 }}>
              {pagination.warnings.map((w) => (
                <li key={w.fragId}>Page {w.page}: {w.message}</li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '10px 12px', color: '#64748b', fontSize: '13px' }}>No pre-flight warnings.</div>
          )}
        </details>
        )}
        {!pdfReviewMode && (
<><details style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}>
            Page Diagnostics
          </summary>
          <PageDiagnostics pages={documentPages} />
</details>
        {/* ── Manual Page Breaks Export Readiness Audit ──
            Manual page breaks currently affect Designer pagination only.
            Export integration is intentionally deferred. */}
        {manualPageBreaks.length > 0 && (
        <details style={{ border: '1px solid #f59e0b', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#92400e' }}>
            Manual Breaks Audit
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const warnings: { type: string; message: string }[] = [];
              const seen = new Set<string>();
              manualPageBreaks.forEach((id) => {
                const node = findStructureNodeById(officialStructureTree, id);
                if (!node) {
                  warnings.push({ type: 'missing', message: `Break target "${id}" not found in Structure Tree` });
                } else {
                  if (node.badge === 'Protected' || node.badge === 'Reserved') {
                    warnings.push({ type: 'protected', message: `Break target "${node.label}" is a Protected/Reserved node` });
                  }
                  const hasFragment = fragments.some((f) => f.id === id);
                  if (!hasFragment) {
                    warnings.push({ type: 'no-fragment', message: `Break target "${node.label}" has no renderable fragment` });
                  }
                }
                if (seen.has(id)) {
                  warnings.push({ type: 'duplicate', message: `Break target "${id}" is duplicated` });
                }
                seen.add(id);
              });
              return (
                <>
                  <div><strong>Breaks defined:</strong> {manualPageBreaks.length}</div>
                  <div>
                    <strong>Break targets:</strong>
                    <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                      {manualPageBreaks.map((id) => {
                        const node = findStructureNodeById(officialStructureTree, id);
                        return (
                          <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{node?.label ?? id}</span>
                            <button type="button" onClick={() => togglePageBreakBefore(id)} style={{ border: '1px solid #dc2626', borderRadius: '3px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '0 4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 }}>Remove</button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {warnings.length > 0 ? (
                    <div style={{ marginTop: '6px' }}>
                      <strong style={{ color: '#b91c1c' }}>Warnings:</strong>
                      <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                        {warnings.map((w, i) => (
                          <li key={i} style={{ color: w.type === 'missing' || w.type === 'duplicate' ? '#b91c1c' : '#92400e' }}>
                            {w.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px', color: '#166534', fontWeight: 700 }}>All break targets are valid.</div>
                  )}
                  <div style={{ marginTop: '6px', color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>
                    Manual page breaks currently affect Designer pagination only. Export integration is intentionally deferred.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
        )}
{/* ── Designer → Experimental PDF Payload Bridge Audit ──
    Designer export bridge is audit-only in this phase.
    No request is sent to backend.
    Official PDF remains untouched. */}
<details style={{ border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#1e293b' }}>
            Export Readiness Audit
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const fragmentIdSet = new Set(fragments.map((f) => f.id));
              const textKeys = Object.keys(elementTextOverrides);
              const styleKeys = Object.keys(elementStyleOverrides);
              const orphanTextKeys = textKeys.filter((k: string) => !fragmentIdSet.has(k));
              const orphanStyleKeys = styleKeys.filter((k: string) => !fragmentIdSet.has(k));
              const orphanBreakKeys = manualPageBreaks.filter((k: string) => !fragmentIdSet.has(k));
              const payloadReady = orphanTextKeys.length === 0 && orphanStyleKeys.length === 0 && orphanBreakKeys.length === 0;
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><strong>Text overrides:</strong> {textKeys.length}</div>
                    <div><strong>Style overrides:</strong> {styleKeys.length}</div>
                    <div><strong>Manual breaks:</strong> {manualPageBreaks.length}</div>
                    <div><strong>Rendered pages:</strong> {renderedPages.length}</div>
                    <div><strong>Fragments:</strong> {fragments.length}</div>
                    <div><strong>Status:</strong> <span style={{ color: payloadReady ? '#166534' : '#b91c1c', fontWeight: 700 }}>{payloadReady ? 'Ready' : 'Orphan keys'}</span></div>
                  </div>
                  {orphanTextKeys.length > 0 && (
                    <div style={{ marginTop: '6px' }}>
                      <strong style={{ color: '#b91c1c' }}>Orphan text overrides (no matching fragment):</strong>
                      <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                        {orphanTextKeys.map((k) => <li key={k} style={{ color: '#b91c1c' }}>{k}</li>)}
                      </ul>
                    </div>
                  )}
                  {orphanStyleKeys.length > 0 && (
                    <div style={{ marginTop: '6px' }}>
                      <strong style={{ color: '#b91c1c' }}>Orphan style overrides (no matching fragment):</strong>
                      <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                        {orphanStyleKeys.map((k) => <li key={k} style={{ color: '#b91c1c' }}>{k}</li>)}
                      </ul>
                    </div>
                  )}
                  {orphanBreakKeys.length > 0 && (
                    <div style={{ marginTop: '6px' }}>
                      <strong style={{ color: '#b91c1c' }}>Orphan manual breaks (no matching fragment):</strong>
                      <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                        {orphanBreakKeys.map((k) => <li key={k} style={{ color: '#b91c1c' }}>{k}</li>)}
                      </ul>
                    </div>
                  )}
                  {payloadReady && (
                    <div style={{ marginTop: '6px', color: '#166534', fontWeight: 700 }}>All override keys map to existing fragments.</div>
                  )}
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Note:</strong> Designer export bridge is audit-only in this phase. No request is sent to backend. Official PDF remains untouched.
                  </div>
                </>
              );
            })()}
</div>
        </details>
{/* ── Phase 13B: Designer → Experimental PDF Export Bridge Payload Preview ──
    Contract draft only. Backend integration deferred.
    This panel builds the payload locally and shows a compact preview only.
    No request is sent. Official PDF, /reports, backend, Prisma, and the
    Experimental PDF Endpoint remain unchanged. */}
<details style={{ border: '1px solid #6366f1', borderRadius: '8px', backgroundColor: '#eef2ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#3730a3' }}>
            Export Bridge Payload Preview (Contract Draft)
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const payload = buildDesignerExportBridgePayload();
              if (!payload) {
                return <div style={{ color: '#64748b', fontStyle: 'italic' }}>No campaign selected — payload unavailable.</div>;
              }
              const compactPreview = JSON.stringify({
                campaignId: payload.campaignId,
                source: payload.source,
                draftVersion: payload.draftVersion,
                fragmentsCount: payload.fragmentsCount,
                renderedPagesCount: payload.renderedPagesCount,
                elementTextOverrides: `${Object.keys(payload.elementTextOverrides).length} keys`,
                elementStyleOverrides: `${Object.keys(payload.elementStyleOverrides).length} keys`,
                manualPageBreaks: `${payload.manualPageBreaks.length} breaks`,
                generatedAt: payload.generatedAt,
              }, null, 2);
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Source</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{payload.source}</div>
                    </div>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Draft Ver.</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{payload.draftVersion}</div>
                    </div>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Fragments</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{payload.fragmentsCount}</div>
                    </div>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Rendered Pages</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{payload.renderedPagesCount}</div>
                    </div>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Text Overrides</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{Object.keys(payload.elementTextOverrides).length}</div>
                    </div>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Style Overrides</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{Object.keys(payload.elementStyleOverrides).length}</div>
                    </div>
                    <div style={{ border: '1px solid #c7d2fe', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800 }}>Manual Breaks</div>
                      <div style={{ color: '#3730a3', fontSize: '13px', fontWeight: 900 }}>{payload.manualPageBreaks.length}</div>
                    </div>
                  </div>
                  <details style={{ border: '1px solid #c7d2fe', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                    <summary style={{ padding: '8px 10px', cursor: 'pointer', color: '#3730a3', fontWeight: 700, fontSize: '11px' }}>
                      JSON preview (counts only — overrides elided)
                    </summary>
                    <pre style={{ margin: 0, padding: '10px', color: '#312e81', fontSize: '11px', lineHeight: 1.5, overflowX: 'auto', whiteSpace: 'pre-wrap', direction: 'ltr', textAlign: 'left' }}>
{compactPreview}
                    </pre>
                  </details>
                  {/* ── Phase 13C: Bridge Payload Validation ──
                      Local validation only. No request is sent. No backend integration.
                      Does not block saving or modify draft/pagination/inspectors. */}
                  {(() => {
                    const validation = validateDesignerExportBridgePayload(payload);
                    return (
                      <div style={{ marginTop: '8px', border: '1px solid #c7d2fe', borderRadius: '6px', backgroundColor: '#ffffff', padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 900,
                            color: validation.valid ? '#166534' : '#991b1b',
                            backgroundColor: validation.valid ? '#dcfce7' : '#fee2e2',
                            border: `1px solid ${validation.valid ? '#86efac' : '#fca5a5'}`,
                          }}>
                            {validation.valid ? 'VALID' : 'INVALID'}
                          </span>
                          <span style={{ color: '#475569', fontSize: '11px', fontWeight: 700 }}>
                            {validation.errors.length} error(s) · {validation.warnings.length} warning(s)
                          </span>
                        </div>
                        {validation.errors.length > 0 && (
                          <div style={{ marginBottom: '6px' }}>
                            <strong style={{ color: '#991b1b', fontSize: '11px' }}>Errors:</strong>
                            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc', color: '#b91c1c', fontSize: '11px', lineHeight: 1.7 }}>
                              {validation.errors.map((err, i) => <li key={`err-${i}`}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                        {validation.warnings.length > 0 && (
                          <div>
                            <strong style={{ color: '#92400e', fontSize: '11px' }}>Warnings:</strong>
                            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc', color: '#b45309', fontSize: '11px', lineHeight: 1.7 }}>
                              {validation.warnings.map((w, i) => <li key={`warn-${i}`}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        {validation.valid && validation.warnings.length === 0 && (
                          <div style={{ color: '#166534', fontSize: '11px', fontWeight: 700 }}>Payload passes all validation checks.</div>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #c7d2fe', borderRadius: '6px', backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 13B/13C:</strong> Contract draft only. Backend integration deferred. No request is sent to the Experimental PDF Endpoint. Official PDF, /reports, Prisma, and backend remain unchanged. Validation is informational only and does not block saving.
                  </div>
                  {/* ── Phase 13E: Experimental Export Readiness ──
                      Local readiness check only. No request is sent.
                      Guards against premature export activation. */}
                  {(() => {
                    const readiness = getExperimentalExportReadiness();
                    return (
                      <div style={{ marginTop: '8px', border: '1px solid #c7d2fe', borderRadius: '6px', backgroundColor: '#ffffff', padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 900,
                            color: readiness.ready ? '#166534' : '#b45309',
                            backgroundColor: readiness.ready ? '#dcfce7' : '#fef3c7',
                            border: `1px solid ${readiness.ready ? '#86efac' : '#fcd34d'}`,
                          }}>
                            {readiness.ready ? 'READY' : 'NOT READY'}
                          </span>
                          <span style={{ color: '#475569', fontSize: '11px', fontWeight: 700 }}>
                            {readiness.reasons.length} reason(s)
                          </span>
                        </div>
                        {readiness.ready ? (
                          <div style={{ color: '#166534', fontSize: '11px', fontWeight: 700 }}>All guardrails pass. Export remains disabled in this phase.</div>
                        ) : (
                          <div>
                            <strong style={{ color: '#92400e', fontSize: '11px' }}>Reasons:</strong>
                            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc', color: '#b45309', fontSize: '11px', lineHeight: 1.7 }}>
                              {readiness.reasons.map((r, i) => <li key={`reason-${i}`}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </details>
{/* ── Phase 13G: Backend Contract Comparison Audit ──
    Compares DesignerExportBridgePayload with the Experimental PDF Endpoint
    contract requirements. Audit-only. No request is sent. No backend
    modification. /reports, official PDF, Prisma, and the Experimental PDF
    Endpoint remain unchanged. The bridge payload is not the final request —
    a transformation layer is needed to produce the pageDocument the
    endpoint expects. */}
<details style={{ border: '1px solid #7c3aed', borderRadius: '8px', backgroundColor: '#faf5ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#5b21b6' }}>
            Backend Contract Comparison
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const payload = buildDesignerExportBridgePayload();
              type ContractItem = { requirement: string; currentBridge: string; status: 'Ready' | 'Missing' | 'Deferred'; detail: string };
              const items: ContractItem[] = [
                {
                  requirement: 'pageDocument (top-level object)',
                  currentBridge: 'Bridge payload is flat (campaignId, source, overrides…)',
                  status: 'Missing',
                  detail: 'The endpoint expects a nested pageDocument object. The current bridge payload must be transformed into a pageDocument structure before sending.',
                },
                {
                  requirement: 'pageDocument.source === "designer"',
                  currentBridge: `source: "${payload?.source ?? '—'}"`,
                  status: 'Ready',
                  detail: 'The bridge payload already carries source: "designer". Passing it through as pageDocument.source is straightforward.',
                },
                {
                  requirement: 'pageDocument.layout.pageSize === "A4"',
                  currentBridge: 'Not present in bridge payload',
                  status: 'Deferred',
                  detail: 'Layout (pageSize, marginsMm) is not in the bridge payload. It will be derived from the frontend pagination config (A4 defaults) during the transformation step.',
                },
                {
                  requirement: 'pageDocument.pages (non-empty array)',
                  currentBridge: `renderedPagesCount: ${payload?.renderedPagesCount ?? '—'}`,
                  status: 'Missing',
                  detail: 'The bridge payload carries only the page count. The endpoint requires the full pages array with fragment assignments. Must be built from pagination output.',
                },
                {
                  requirement: 'pageDocument.fragments (array)',
                  currentBridge: `fragmentsCount: ${payload?.fragmentsCount ?? '—'}`,
                  status: 'Missing',
                  detail: 'The bridge payload carries only the fragment count. The endpoint requires the full fragments array with id, kind, and html. Must be built from reportFragments output.',
                },
                {
                  requirement: 'pageDocument.heights (Record<string, number>)',
                  currentBridge: 'Not present in bridge payload',
                  status: 'Deferred',
                  detail: 'Heights map is available in the frontend (from BlockMeasurer) but not included in the bridge payload. Will be added during transformation.',
                },
                {
                  requirement: 'campaignId',
                  currentBridge: `campaignId: "${payload?.campaignId ?? '—'}"`,
                  status: 'Ready',
                  detail: 'Already present in the bridge payload. Used by the endpoint as a fallback to build pageDocument server-side.',
                },
                {
                  requirement: 'elementTextOverrides',
                  currentBridge: `${payload ? Object.keys(payload.elementTextOverrides).length : '—'} keys`,
                  status: 'Ready',
                  detail: 'Present in the bridge payload. Will be applied to fragments during transformation.',
                },
                {
                  requirement: 'elementStyleOverrides',
                  currentBridge: `${payload ? Object.keys(payload.elementStyleOverrides).length : '—'} keys`,
                  status: 'Ready',
                  detail: 'Present in the bridge payload. Will be applied as CSS during transformation.',
                },
                {
                  requirement: 'manualPageBreaks',
                  currentBridge: `${payload?.manualPageBreaks?.length ?? '—'} breaks`,
                  status: 'Ready',
                  detail: 'Present in the bridge payload. Will inform pagination during transformation.',
                },
                {
                  requirement: 'Request size <= 5 MB',
                  currentBridge: 'Cannot estimate until pageDocument is built',
                  status: 'Deferred',
                  detail: 'The endpoint rejects requests larger than 5 MB. Final size depends on full pageDocument serialization. Must be verified after the transformation step.',
                },
              ];
              const statusColor: Record<string, string> = { Ready: '#166534', Missing: '#b91c1c', Deferred: '#92400e' };
              const statusBg: Record<string, string> = { Ready: '#dcfce7', Missing: '#fee2e2', Deferred: '#fef3c7' };
              const statusBorder: Record<string, string> = { Ready: '#86efac', Missing: '#fca5a5', Deferred: '#fcd34d' };
              const readyCount = items.filter((i) => i.status === 'Ready').length;
              const missingCount = items.filter((i) => i.status === 'Missing').length;
              const deferredCount = items.filter((i) => i.status === 'Deferred').length;
              return (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, color: statusColor.Ready, backgroundColor: statusBg.Ready, border: `1px solid ${statusBorder.Ready}` }}>
                      {readyCount} Ready
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, color: statusColor.Missing, backgroundColor: statusBg.Missing, border: `1px solid ${statusBorder.Missing}` }}>
                      {missingCount} Missing
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, color: statusColor.Deferred, backgroundColor: statusBg.Deferred, border: `1px solid ${statusBorder.Deferred}` }}>
                      {deferredCount} Deferred
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ border: `1px solid ${statusBorder[item.status]}`, borderRadius: '6px', backgroundColor: '#ffffff', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 900, color: statusColor[item.status], backgroundColor: statusBg[item.status], border: `1px solid ${statusBorder[item.status]}` }}>
                            {item.status}
                          </span>
                          <strong style={{ fontSize: '12px', color: '#1e293b' }}>{item.requirement}</strong>
                        </div>
                        <div style={{ color: '#475569', fontSize: '11px', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700 }}>Bridge:</span> {item.currentBridge}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px', lineHeight: 1.5, marginTop: '2px' }}>
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #c4b5fd', borderRadius: '6px', backgroundColor: '#ede9fe', color: '#4c1d95', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 13G:</strong> This audit compares the current DesignerExportBridgePayload (bridge contract) with the Experimental PDF Endpoint requirements. The bridge payload is <strong>not</strong> the final request body — a transformation layer is needed to produce the full <code>pageDocument</code> object (source, layout, pages, fragments, heights). No request is sent. No backend, /reports, PDF, Prisma, or endpoint is modified.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
{/* ── Phase 13H: PageDocument Request Preview ──
    Builds a local preview of the shape the Experimental PDF Endpoint expects.
    Shows source, pageSize, pages, fragments (id+kind only), metadata, and
    estimated JSON size. No request is sent. No backend modification.
    Does not change DesignerExportBridgePayload, draft, pagination,
    /reports, PDF, Prisma, or the Experimental Endpoint. */}
<details style={{ border: '1px solid #0e7490', borderRadius: '8px', backgroundColor: '#ecfeff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#155e75' }}>
            PageDocument Request Preview
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const preview = buildDesignerPageDocumentRequestPreview();
              if (!preview) {
                return <div style={{ color: '#64748b', fontStyle: 'italic' }}>No campaign or page document available — preview cannot be built.</div>;
              }
              const pd = preview.pageDocument;
              const estimatedJsonBytes = new Blob([JSON.stringify(preview)]).size;
              const estimatedKb = (estimatedJsonBytes / 1024).toFixed(1);
              const within5Mb = estimatedJsonBytes <= 5 * 1024 * 1024;
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Source</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.source}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Page Size</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.layout.pageSize}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Pages</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.pages.length}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Fragments</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.fragments.length}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Text Overrides</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.metadata.textOverridesCount}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Style Overrides</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.metadata.styleOverridesCount}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Manual Breaks</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.metadata.manualPageBreaksCount}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Draft Version</div>
                      <div style={{ color: '#155e75', fontSize: '13px', fontWeight: 900 }}>{pd.metadata.draftVersion}</div>
                    </div>
                    <div style={{ border: '1px solid #a5f3fc', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                      <div style={{ color: '#0e7490', fontSize: '10px', fontWeight: 800 }}>Est. JSON Size</div>
                      <div style={{ color: within5Mb ? '#166534' : '#b91c1c', fontSize: '13px', fontWeight: 900 }}>{estimatedKb} KB</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, backgroundColor: within5Mb ? '#dcfce7' : '#fee2e2', color: within5Mb ? '#166534' : '#b91c1c', border: `1px solid ${within5Mb ? '#86efac' : '#fca5a5'}` }}>
                      {within5Mb ? 'WITHIN 5 MB LIMIT' : 'EXCEEDS 5 MB LIMIT'}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}>
                      PREVIEW ONLY — NOT FINAL REQUEST
                    </span>
                  </div>
                  {/* ── Phase 13I: PageDocument Request Validation ──
                      Local validation only. No request is sent. No backend integration.
                      Does not block saving or modify draft/pagination/inspectors. */}
                  {(() => {
                    const validation = validateDesignerPageDocumentRequestPreview(preview, estimatedJsonBytes);
                    return (
                      <div style={{ marginBottom: '10px', border: `1px solid ${validation.valid ? '#86efac' : '#fca5a5'}`, borderRadius: '6px', backgroundColor: '#ffffff', padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 900,
                            color: validation.valid ? '#166534' : '#991b1b',
                            backgroundColor: validation.valid ? '#dcfce7' : '#fee2e2',
                            border: `1px solid ${validation.valid ? '#86efac' : '#fca5a5'}`,
                          }}>
                            {validation.valid ? 'VALID' : 'INVALID'}
                          </span>
                          <span style={{ color: '#475569', fontSize: '11px', fontWeight: 700 }}>
                            {validation.errors.length} error(s) · {validation.warnings.length} warning(s)
                          </span>
                        </div>
                        {validation.errors.length > 0 && (
                          <div style={{ marginBottom: '6px' }}>
                            <strong style={{ color: '#991b1b', fontSize: '11px' }}>Errors:</strong>
                            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc', color: '#b91c1c', fontSize: '11px', lineHeight: 1.7 }}>
                              {validation.errors.map((err, i) => <li key={`pd-err-${i}`}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                        {validation.warnings.length > 0 && (
                          <div>
                            <strong style={{ color: '#92400e', fontSize: '11px' }}>Warnings:</strong>
                            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc', color: '#b45309', fontSize: '11px', lineHeight: 1.7 }}>
                              {validation.warnings.map((w, i) => <li key={`pd-warn-${i}`}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        {validation.valid && validation.warnings.length === 0 && (
                          <div style={{ color: '#166534', fontSize: '11px', fontWeight: 700 }}>PageDocument preview passes all validation checks.</div>
                        )}
                        <div style={{ marginTop: '6px', color: '#64748b', fontSize: '10px', fontStyle: 'italic' }}>
                          Phase 13I — Local validation only. Does not block saving or send requests.
                        </div>
                      </div>
                    );
                  })()}
                  <details style={{ border: '1px solid #a5f3fc', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                    <summary style={{ padding: '8px 10px', cursor: 'pointer', color: '#155e75', fontWeight: 700, fontSize: '11px' }}>
                      Page assignment summary (pageNumber, fragment id/kind per page)
                    </summary>
                    <div style={{ padding: '10px', maxHeight: '300px', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', direction: 'ltr', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                            <th style={{ padding: '4px 6px', color: '#0e7490', fontWeight: 800 }}>Page</th>
                            <th style={{ padding: '4px 6px', color: '#0e7490', fontWeight: 800 }}>Fragments</th>
                            <th style={{ padding: '4px 6px', color: '#0e7490', fontWeight: 800 }}>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pd.pages.map((p: any) => (
                            <tr key={p.pageNumber} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '3px 6px', fontWeight: 700 }}>{p.pageNumber}</td>
                              <td style={{ padding: '3px 6px', fontSize: '10px', wordBreak: 'break-all' }}>{p.fragments.map((f: any) => `${f.id} (${f.kind})`).join(', ')}</td>
                              <td style={{ padding: '3px 6px' }}>{p.fragments.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #67e8f9', borderRadius: '6px', backgroundColor: '#cffafe', color: '#155e75', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 13H:</strong> This is a <strong>preview</strong> of the shape the Experimental PDF Endpoint expects. It is <strong>not</strong> the final request — full <code>pageDocument.pages</code> and <code>pageDocument.fragments</code> HTML content is elided (id+kind only). The endpoint requires complete fragment objects with <code>html</code> fields. No request is sent. No backend, /reports, PDF, Prisma, or endpoint is modified.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
<details style={{ border: '1px solid #bef264', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#166534' }}>
            Draft Diagnostics
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            <div><strong>Version:</strong> {availableDraft ? `v${availableDraft.version}` : 'No draft'}</div>
            <div><strong>Text overrides:</strong> {Object.keys(elementTextOverrides).length} keys</div>
            <div><strong>Style overrides:</strong> {Object.keys(elementStyleOverrides).length} keys</div>
            <div><strong>Selected node:</strong> {selectedNodeId ?? 'None'}</div>
            <div><strong>Manual page breaks:</strong> {manualPageBreaks.length}</div>
            {manualPageBreaks.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <strong>Break targets:</strong>
                <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                  {manualPageBreaks.map((id) => {
                    const node = findStructureNodeById(officialStructureTree, id);
                    return (
                      <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{node?.label ?? id}</span>
                        <button
                          type="button"
                          onClick={() => togglePageBreakBefore(id)}
                          style={{ border: '1px solid #dc2626', borderRadius: '3px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '0 4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 }}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {pagination && pagination.pages.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <strong>Page break reasons:</strong>
                <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                  {pagination.pages.map((p) => (
                    <li key={p.pageNumber} style={{ color: p.breakReason === 'manual' ? '#6366f1' : '#334155' }}>
                      Page {p.pageNumber}: {p.breakReason}{p.breakReason === 'manual' ? ' (manual)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div><strong>Last saved:</strong> {lastDraftSavedAt ? new Date(lastDraftSavedAt).toLocaleString() : 'Never'}</div>
          </div>
</details>
        <details style={{ border: '1px solid #a5b4fc', borderRadius: '8px', backgroundColor: '#eef2ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#3730a3' }}>
            Designer Smoke Checklist
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const checks = [
                { label: 'Campaign loaded', ok: Boolean(selectedCampId && reportPayload) },
                { label: 'A4 Canvas rendered', ok: renderedPages.length > 0 },
                { label: 'Structure tree available', ok: officialStructureTree.length > 0 },
                { label: 'Selected node valid', ok: !selectedNodeId || Boolean(findStructureNodeById(officialStructureTree, selectedNodeId)) },
                { label: 'Draft version valid', ok: !availableDraft || availableDraft.version === DESIGNER_DRAFT_VERSION },
                { label: `Text overrides (${Object.keys(elementTextOverrides).length})`, ok: true },
                { label: `Style overrides (${Object.keys(elementStyleOverrides).length})`, ok: true },
                { label: 'Undo available', ok: canUndo },
                { label: 'Redo available', ok: canRedo },
                { label: `Manual page breaks (${manualPageBreaks.length})`, ok: true },
              ];
              return checks.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: c.ok ? '#166534' : '#b91c1c', fontWeight: 700 }}>{c.ok ? '\u2713' : '\u2717'}</span>
                  <span>{c.label}</span>
                </div>
              ));
})()}
          </div>
        </details>
{/* ── Phase 13K: Final Pre-Integration Audit ──
    Comprehensive final check before any backend integration.
    Audit-only. No request is sent. No backend modification.
    Does not change payload contract, preview shape, validation rules,
    draft, pagination, inspectors, or toolbar behavior. */}
<details style={{ border: '1px solid #1e293b', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#0f172a' }}>
            Final Pre-Integration Audit
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const readiness = getExperimentalExportReadiness();
              const bridgePayload = buildDesignerExportBridgePayload();
              const bridgeValidation = validateDesignerExportBridgePayload(bridgePayload);
              const preview = buildDesignerPageDocumentRequestPreview();
              const estimatedJsonBytes = preview ? new Blob([JSON.stringify(preview)]).size : 0;
              const previewValidation = validateDesignerPageDocumentRequestPreview(preview, estimatedJsonBytes);
              const fragmentIdSet = new Set(fragments.map((f) => f.id));
              const orphanTextKeys = bridgePayload ? Object.keys(bridgePayload.elementTextOverrides).filter((k: string) => !fragmentIdSet.has(k)) : [];
              const orphanStyleKeys = bridgePayload ? Object.keys(bridgePayload.elementStyleOverrides).filter((k: string) => !fragmentIdSet.has(k)) : [];
              const orphanBreakKeys = bridgePayload ? bridgePayload.manualPageBreaks.filter((k: string) => !fragmentIdSet.has(k)) : [];
              const manualBreaksValid = manualPageBreaks.every((id) => fragmentIdSet.has(id));
              const canEnable = readiness.ready && previewValidation.valid;
              type AuditItem = { label: string; pass: boolean; detail: string };
              const items: AuditItem[] = [
                { label: 'Bridge payload valid', pass: bridgeValidation.valid, detail: bridgeValidation.valid ? 'All bridge payload validation checks pass.' : `Errors: ${bridgeValidation.errors.join('; ')}` },
                { label: 'PageDocument preview valid', pass: previewValidation.valid, detail: previewValidation.valid ? 'All pageDocument preview validation checks pass.' : `Errors: ${previewValidation.errors.join('; ')}${previewValidation.warnings.length > 0 ? ` | Warnings: ${previewValidation.warnings.join('; ')}` : ''}` },
                { label: 'Export readiness ready', pass: readiness.ready, detail: readiness.ready ? 'All readiness checks pass.' : `Reasons: ${readiness.reasons.join('; ')}` },
                { label: 'Estimated request size <= 5 MB', pass: estimatedJsonBytes <= 5 * 1024 * 1024, detail: estimatedJsonBytes === 0 ? 'No preview available — cannot estimate size.' : `Estimated size: ${(estimatedJsonBytes / 1024).toFixed(1)} KB (${estimatedJsonBytes <= 5 * 1024 * 1024 ? 'within limit' : 'EXCEEDS LIMIT'})` },
                { label: 'Manual breaks valid', pass: manualBreaksValid, detail: manualBreaksValid ? `All ${manualPageBreaks.length} manual break target(s) map to existing fragments.` : `Orphan break keys: ${orphanBreakKeys.length} — ${orphanBreakKeys.join(', ')}` },
                { label: 'No orphan override keys', pass: orphanTextKeys.length === 0 && orphanStyleKeys.length === 0, detail: orphanTextKeys.length === 0 && orphanStyleKeys.length === 0 ? 'All override keys map to existing fragments.' : `Orphan text: ${orphanTextKeys.length}, orphan style: ${orphanStyleKeys.length}` },
                { label: 'Experimental button guarded', pass: true, detail: canEnable ? 'Button is enabled only when readiness AND preview validation both pass. Clicks open a confirmation modal — no request sent.' : 'Button is disabled until readiness and preview validation both pass.' },
                { label: 'Backend request disabled', pass: true, detail: 'No fetch or apiFetch is called. The confirmation modal states "Backend integration deferred." Official PDF, /reports, backend, Prisma, and the Experimental Endpoint remain unchanged.' },
              ];
              const allPass = items.every((i) => i.pass);
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 900, color: allPass ? '#166534' : '#b91c1c', backgroundColor: allPass ? '#dcfce7' : '#fee2e2', border: `2px solid ${allPass ? '#166534' : '#b91c1c'}` }}>
                      {allPass ? 'ALL PASS' : 'ISSUES FOUND'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      {items.filter((i) => i.pass).length}/{items.length} checks passed
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ border: `1px solid ${item.pass ? '#bbf7d0' : '#fecaca'}`, borderRadius: '6px', backgroundColor: item.pass ? '#f0fdf4' : '#fef2f2', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 900, color: item.pass ? '#166534' : '#b91c1c', backgroundColor: item.pass ? '#dcfce7' : '#fee2e2', border: `1px solid ${item.pass ? '#86efac' : '#fca5a5'}` }}>
                            {item.pass ? 'PASS' : 'FAIL'}
                          </span>
                          <strong style={{ fontSize: '12px', color: item.pass ? '#166534' : '#b91c1c' }}>{item.label}</strong>
                        </div>
                        <div style={{ color: item.pass ? '#374151' : '#991b1b', fontSize: '11px', lineHeight: 1.5, marginTop: '2px', marginLeft: '4px' }}>
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${allPass ? '#166534' : '#b91c1c'}`, backgroundColor: allPass ? '#f0fdf4' : '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: allPass ? '#166534' : '#b91c1c' }}>
                        Ready for backend integration: {allPass ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div style={{ color: allPass ? '#374151' : '#7f1d1d', fontSize: '11px', lineHeight: 1.6 }}>
                      {allPass
                        ? 'All pre-integration checks pass. The bridge payload, pageDocument preview, readiness, size, manual breaks, and export guard are verified. Backend integration can proceed when the endpoint is connected.'
                        : 'One or more pre-integration checks failed. Resolve the issues above before proceeding with backend integration.'}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 13K:</strong> Final pre-integration audit. No request is sent. No backend, /reports, PDF, Prisma, or endpoint is modified. Payload contract, preview shape, validation rules, draft, pagination, inspectors, and toolbar behavior are unchanged.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
        {/* ── Phase 14C: Experimental Export Request Audit ──
            Audits the actual request sent to the experimental PDF endpoint.
            Body is now { pageDocument } only, aligned with contract.
            campaignId inside pageDocument.metadata.
            Does not modify /reports, official PDF, backend, Prisma, or
            the Experimental PDF Endpoint. */}
        <details style={{ border: '1px solid #0e7490', borderRadius: '8px', backgroundColor: '#ecfeff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#155e75' }}>
            Experimental Export Request Audit
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const preview = buildDesignerPageDocumentRequestPreview();
              const body = preview ? { pageDocument: preview.pageDocument } : null;
              const estimatedBytes = body ? new Blob([JSON.stringify(body)]).size : 0;
              const campaignIdInMetadata = preview?.pageDocument.metadata.campaignId === selectedCampId;
              const items = [
                { label: 'Endpoint', value: 'POST /reports/experimental/page-document/pdf' },
                { label: 'Method', value: 'POST' },
                { label: 'Body shape', value: '{ pageDocument }' },
                { label: 'Includes campaignId top-level', value: 'No' },
                { label: 'campaignId in metadata', value: campaignIdInMetadata ? `Yes (${selectedCampId})` : 'No' },
                { label: 'Includes pageDocument', value: body && 'pageDocument' in body ? 'Yes' : 'No' },
                { label: 'pageDocument.source', value: preview?.pageDocument.source ?? '\u2014' },
                { label: 'Page count', value: String(preview?.pageDocument.pages.length ?? '\u2014') },
                { label: 'Fragment count', value: String(preview?.pageDocument.fragments.length ?? '\u2014') },
                { label: 'Estimated request size', value: estimatedBytes > 0 ? `${(estimatedBytes / 1024).toFixed(1)} KB` : '\u2014' },
                { label: 'Official PDF untouched', value: 'Yes' },
              ];
              return (
                <>
                  <div style={{ display: 'grid', gap: '4px', marginBottom: '10px' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                        <strong>{item.label}:</strong>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px', border: '1px solid #99f6e4', borderRadius: '6px', backgroundColor: '#f0fdfa', color: '#0f766e', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Contract aligned:</strong> The request body <code>{'{'} pageDocument {'}'}</code> now matches the endpoint contract exactly. <code>campaignId</code> lives inside <code>pageDocument.metadata.campaignId</code>.
                  </div>
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 14C:</strong> Body contract alignment. Top-level <code>campaignId</code> removed. <code>{'{'} pageDocument {'}'}</code> only. Backend, /reports, PDF, Prisma, and endpoint unchanged.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
        {/* ── Phase 14E: Export Comparison Notes ──
            Compares experimental export vs official PDF at a glance.
            No automatic comparison. No modification to any export logic. */}
        <details style={{ border: '1px solid #a78bfa', borderRadius: '8px', backgroundColor: '#f5f3ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#6d28d9' }}>
            Export Comparison Notes
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            <div style={{ display: 'grid', gap: '4px', marginBottom: '8px' }}>
              <div><strong>Official PDF:</strong> untouched</div>
              <div><strong>Experimental PDF:</strong> uses Designer PageDocument</div>
              <div><strong>Designer overrides included:</strong> {Object.keys(elementTextOverrides).length > 0 || Object.keys(elementStyleOverrides).length > 0 ? `Yes (${Object.keys(elementTextOverrides).length} text, ${Object.keys(elementStyleOverrides).length} style)` : 'No'}</div>
              <div><strong>Manual page breaks included:</strong> {manualPageBreaks.length > 0 ? `Yes (${manualPageBreaks.length})` : 'No'}</div>
              <div><strong>Expected difference:</strong> Experimental PDF may differ from the official report until a parity audit is complete.</div>
            </div>
            <div style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
              <strong>Phase 14E:</strong> Comparison notes only. No automatic comparison is performed. Backend, /reports, PDF, Prisma, and endpoint unchanged.
            </div>
          </div>
        </details>
        {/* ── Phase 14F: Experimental Export Parity Checklist ──
            Manual parity checklist for comparing the experimental PDF
            against the official report. Local UI state only. No backend.
            Does not affect export, /reports, PDF, Prisma, or endpoint. */}
        <details style={{ border: '1px solid #0891b2', borderRadius: '8px', backgroundColor: '#ecfeff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#155e75' }}>
            Experimental Export Parity Checklist
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const parityItems = [
                'Header/logo correct',
                'Main title correct',
                'Committee correct',
                'Summary tables correct',
                'Official notes correct',
                'Recommendations correct',
                'Appendices correct',
                'Final evaluation correct',
                'Signatures correct',
                'Manual page breaks respected',
                'Arabic rendering correct',
                'Page count acceptable',
              ];
              const checkedCount = parityItems.filter((id) => experimentalParityChecks[id]).length;
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: checkedCount === parityItems.length ? '#166534' : '#475569' }}>
                      {checkedCount}/{parityItems.length} checked
                    </span>
                    {checkedCount === parityItems.length && (
                      <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: 900, border: '1px solid #86efac' }}>
                        ALL PASS
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: '2px', fontSize: '12px', lineHeight: 1.8 }}>
                    {parityItems.map((label) => (
                      <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: experimentalParityChecks[label] ? '#166534' : '#475569', fontWeight: experimentalParityChecks[label] ? 700 : 400 }}>
                        <input
                          type="checkbox"
                          checked={experimentalParityChecks[label] ?? false}
                          onChange={(e) => setExperimentalParityChecks((prev) => ({ ...prev, [label]: e.target.checked }))}
                          style={{ margin: 0, accentColor: '#0f766e', cursor: 'pointer' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 14F:</strong> This checklist is manual and does not affect export. Backend, /reports, PDF, Prisma, and endpoint unchanged.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
        </>)}
        {/* ── Phase 14H: Export Failure Session Summary ──
            Session-only summary of the last experimental export,
            supports both success and failed attempts.
            No localStorage. No impact on export, /reports, or PDF. */}
        <details style={{ border: '1px solid #14b8a6', borderRadius: '8px', backgroundColor: '#f0fdfa' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#0f766e' }}>
            Last Experimental Export
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {lastExportSession ? (
              <div style={{ display: 'grid', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>Export status:</strong>
                  <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 900, color: lastExportSession.status === 'success' ? '#166534' : '#b91c1c', backgroundColor: lastExportSession.status === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${lastExportSession.status === 'success' ? '#86efac' : '#fca5a5'}` }}>
                    {lastExportSession.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div><strong>Time:</strong> {new Date(lastExportSession.at).toLocaleString()}</div>
                {lastExportSession.status === 'success' ? (
                  <>
                    <div><strong>Filename:</strong> {lastExportSession.filename}</div>
                    <div><strong>Blob size:</strong> {lastExportSession.blobSizeKB} KB</div>
                    <div><strong>Page count:</strong> {lastExportSession.pageCount}</div>
                    <div><strong>Fragment count:</strong> {lastExportSession.fragmentCount}</div>
                  </>
                ) : (
                  <div><strong>Error:</strong> {lastExportSession.errorMessage}</div>
                )}
                <div><strong>Official PDF untouched:</strong> Yes</div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>No experimental export in this session.</div>
            )}
            <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
              <strong>Phase 14H:</strong> Tracks both success and failed attempts. Session-only. Backend, /reports, PDF, Prisma, and endpoint unchanged.
            </div>
          </div>
        </details>
        {/* ── Phase 18E: Last Official Export Summary ──
            Session-only summary of the last official PDF export from
            Designer. No localStorage. No impact on PDF or endpoint. */}
        <details style={{ border: '1px solid #7c3aed', borderRadius: '8px', backgroundColor: '#f5f3ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#6d28d9' }}>
            Last Official Export
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {lastOfficialExport ? (
              <div style={{ display: 'grid', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>Export status:</strong>
                  <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 900, color: lastOfficialExport.status === 'success' ? '#166534' : '#b91c1c', backgroundColor: lastOfficialExport.status === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${lastOfficialExport.status === 'success' ? '#86efac' : '#fca5a5'}` }}>
                    {lastOfficialExport.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div><strong>Time:</strong> {new Date(lastOfficialExport.at).toLocaleString()}</div>
                {lastOfficialExport.status === 'success' ? (
                  <>
                    <div><strong>Filename:</strong> {lastOfficialExport.filename}</div>
                    <div><strong>Blob size:</strong> {lastOfficialExport.blobSizeKB} KB</div>
                  </>
                ) : (
                  <div><strong>Error:</strong> {lastOfficialExport.errorMessage}</div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>No official export in this session.</div>
            )}
            <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
              <strong>Phase 18E:</strong> Designer overrides applied via bridge. Session-only. Backend, /reports, PDF, Prisma, and endpoint unchanged.
            </div>
          </div>
        </details>
        {/* ── Phase 14I: Export History Mini Log ──
            Session-only mini log of the last 5 export attempts.
            No localStorage. No impact on export, /reports, or PDF. */}
        <details style={{ border: '1px solid #0d9488', borderRadius: '8px', backgroundColor: '#f0fdfa' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#115e59' }}>
            Experimental Export History ({exportSessionHistory.length})
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {exportSessionHistory.length === 0 ? (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>No export attempts in this session.</div>
            ) : (
              <div style={{ display: 'grid', gap: '6px' }}>
                {exportSessionHistory.map((entry, idx) => (
                  <div key={idx} style={{ border: `1px solid ${entry.status === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius: '6px', padding: '8px 10px', backgroundColor: entry.status === 'success' ? '#f0fdf4' : '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ padding: '1px 6px', borderRadius: '999px', fontSize: '10px', fontWeight: 900, color: entry.status === 'success' ? '#166534' : '#b91c1c', backgroundColor: entry.status === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${entry.status === 'success' ? '#86efac' : '#fca5a5'}` }}>
                        {entry.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '10px' }}>{new Date(entry.at).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#374151', fontSize: '11px', lineHeight: 1.5 }}>
                      {entry.status === 'success' ? (
                        <div><strong>{entry.filename}</strong> &middot; {entry.blobSizeKB} KB &middot; {entry.pageCount}p &middot; {entry.fragmentCount}f</div>
                      ) : (
                        <div style={{ color: '#991b1b' }}>{entry.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {exportSessionHistory.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setExportSessionHistory([])}
                  style={{ padding: '5px 12px', border: '1px solid #94a3b8', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}
                >
                  Clear History
                </button>
              </div>
            )}
            <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
              <strong>Phase 14I:</strong> Last 5 attempts. Session-only. Backend, /reports, PDF, Prisma, and endpoint unchanged.
            </div>
          </div>
        </details>
        {/* ── Phase 14J: Export Attempt Counter ──
            Session-only attempt counter for experimental exports.
            No localStorage. No impact on export, /reports, or PDF. */}
        <details style={{ border: '1px solid #0284c7', borderRadius: '8px', backgroundColor: '#f0f9ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#0369a1' }}>
            Experimental Export Attempts
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
              <div style={{ border: '1px solid #d8e0ea', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800 }}>Total</div>
                <div style={{ color: '#0f172a', fontSize: '22px', fontWeight: 900 }}>{exportAttemptStats.total}</div>
              </div>
              <div style={{ border: '1px solid #86efac', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#f0fdf4' }}>
                <div style={{ color: '#166534', fontSize: '11px', fontWeight: 800 }}>Success</div>
                <div style={{ color: '#166534', fontSize: '22px', fontWeight: 900 }}>{exportAttemptStats.success}</div>
              </div>
              <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#fef2f2' }}>
                <div style={{ color: '#b91c1c', fontSize: '11px', fontWeight: 800 }}>Failed</div>
                <div style={{ color: '#b91c1c', fontSize: '22px', fontWeight: 900 }}>{exportAttemptStats.failed}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setExportAttemptStats({ total: 0, success: 0, failed: 0 })}
                style={{ padding: '5px 12px', border: '1px solid #94a3b8', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '11px' }}
              >
                Reset Attempt Stats
              </button>
            </div>
            <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
              <strong>Phase 14J:</strong> Session-only counters. Reset does not affect <code>lastExportSession</code> or <code>exportSessionHistory</code>. Backend, /reports, PDF, Prisma, and endpoint unchanged.
            </div>
          </div>
        </details>
        {!pdfReviewMode && (
        <>
        {/* ── Phase 16A: Experimental PDF Acceptance Gate ──
            Diagnostic gate that checks 6 conditions for designer
            PDF acceptance review. No export logic, no backend,
            no official PDF impact. */}
        <details style={{ border: '1px solid #7c3aed', borderRadius: '8px', backgroundColor: '#f5f3ff' }}>
          <summary style={{ padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', color: '#5b21b6' }}>
            Experimental PDF Acceptance Gate
          </summary>
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
            {(() => {
              const allFragmentsSupported = fragments.length > 0 && !fragments.some((f) => f.kind === 'unsupported');
              let orderPreserved = true;
              let noMissingFragments = true;
              if (pageDocument) {
                const pageFragmentIds = pageDocument.pages.flatMap((p) => p.fragmentIds);
                const originalIds = fragments.map((f) => f.id);
                const pageIdsInOrder = pageFragmentIds.filter((id) => originalIds.includes(id));
                orderPreserved = pageIdsInOrder.every((id, i) => id === originalIds[i]);
                const pageIdSet = new Set(pageFragmentIds);
                noMissingFragments = fragments.every((f) => pageIdSet.has(f.id));
              }
              const exportSucceeded = lastExportSession?.status === 'success';
              const pageCountGenerated = documentPages.length > 0;
              const fileSizeGenerated = exportSucceeded && (lastExportSession?.blobSizeKB ?? 0) > 0;
              const checks = [
                { label: 'All fragments supported', pass: allFragmentsSupported },
                { label: 'Order preserved', pass: orderPreserved },
                { label: 'No missing fragments', pass: noMissingFragments },
                { label: 'Export succeeded', pass: exportSucceeded },
                { label: 'Page count generated', pass: pageCountGenerated },
                { label: 'File size generated', pass: fileSizeGenerated },
              ];
              const passedCount = checks.filter((c) => c.pass).length;
              const allPass = passedCount === checks.length;
              return (
                <>
                  <div style={{ display: 'grid', gap: '4px', marginBottom: '10px' }}>
                    {checks.map((c) => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.pass ? '#166534' : '#b91c1c', fontWeight: c.pass ? 700 : 400 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: 900, color: '#ffffff', backgroundColor: c.pass ? '#16a34a' : '#dc2626', flexShrink: 0 }}>
                          {c.pass ? '✓' : '✗'}
                        </span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: allPass ? '#166534' : '#475569' }}>
                      {passedCount}/{checks.length} passed
                    </span>
                  </div>
                  {allPass && (
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#d1fae5', border: '2px solid #34d399', textAlign: 'center' }}>
                      <div style={{ color: '#065f46', fontSize: '16px', fontWeight: 900 }}>
                        READY FOR DESIGNER PDF REVIEW
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
                    <strong>Phase 16A:</strong> Diagnostic gate only. Does not affect export, official PDF, backend, Prisma, or endpoint. Experimental PDF remains secondary.
                  </div>
                </>
              );
            })()}
          </div>
        </details>
        </>)}
      </div>
    </details>
);





