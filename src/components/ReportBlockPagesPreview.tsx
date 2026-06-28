import type { ReportBlock, ReportPresentation } from '../utils/reportBlocks';

type ReportBlockPagesPreviewProps = {
  blocks: ReportBlock[];
  reportPresentation: ReportPresentation;
  onAddPageBreakBefore: (blockId: string) => void;
  onRemovePageBreak: (blockId: string) => void;
};

type BlockPreviewPage = {
  id: string;
  title: string;
  blocks: ReportBlock[];
};

const PAGE_STYLE = {
  width: '210mm',
  height: '297mm',
  padding: '20mm 15mm',
  margin: '0 auto 24px',
  backgroundColor: '#ffffff',
  border: '1px solid #94a3b8',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14)',
  position: 'relative' as const,
  overflow: 'hidden',
  direction: 'rtl' as const,
  textAlign: 'right' as const,
  boxSizing: 'border-box' as const,
};

const summarizeBlock = (block: ReportBlock): string => {
  if (block.type === 'section' && typeof block.content === 'object' && block.content) {
    const section = block.content as { subsections?: unknown[]; narrativeText?: string };
    const parts = [];
    if (section.narrativeText) parts.push('يحتوي سرد نصي');
    if (Array.isArray(section.subsections)) parts.push(`${section.subsections.length} أقسام فرعية`);
    return parts.length ? parts.join('، ') : 'قسم رئيسي بدون ملخص إضافي';
  }

  if (block.type === 'introTable') return 'جداول تمهيدية ومعلومات عامة إن وجدت';
  if (block.type === 'signatures') return 'بيانات التوقيع والمصادقة';
  if (block.type === 'finalEvaluation') return 'بيانات التقييم النهائي';
  return 'Block تمهيدي من بيانات التقرير';
};

const mayExceedA4 = (block: ReportBlock): boolean => {
  if (block.type !== 'section') return false;
  if (typeof block.content !== 'object' || !block.content) return false;

  const section = block.content as { subsections?: unknown[]; narrativeText?: string };
  return (section.narrativeText?.length ?? 0) > 1200 || (section.subsections?.length ?? 0) > 6;
};

const buildPreviewPages = (blocks: ReportBlock[], reportPresentation: ReportPresentation): BlockPreviewPage[] => {
  const pages: BlockPreviewPage[] = [];
  const firstPageTypes = new Set<ReportBlock['type']>(['header', 'title', 'assignment', 'committee', 'introTable']);
  const orderedBlocks = [
    ...blocks.filter((block) => firstPageTypes.has(block.type)),
    ...blocks.filter((block) => block.type === 'section'),
    ...blocks.filter((block) => block.type === 'finalEvaluation'),
    ...blocks.filter((block) => block.type === 'signatures'),
  ];
  const hasPageBreakBefore = (blockId: string) => reportPresentation.pageBreaks.some(
    (pageBreak) => pageBreak.blockId === blockId && pageBreak.type === 'before'
  );
  let currentPage: BlockPreviewPage | null = null;

  orderedBlocks.forEach((block) => {
    const startsIntroPage = firstPageTypes.has(block.type);
    const shouldStartNewPage = !currentPage || hasPageBreakBefore(block.id);

    if (shouldStartNewPage) {
      currentPage = {
        id: `preview-page-${block.id}`,
        title: startsIntroPage ? 'الصفحة التمهيدية' : block.title,
        blocks: [],
      };
      pages.push(currentPage);
    }

    if (currentPage) {
      currentPage.blocks.push(block);
    }
  });

  return pages;
};

export const ReportBlockPagesPreview: React.FC<ReportBlockPagesPreviewProps> = ({
  blocks,
  reportPresentation,
  onAddPageBreakBefore,
  onRemovePageBreak,
}) => {
  const pages = buildPreviewPages(blocks, reportPresentation);
  const hasPageBreakBefore = (blockId: string) => reportPresentation.pageBreaks.some(
    (pageBreak) => pageBreak.blockId === blockId && pageBreak.type === 'before'
  );

  return (
    <div className="no-print" style={{ maxWidth: '1100px', margin: '24px auto', direction: 'rtl', textAlign: 'right' }}>
      <div style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        fontFamily: "'Cairo', sans-serif",
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Block Pages Preview - تجريبي</h3>
        <div style={{ color: '#475569', fontSize: '13px' }}>
          معاينة تجريبية لتوزيع الـ Blocks على صفحات A4، بدون استبدال التقرير الحالي وبدون PDF/Word.
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ padding: '5px 10px', backgroundColor: '#e0f2fe', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
            عدد الصفحات التجريبية: {pages.length}
          </span>
          <span style={{ padding: '5px 10px', backgroundColor: '#dcfce7', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
            عدد الـ Blocks: {blocks.length}
          </span>
          <span style={{ padding: '5px 10px', backgroundColor: '#fef3c7', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
            Manual Page Breaks: {reportPresentation.pageBreaks.length}
          </span>
        </div>
      </div>

      {pages.map((page, pageIndex) => (
        <div key={page.id} style={PAGE_STYLE}>
          <div style={{ position: 'absolute', top: '8mm', left: '12mm', fontSize: '11px', color: '#64748b' }}>
            Page {pageIndex + 1}
          </div>
          <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #0f172a' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{page.title}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {page.blocks.length} block(s) في هذه الصفحة التجريبية
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {page.blocks.map((block) => {
              const hasManualBreak = hasPageBreakBefore(block.id);

              return (
              <div key={block.id} style={{ border: hasManualBreak ? '2px solid #f59e0b' : '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: hasManualBreak ? '#fffbeb' : '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#0f172a' }}>{block.title}</strong>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: 'bold' }}>
                    {block.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onAddPageBreakBefore(block.id)}
                    disabled={hasManualBreak}
                    style={{ padding: '4px 8px', border: '1px solid #2563eb', borderRadius: '6px', backgroundColor: hasManualBreak ? '#e2e8f0' : '#dbeafe', color: hasManualBreak ? '#64748b' : '#1d4ed8', cursor: hasManualBreak ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    ↧ إنزال للصفحة التالية
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemovePageBreak(block.id)}
                    disabled={!hasManualBreak}
                    style={{ padding: '4px 8px', border: '1px solid #dc2626', borderRadius: '6px', backgroundColor: hasManualBreak ? '#fee2e2' : '#f1f5f9', color: hasManualBreak ? '#b91c1c' : '#94a3b8', cursor: hasManualBreak ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    ✕ إزالة الفاصل
                  </button>
                  {hasManualBreak && (
                    <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 'bold' }}>
                      pageBreakBefore
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                  {block.id}
                </div>
                <div style={{ color: '#334155', fontSize: '12px', lineHeight: 1.6 }}>
                  {summarizeBlock(block)}
                </div>
                {mayExceedA4(block) && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', color: '#92400e', fontSize: '12px', fontWeight: 'bold' }}>
                    ⚠️ هذا العنصر قد يتجاوز صفحة A4 ويحتاج تقسيم داخلي لاحقاً
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
