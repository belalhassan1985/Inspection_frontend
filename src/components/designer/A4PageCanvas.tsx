import React from 'react';
import type { PaginatedPage } from '../../utils/paginate';
import { A4 } from '../../utils/paginate';
import { resolveFlowTargetId } from '../../utils/designerFlowTargets';
import { FragmentRenderer } from './FragmentRenderer';
import { DESIGNER_BOTTOM_GUTTER_MM, DESIGNER_FOOTER_HEIGHT_MM } from './designerPageLayout';

const showConfidentialHeaderFooter = true;

function toArabicNumerals(n: number): string {
  const digits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).split('').map(c => digits[parseInt(c)]).join('');
}

const QUICK_EDIT_KINDS = new Set([
  'officialNotesTitle',
  'notesCategoryTitle',
  'noteItem',
  'recommendationsTitle',
  'recommendationAuthorityTitle',
  'recommendationItem',
  'finalEvaluation',
  'signatures',
  'appendicesTitle',
  'appendixTitle',
  'appendixParagraph',
]);

/**
 * A4PageCanvas — يرسم ورقة A4 واحدة بهوامشها ورقمها، ويعرض شظاياها بنفس FragmentRenderer
 * المستخدم في القياس (فيتطابق ما يُعرض مع ما قِيس).
 *
 * تجريبي، قراءة فقط. بلا overflow:hidden — لا يُخفى أي محتوى. الصفحات العادية بارتفاع A4 ثابت
 * (minHeight)، والصفحة التي تحمل عنصراً عملاقاً تنمو لتُظهر كامل المحتوى مع شريط تحذير.
 */
export const A4PageCanvas: React.FC<{
  page: PaginatedPage;
  pageIndex: number;
  totalPages: number;
  onQuickEdit?: (fragId: string) => void;
  selectedFlowTargetId: string | null;
  manualPageBreaks: string[];
  onTogglePageBreak: (flowTargetId: string) => void;
}> = ({ page, pageIndex, totalPages, onQuickEdit, selectedFlowTargetId, manualPageBreaks, onTogglePageBreak }) => {
  const [openFlowMenuId, setOpenFlowMenuId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOpenFlowMenuId(null);
  }, [selectedFlowTargetId]);

  return (
    <div
      className="rd-a4-page"
      data-page-index={pageIndex}
      style={{
        width: `${A4.widthMm}mm`,
        height: `${A4.heightMm}mm`,
        minHeight: `${A4.heightMm}mm`,
        maxHeight: `${A4.heightMm}mm`,
        padding: `${A4.margin.top}mm ${A4.margin.right}mm ${DESIGNER_BOTTOM_GUTTER_MM}mm ${A4.margin.left}mm`,
        margin: '0 auto 28px',
        backgroundColor: '#ffffff',
        border: '1px solid #94a3b8',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14)',
        position: 'relative',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        direction: 'rtl',
        textAlign: 'right',
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <div className="rd-content-bounds" aria-hidden="true" />
      <div className="rd-safe-area" aria-hidden="true" />

      {showConfidentialHeaderFooter && (
        <div className="rd-a4-header" style={{ position: 'absolute', top: '4mm', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>سري</span>
        </div>
      )}

      <div
        className="rd-a4-content"
        style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden', width: '100%' }}
      >
      {page.oversized && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}
        >
          ⚠️ هذا العنصر أطول من صفحة A4 — مُفرد في صفحته ويحتاج تقسيماً داخلياً لاحقاً (لم يُقصّ أي محتوى).
        </div>
      )}

      {page.items.map((f, fragIndex) => {
        const flowTargetId = resolveFlowTargetId(f);
        const isSelectedFlowTarget = flowTargetId !== null && selectedFlowTargetId === flowTargetId;
        const hasPageBreak = flowTargetId !== null && manualPageBreaks.includes(flowTargetId);
        const flowMenuOpen = flowTargetId !== null && openFlowMenuId === flowTargetId;

        return (
          <div
            key={f.id}
            className={`rd-fragment rd-fragment-${f.kind}`}
            data-frag-id={f.id}
            data-frag-index={fragIndex}
            data-frag-kind={f.kind}
            data-frag-label-arabic={f.title || undefined}
            data-flow-target-id={flowTargetId || undefined}
            style={{ position: 'relative' }}
          >
          {isSelectedFlowTarget && flowTargetId && (
            <div
              data-snapshot-exclude="true"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setOpenFlowMenuId(null);
                }
              }}
              style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px', zIndex: 10002 }}
            >
              <button
                type="button"
                title="ابدأ هذا العنصر من صفحة جديدة"
                aria-label="ابدأ هذا العنصر من صفحة جديدة"
                aria-pressed={hasPageBreak}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpenFlowMenuId(null);
                  onTogglePageBreak(flowTargetId);
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  border: `1px solid ${hasPageBreak ? '#4f46e5' : '#94a3b8'}`,
                  borderRadius: '6px',
                  backgroundColor: hasPageBreak ? '#e0e7ff' : '#ffffff',
                  color: hasPageBreak ? '#3730a3' : '#334155',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '19px',
                  fontWeight: 800,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ↵
              </button>
              <button
                type="button"
                title="خيارات تدفق الصفحة"
                aria-label="خيارات تدفق الصفحة"
                aria-haspopup="menu"
                aria-expanded={flowMenuOpen}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpenFlowMenuId((current) => current === flowTargetId ? null : flowTargetId);
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  border: '1px solid #94a3b8',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '18px',
                  fontWeight: 800,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ⋮
              </button>
              {flowMenuOpen && (
                <div
                  role="menu"
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '34px',
                    right: '34px',
                    width: '210px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.16)',
                    overflow: 'hidden',
                    padding: '4px',
                    textAlign: 'right',
                  }}
                >
                  {hasPageBreak && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpenFlowMenuId(null);
                        onTogglePageBreak(flowTargetId);
                      }}
                      style={{ width: '100%', border: 0, borderRadius: '4px', backgroundColor: 'transparent', color: '#991b1b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, padding: '8px 10px', textAlign: 'right' }}
                    >
                      إزالة فاصل الصفحة
                    </button>
                  )}
                  <div role="menuitem" aria-disabled="true" style={{ borderTop: hasPageBreak ? '1px solid #e2e8f0' : 0, color: '#94a3b8', fontSize: '11px', fontWeight: 600, padding: '8px 10px' }}>
                    محجوز لخيارات التدفق المستقبلية
                  </div>
                </div>
              )}
            </div>
          )}
          {isSelectedFlowTarget && QUICK_EDIT_KINDS.has(f.kind) && (
            <button
              className="rd-quick-edit-btn"
              data-snapshot-exclude="true"
              title="تعديل المحتوى"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickEdit?.(f.id);
              }}
              style={{
                position: 'absolute',
                top: '4px',
                right: isSelectedFlowTarget ? '76px' : '4px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #a5b4fc',
                borderRadius: '6px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                cursor: 'pointer',
                opacity: 0.55,
                zIndex: 10001,
                fontSize: '18px',
                lineHeight: 1,
                padding: '2px',
                pointerEvents: 'auto',
                transition: 'opacity 0.12s, background-color 0.12s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = '#c7d2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.55';
                e.currentTarget.style.backgroundColor = '#eef2ff';
              }}
            >
              ✏
            </button>
          )}
          <FragmentRenderer fragment={f} />
          </div>
        );
      })}
        <div data-measure-sentinel style={{ height: '1px', visibility: 'hidden', pointerEvents: 'none' }} />
      </div>

      {showConfidentialHeaderFooter && (
        <div
          className="rd-a4-footer"
          style={{
            position: 'relative',
            flex: `0 0 ${DESIGNER_FOOTER_HEIGHT_MM}mm`,
            height: `${DESIGNER_FOOTER_HEIGHT_MM}mm`,
            minHeight: `${DESIGNER_FOOTER_HEIGHT_MM}mm`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textDecoration: 'underline', textUnderlineOffset: '2px' }}>سري</div>
          <div style={{ fontSize: '10px', color: '#000', marginTop: '1px' }}>{toArabicNumerals(pageIndex + 1)}-{toArabicNumerals(totalPages)}</div>
        </div>
      )}
    </div>
  );
};
