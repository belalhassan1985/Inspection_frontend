import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import { isDesignerDevMode } from './designerDevMode';

export type DesignerLayoutShellProps = {
  error: string;
  toolbar: React.ReactNode;
  overlays: React.ReactNode;
  statusPanel: React.ReactNode;
  hiddenStyleControls: React.ReactNode;
  dataStatus: React.ReactNode;
  showWorkspace: boolean;
  previewStyle: React.ReactNode;
  structureTree: React.ReactNode;
  canvas: React.ReactNode;
  propertiesPanel: React.ReactNode;
  reviewToggle: React.ReactNode;
  diagnosticsDrawer: React.ReactNode;
  renderedPagesCount: number;
  previewScopeRef: RefObject<HTMLDivElement | null>;
  setActiveViewportNodeId: (id: string | null) => void;
  resolveFragmentToNodeId: (fragId: string) => string | null;
  formattingDrawerOpen: boolean;
  onToggleFormatting: () => void;
  formattingDrawerContent: React.ReactNode;
};

function toArabicNumerals(n: number): string {
  const digits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).split('').map(c => digits[parseInt(c)] || c).join('');
}

function parseArabicNumerals(input: string): number {
  const arabicMap: Record<string, string> = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
  const converted = input.split('').map(c => arabicMap[c] ?? c).join('');
  const n = parseInt(converted, 10);
  return isNaN(n) ? 0 : n;
}

export const DesignerLayoutShell: React.FC<DesignerLayoutShellProps> = ({
  error,
  toolbar,
  overlays,
  statusPanel,
  hiddenStyleControls,
  dataStatus,
  showWorkspace,
  previewStyle,
  structureTree,
  canvas,
  propertiesPanel,
  reviewToggle,
  diagnosticsDrawer,
  renderedPagesCount,
  previewScopeRef,
  setActiveViewportNodeId,
  resolveFragmentToNodeId,
  formattingDrawerOpen,
  onToggleFormatting,
  formattingDrawerContent,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isPageJumpMode, setIsPageJumpMode] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const jumpInputRef = useRef<HTMLInputElement>(null);

  const scrollToPage = useCallback((pageNum: number) => {
    const scope = previewScopeRef.current;
    if (!scope || renderedPagesCount === 0) return;
    const clamped = Math.max(1, Math.min(pageNum, renderedPagesCount));
    const targetIdx = clamped - 1;
    const pageEl = scope.querySelector<HTMLElement>(`[data-page-index="${targetIdx}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(clamped);
    }
  }, [previewScopeRef, renderedPagesCount]);

  const enterJumpMode = useCallback(() => {
    setJumpPageInput(String(currentPage));
    setIsPageJumpMode(true);
  }, [currentPage]);

  const submitJump = useCallback(() => {
    const pageNum = parseArabicNumerals(jumpPageInput);
    if (pageNum > 0) scrollToPage(pageNum);
    setIsPageJumpMode(false);
  }, [jumpPageInput, scrollToPage]);

  const cancelJump = useCallback(() => {
    setIsPageJumpMode(false);
  }, []);

  useEffect(() => {
    if (isPageJumpMode && jumpInputRef.current) {
      jumpInputRef.current.focus();
      jumpInputRef.current.select();
    }
  }, [isPageJumpMode]);

  useEffect(() => {
    if (!showWorkspace || renderedPagesCount === 0) return;
    const scope = previewScopeRef.current;
    if (!scope) return;

    let ticking = false;
    const updatePageIndicator = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const pages = scope.querySelectorAll('.rd-a4-page');
        if (pages.length === 0) { ticking = false; return; }
        const viewportCenter = window.innerHeight / 2;
        let closestPage = 0;
        let closestDistance = Infinity;
        pages.forEach((page, idx) => {
          const rect = page.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          const pageCenter = rect.top + rect.height / 2;
          const distance = Math.abs(pageCenter - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = idx;
          }
        });
        setCurrentPage(closestPage + 1);

        // Track closest fragment to viewport center for section highlighting
        const fragments = scope.querySelectorAll('.rd-fragment');
        if (fragments.length > 0) {
          let closestFragDist = Infinity;
          let closestFragId: string | null = null;
          fragments.forEach((frag) => {
            const rect = frag.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            const fragCenter = rect.top + rect.height / 2;
            const dist = Math.abs(fragCenter - viewportCenter);
            if (dist < closestFragDist) {
              closestFragDist = dist;
              closestFragId = (frag as HTMLElement).dataset.fragId || null;
            }
          });
          if (closestFragId) {
            const nodeId = resolveFragmentToNodeId(closestFragId);
            if (nodeId) setActiveViewportNodeId(nodeId);
          }
        }

        ticking = false;
      });
    };

    const handleScroll = () => {
      updatePageIndicator();
      setShowBackToTop(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updatePageIndicator();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showWorkspace, renderedPagesCount, previewScopeRef, setActiveViewportNodeId, resolveFragmentToNodeId]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', backgroundColor: '#f6f8fb', minHeight: '100vh', paddingBottom: '24px' }}>
      <div style={{ marginBottom: '14px' }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>مصمم التقارير</h1>
        <p className="page-subtitle" style={{ margin: 0 }}>
          تحرير وتنسيق التقرير قبل التصدير
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* Sticky toolbar wrapper */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#f6f8fb',
          paddingBottom: '4px',
          marginBottom: '16px',
          marginTop: '-4px',
          paddingTop: '4px',
        }}
      >
        {toolbar}
      </div>

      {overlays}
      {statusPanel}
      {hiddenStyleControls}
      {dataStatus}

      {showWorkspace && (
        <div>
          {previewStyle}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 19%) minmax(820px, 1fr) minmax(220px, 19%)',
              gap: '16px',
              alignItems: 'start',
              overflowX: 'auto',
            }}
          >
            {structureTree}
            {canvas}
            {propertiesPanel}
          </div>

          {reviewToggle}
          {isDesignerDevMode() && <div id="designer-diagnostics">{diagnosticsDrawer}</div>}
        </div>
      )}

      {/* Floating: Current page indicator (clickable for page jump) */}
      {showWorkspace && renderedPagesCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 90,
            padding: isPageJumpMode ? '4px 8px' : '6px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: "'Cairo', sans-serif",
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)',
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isPageJumpMode ? (
            <>
              <span>صفحة</span>
              <input
                ref={jumpInputRef}
                type="text"
                inputMode="numeric"
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); submitJump(); }
                  else if (e.key === 'Escape') { e.preventDefault(); cancelJump(); }
                }}
                onBlur={cancelJump}
                style={{
                  width: '36px',
                  padding: '2px 4px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              <span>من {toArabicNumerals(renderedPagesCount)}</span>
            </>
          ) : (
            <span
              onClick={enterJumpMode}
              title="انقر للانتقال إلى صفحة"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              صفحة {toArabicNumerals(currentPage)} من {toArabicNumerals(renderedPagesCount)}
            </span>
          )}
        </div>
      )}

      {/* Floating: Back-to-top button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="العودة للأعلى"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 90,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
          title="العودة للأعلى"
        >
          ↑
        </button>
      )}

      {/* Formatting drawer overlay */}
      {formattingDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
            }}
            onClick={onToggleFormatting}
          />
          <div
            style={{
              position: 'relative',
              width: '340px',
              maxWidth: '90vw',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 24px rgba(15, 23, 42, 0.15)',
              overflowY: 'auto',
              direction: 'rtl',
            }}
          >
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                تنسيق التقرير
              </h3>
              <button
                type="button"
                onClick={onToggleFormatting}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              {formattingDrawerContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
