import React from 'react';
import type { DesignerExportBridgePayload } from './designerDiagnostics';

interface DesignerDryRunModalProps {
  summary: DesignerExportBridgePayload;
  onClose: () => void;
}

export const DesignerDryRunModal: React.FC<DesignerDryRunModalProps> = ({ summary, onClose }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onClick={onClose}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        maxWidth: '560px',
        width: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '24px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#0f766e', fontWeight: 900, fontSize: '16px' }}>Dry Run Export Payload Summary</h3>
        <button
          type="button"
          onClick={onClose}
          style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
        >
          &times;
        </button>
      </div>
      <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: '#f0fdfa', padding: '14px', marginBottom: '12px' }}>
        <div style={{ color: '#0f766e', fontSize: '11px', fontWeight: 800, marginBottom: '8px' }}>Phase 13F — Dry Run Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Campaign ID</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700, wordBreak: 'break-all' }}>{summary.campaignId}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Draft Version</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{summary.draftVersion}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Fragments Count</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{summary.fragmentsCount}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Rendered Pages Count</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{summary.renderedPagesCount}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Text Overrides</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{Object.keys(summary.elementTextOverrides).length}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Style Overrides</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{Object.keys(summary.elementStyleOverrides).length}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Manual Page Breaks</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>{summary.manualPageBreaks.length}</div>
          </div>
          <div style={{ border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>Generated At</div>
            <div style={{ color: '#0f172a', fontSize: '11px', fontWeight: 500 }}>{new Date(summary.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', lineHeight: 1.6, textAlign: 'center' }}>
        <strong>Dry Run:</strong> Payload built and displayed locally. No request was sent. No PDF was downloaded. Draft, pagination, /reports, backend, Prisma, and the Experimental PDF Endpoint were not modified.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{ padding: '8px 16px', border: '1px solid #0f766e', borderRadius: '6px', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);
