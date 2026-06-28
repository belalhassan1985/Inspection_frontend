import type {
  PagePlanV1,
  ReportDocumentV1,
  ReportFragmentV1,
} from '../../contracts/report-document-v1/types';

// ── CSS constants matching official PDF pipeline ───────────────────────

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 22;
const MARGIN_LEFT_MM = 10;
const MARGIN_RIGHT_MM = 10;

const MM_TO_PX = 3.7795275591;

const contentWidthPx = (A4_WIDTH_MM - MARGIN_LEFT_MM - MARGIN_RIGHT_MM) * MM_TO_PX;
const contentHeightPx = (A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM) * MM_TO_PX;

// ── Per-kind label for visual debugging ────────────────────────────────

const KIND_LABEL: Readonly<Record<string, string>> = Object.freeze({
  reportHeader: 'رأس التقرير',
  reportTitle: 'عنوان التقرير',
  assignment: 'التكليف',
  committee: 'التأليف',
  purpose: 'الغاية',
  visitDate: 'تاريخ التفتيش',
  tableTitle: 'عنوان جدول',
  tableHeader: 'رأس جدول',
  tableRow: 'صف جدول',
  sectionTitle: 'عنوان قسم',
  sectionNarrative: 'سرد القسم',
  subsectionTitle: 'عنوان فرعي',
  subsectionNarrative: 'سرد فرعي',
  findingGroupTitle: 'عنوان مجموعة مكتشفات',
  findingItem: 'بند مكتشفات',
  recommendationsTitle: 'عنوان التوصيات',
  recommendationGroupTitle: 'عنوان مجموعة توصيات',
  recommendationItem: 'بند توصيات',
  officialNotesTitle: 'عنوان الملاحظات',
  noteCategoryTitle: 'عنوان فئة ملاحظات',
  noteItem: 'بند ملاحظات',
  appendicesTitle: 'عنوان الملاحق',
  appendixTitle: 'عنوان ملحق',
  appendixParagraph: 'فقرة ملحق',
  finalEvaluation: 'التقييم النهائي',
  signatures: 'التوقيعات',
});

const getKindLabel = (kind: string): string => KIND_LABEL[kind] ?? kind;

// ── Styling per kind category ──────────────────────────────────────────

const kindCategory = (kind: string): string => {
  if (['reportHeader', 'reportTitle', 'reportFooter'].includes(kind)) return 'system';
  if (['assignment', 'committee', 'purpose', 'visitDate'].includes(kind)) return 'introduction';
  if (['tableTitle', 'tableHeader', 'tableRow'].includes(kind)) return 'table';
  if (['sectionTitle', 'sectionNarrative', 'subsectionTitle', 'subsectionNarrative'].includes(kind)) return 'section';
  if (['findingGroupTitle', 'findingItem'].includes(kind)) return 'finding';
  if (['recommendationsTitle', 'recommendationGroupTitle', 'recommendationItem'].includes(kind)) return 'recommendation';
  if (['officialNotesTitle', 'noteCategoryTitle', 'noteItem'].includes(kind)) return 'note';
  if (['appendicesTitle', 'appendixTitle', 'appendixParagraph'].includes(kind)) return 'appendix';
  if (kind === 'finalEvaluation') return 'closing';
  if (kind === 'signatures') return 'signatures';
  return 'other';
};

// ── Render a single fragment as HTML ───────────────────────────────────

const renderFragmentHtml = (
  fragment: ReportFragmentV1,
): string => {
  const cat = kindCategory(fragment.kind);
  const label = getKindLabel(fragment.kind);

  return `
    <div class="fragment fragment-${cat} fragment-${fragment.kind}"
         data-fragment-id="${fragment.id}"
         data-kind="${fragment.kind}"
         data-category="${cat}">
      <div class="fragment-header">
        <span class="fragment-id">${fragment.id}</span>
        <span class="fragment-kind">${label}</span>
      </div>
    </div>`;
};

// ── Render a single page as HTML ───────────────────────────────────────

const renderPageHtml = (
  pageNumber: number,
  placements: PagePlanV1['pages'][number]['placements'],
  fragmentMap: Readonly<Record<string, ReportFragmentV1>>,
): string => {
  const fragmentsHtml = placements
    .map((p) => {
      const fragment = fragmentMap[p.fragmentId];
      if (!fragment) {
        return `
    <div class="fragment fragment-missing"
         data-fragment-id="${p.fragmentId}">
      <div class="fragment-header">
        <span class="fragment-id">${p.fragmentId}</span>
        <span class="fragment-kind">[MISSING]</span>
      </div>
    </div>`;
      }
      return renderFragmentHtml(fragment);
    })
    .join('');

  return `
  <div class="pdf-page" data-page-number="${pageNumber}" data-page-id="page:${pageNumber}">
    <div class="page-header">
      <span class="page-number-label">الصفحة ${pageNumber}</span>
      <span class="page-placement-count">${placements.length} fragment(s)</span>
    </div>
    <div class="page-content">
      ${fragmentsHtml}
    </div>
    <div class="page-footer">
      <span class="confidential-label">سري</span>
    </div>
  </div>`;
};

// ── Public types ───────────────────────────────────────────────────────

export type PlannedPdfHtmlShadowReport = {
  html: string;
  summary: {
    totalPages: number;
    totalFragmentPlacements: number;
    uniqueFragmentsRendered: number;
    missingFragments: number;
    duplicatedFragmentIds: readonly string[];
    pageContainerCount: number;
    a4Verified: boolean;
    marginsVerified: boolean;
    samplePerPage: readonly {
      pageNumber: number;
      firstFragmentId: string;
      lastFragmentId: string;
      placementCount: number;
    }[];
  };
  productionImportsCount: 0;
  decision: 'GO' | 'NO-GO';
};

// ── Main renderer ──────────────────────────────────────────────────────

export const renderPlannedPdfHtmlShadow = (
  v1Document: ReportDocumentV1,
  pagePlan: PagePlanV1,
): PlannedPdfHtmlShadowReport => {
  const pages = pagePlan.pages;
  const fragmentMap = v1Document.fragments;

  const allPlacedIds = pages.flatMap((p) => p.placements.map((pl) => pl.fragmentId));
  const uniqueIds = new Set(allPlacedIds);
  const missingIds = allPlacedIds.filter((id) => !fragmentMap[id]);
  const seen = new Set<string>();
  const duplicatedIds = allPlacedIds.filter((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });

  const pagesHtml = pages
    .map((p) => renderPageHtml(p.pageNumber, p.placements, fragmentMap))
    .join('\n');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Planned PDF HTML Shadow — ${v1Document.documentId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Cairo', 'Times New Roman', serif;
    background: #e0e0e0;
    direction: rtl;
    text-align: right;
    padding: 10px 0;
  }

  .pdf-page {
    width: ${A4_WIDTH_MM}mm;
    min-height: ${A4_HEIGHT_MM}mm;
    margin: 10mm auto;
    padding: ${MARGIN_TOP_MM}mm ${MARGIN_RIGHT_MM}mm ${MARGIN_BOTTOM_MM}mm ${MARGIN_LEFT_MM}mm;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    position: relative;
    page-break-after: always;
    overflow: hidden;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 6px;
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
    font-size: 12px;
    color: #666;
  }

  .page-footer {
    position: absolute;
    bottom: ${MARGIN_BOTTOM_MM - 3}mm;
    left: ${MARGIN_LEFT_MM}mm;
    right: ${MARGIN_RIGHT_MM}mm;
    text-align: center;
    font-size: 10px;
    color: #999;
    border-top: 1px solid #ddd;
    padding-top: 4px;
  }

  .page-content {
    min-height: ${contentHeightPx - 40}px;
  }

  .fragment {
    padding: 6px 8px;
    margin-bottom: 3px;
    border-radius: 3px;
    border: 1px solid #e8e8e8;
    font-size: 11px;
  }

  .fragment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .fragment-id {
    font-family: monospace;
    font-size: 10px;
    color: #888;
  }

  .fragment-kind {
    font-size: 11px;
    font-weight: 700;
  }

  .fragment-missing {
    background: #fff0f0;
    border-color: #d00;
  }
  .fragment-missing .fragment-kind {
    color: #d00;
  }

  .fragment-system   { background: #f5f5ff; border-color: #d0d0ff; }
  .fragment-introduction { background: #f0fff4; border-color: #c0e0d0; }
  .fragment-table    { background: #fafff0; border-color: #d0e0b0; }
  .fragment-section  { background: #fff8f0; border-color: #e0d0b0; }
  .fragment-finding  { background: #fff5f0; border-color: #e0c0b0; }
  .fragment-recommendation { background: #f5f0ff; border-color: #d0c0e0; }
  .fragment-note     { background: #f0f5ff; border-color: #c0d0e0; }
  .fragment-appendix { background: #fff5f5; border-color: #e0c0c0; }
  .fragment-closing  { background: #f0fff0; border-color: #c0e0c0; }
  .fragment-signatures { background: #fffaf0; border-color: #e0d0b0; }
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`;

  const samplePerPage = pages.map((p) => ({
    pageNumber: p.pageNumber,
    firstFragmentId: p.placements[0]?.fragmentId ?? '(empty)',
    lastFragmentId: p.placements[p.placements.length - 1]?.fragmentId ?? '(empty)',
    placementCount: p.placements.length,
  }));

  const a4Verified = v1Document.layoutProfile.pageSize === 'A4'
    && v1Document.layoutProfile.widthMm === A4_WIDTH_MM
    && v1Document.layoutProfile.heightMm === A4_HEIGHT_MM;

  const marginsVerified = v1Document.layoutProfile.marginsMm.top === MARGIN_TOP_MM
    && v1Document.layoutProfile.marginsMm.bottom === MARGIN_BOTTOM_MM
    && v1Document.layoutProfile.marginsMm.left === MARGIN_LEFT_MM
    && v1Document.layoutProfile.marginsMm.right === MARGIN_RIGHT_MM;

  return {
    html,
    summary: {
      totalPages: pages.length,
      totalFragmentPlacements: allPlacedIds.length,
      uniqueFragmentsRendered: uniqueIds.size,
      missingFragments: missingIds.length,
      duplicatedFragmentIds: [...new Set(duplicatedIds)],
      pageContainerCount: pages.length,
      a4Verified,
      marginsVerified,
      samplePerPage,
    },
    productionImportsCount: 0,
    decision:
      pages.length > 0
      && allPlacedIds.length > 0
      && missingIds.length === 0
      && duplicatedIds.length === 0
      && a4Verified
      && marginsVerified
        ? 'GO'
        : 'NO-GO',
  };
};
