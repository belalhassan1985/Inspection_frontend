import React from 'react';
import type { PaginatedPage } from '../../utils/paginate';
import { A4PageCanvas } from './A4PageCanvas';

export type DesignerCanvasShellProps = {
  previewScopeRef: React.RefObject<HTMLDivElement | null>;
  renderedPages: PaginatedPage[];
  handlePreviewElementClick: React.MouseEventHandler<HTMLDivElement>;
  onQuickEdit?: (fragId: string) => void;
  selectedFlowTargetId: string | null;
  manualPageBreaks: string[];
  onTogglePageBreak: (flowTargetId: string) => void;
};

export const DesignerCanvasShell: React.FC<DesignerCanvasShellProps> = ({
  previewScopeRef,
  renderedPages,
  handlePreviewElementClick,
  onQuickEdit,
  selectedFlowTargetId,
  manualPageBreaks,
  onTogglePageBreak,
}) => (
  <main style={{ minWidth: 0, direction: 'rtl' }}>
    <div
      ref={previewScopeRef}
      className="rd-style-scope rd-edit-mode"
      onClick={handlePreviewElementClick}
      style={{ backgroundColor: '#dfe5ed', padding: '36px 0 44px', borderRadius: '8px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}
    >
      {renderedPages.map((page, idx) => {
        const showPbMarker = page.breakReason === 'manual';
        const pbStartFragment = showPbMarker ? page.startFragmentId : null;
        return [
          showPbMarker ? (
            <div key={`pb-${page.pageNumber}`} aria-label={pbStartFragment ? `بداية صفحة جديدة قبل ${pbStartFragment}` : 'بداية صفحة جديدة'} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto 10px', width: 'min(190mm, calc(100% - 24px))', color: '#475569', fontSize: '11px', fontWeight: 700 }}>
              <span aria-hidden="true" style={{ height: '1px', backgroundColor: '#94a3b8', flex: 1 }} />
              <span>بداية صفحة جديدة</span>
              <span aria-hidden="true" style={{ height: '1px', backgroundColor: '#94a3b8', flex: 1 }} />
            </div>
          ) : null,
          <A4PageCanvas
            key={page.pageNumber}
            page={page}
            pageIndex={idx}
            totalPages={renderedPages.length}
            onQuickEdit={onQuickEdit}
            selectedFlowTargetId={selectedFlowTargetId}
            manualPageBreaks={manualPageBreaks}
            onTogglePageBreak={onTogglePageBreak}
          />,
        ];
      })}
    </div>
  </main>
);
