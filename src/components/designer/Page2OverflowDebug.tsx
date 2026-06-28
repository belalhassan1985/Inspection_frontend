// Phase 52C Interactive Debug Overlay

import React, { useEffect, useState } from 'react';

interface Page2OverflowDebugProps {
  onAudit: () => any;
}

export const Page2OverflowDebug: React.FC<Page2OverflowDebugProps> = ({ onAudit }) => {
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const runAudit = () => {
    const result = onAudit();
    setAuditResult(result);
    setIsVisible(true);
  };

  useEffect(() => {
    // Make audit functions available globally
    window.runPhase52CAudit = runAudit;
    window.auditPage2Overflow = () => {
      const result = onAudit();
      console.log('[Phase52C Debug]', result);
    };
  }, [onAudit]);

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999, background: '#fff', border: '2px solid #dc2626', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>Phase 52C Debug</h3>
      <button onClick={runAudit} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Run Page 2 Overflow Audit
      </button>
      {isVisible && auditResult && (
        <div style={{ marginTop: '10px', maxHeight: '400px', overflow: 'auto', fontSize: '12px' }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(auditResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};