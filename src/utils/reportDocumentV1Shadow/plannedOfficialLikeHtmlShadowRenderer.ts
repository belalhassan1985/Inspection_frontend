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
const contentHeightPx = (A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM) * MM_TO_PX;

// ── Labels ─────────────────────────────────────────────────────────────

const KIND_LABEL: Readonly<Record<string, string>> = Object.freeze({
  reportHeader: 'وزارة الداخلية - هيئة تفتيش قوى الامن الداخلي',
  reportTitle: 'تقرير تفتيش',
  assignment: 'التكليف',
  committee: 'التأليف',
  purpose: 'الغاية',
  visitDate: 'تاريخ التفتيش',
  tableTitle: 'جدول',
  tableHeader: 'الاسم / الرتبة / الرقم الإحصائي',
  tableRow: 'بيان',
  sectionTitle: 'عنوان القسم',
  sectionNarrative: 'نص القسم',
  subsectionTitle: 'عنوان فرعي',
  subsectionNarrative: 'نص فرعي',
  findingGroupTitle: 'مجموعة مكتشفات',
  findingItem: 'بند مكتشفات',
  recommendationsTitle: 'التوصيات والمقترحات المرفوعة للمصادقة',
  recommendationGroupTitle: 'الجهة الموصى لها',
  recommendationItem: 'توصية',
  officialNotesTitle: 'الملاحظات',
  noteCategoryTitle: 'فئة الملاحظات',
  noteItem: 'ملاحظة',
  appendicesTitle: 'الملاحق',
  appendixTitle: 'ملحق',
  appendixParagraph: 'نص الملحق',
  finalEvaluation: 'التقييم النهائي',
  signatures: 'التوقيعات',
});

const getKindLabel = (kind: string): string => KIND_LABEL[kind] ?? kind;

const getKindColor = (kind: string): string => {
  if (['finalEvaluation'].includes(kind)) return '#c53030';
  return '#0c2340';
};

// ── Render fragment by kind ────────────────────────────────────────────

const renderFragmentHtml = (fragment: ReportFragmentV1): string => {
  const id = fragment.id;
  const kind = fragment.kind;
  const label = getKindLabel(kind);
  const color = getKindColor(kind);

  switch (kind) {
    // ── System ──
    case 'reportHeader':
      return `<div class="fragment fragment-report-header" data-fragment-id="${id}" data-kind="${kind}">
        <div class="report-header-content">
          <div class="header-text">
            جمهورية العراق<br/>
            وزارة الداخلية<br/>
            هيئة تفتيش قوى الامن الداخلي
          </div>
          <div class="header-placeholder-logo">
            <div class="logo-circle">ش</div>
          </div>
        </div>
      </div>`;

    case 'reportTitle':
      return `<div class="fragment fragment-report-title" data-fragment-id="${id}" data-kind="${kind}">
        <h1 class="report-title">${label}</h1>
      </div>`;

    // ── Introduction ──
    case 'assignment':
    case 'committee':
    case 'purpose':
    case 'visitDate':
      return `<div class="fragment fragment-intro" data-fragment-id="${id}" data-kind="${kind}">
        <div class="intro-section">
          <span class="intro-label" style="color:${color};">${label}</span>
          <span class="intro-value">[${id}]</span>
        </div>
      </div>`;

    // ── Tables ──
    case 'tableTitle':
      return `<div class="fragment fragment-table-title" data-fragment-id="${id}" data-kind="${kind}">
        <h3 class="table-caption">${label}</h3>
      </div>`;

    case 'tableHeader':
      return `<div class="fragment fragment-table-header" data-fragment-id="${id}" data-kind="${kind}">
        <table class="military-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الرتبة</th>
              <th>الرقم الإحصائي</th>
              <th>تاريخ الالتحاق</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>`;

    case 'tableRow':
      return `<div class="fragment fragment-table-row" data-fragment-id="${id}" data-kind="${kind}">
        <table class="military-table">
          <tbody>
            <tr>
              <td colspan="4" style="text-align:right;">— ${label} —</td>
            </tr>
          </tbody>
        </table>
      </div>`;

    // ── Sections ──
    case 'sectionTitle':
      return `<div class="fragment fragment-section-title" data-fragment-id="${id}" data-kind="${kind}">
        <h2 class="section-title" style="color:${color}; border-bottom-color:${color};">${label}</h2>
      </div>`;

    case 'subsectionTitle':
      return `<div class="fragment fragment-subsection-title" data-fragment-id="${id}" data-kind="${kind}">
        <h3 class="subsection-title" style="color:${color};">${label}</h3>
      </div>`;

    case 'sectionNarrative':
    case 'subsectionNarrative':
      return `<div class="fragment fragment-narrative" data-fragment-id="${id}" data-kind="${kind}">
        <div class="narrative-body">
          <p>${label} — <span class="fragment-ref">[${id}]</span></p>
          <p class="placeholder-text">هذا النص هو نص تجريبي للتحقق من تخطيط الصفحة وتوزيع العناصر.</p>
        </div>
      </div>`;

    // ── Findings ──
    case 'findingGroupTitle':
      return `<div class="fragment fragment-finding-group" data-fragment-id="${id}" data-kind="${kind}">
        <h4 class="finding-group-title">${label}</h4>
      </div>`;

    case 'findingItem':
      return `<div class="fragment fragment-finding-item" data-fragment-id="${id}" data-kind="${kind}">
        <div class="finding-item">
          <span class="finding-bullet">•</span>
          <span class="finding-text">${label} [${id}]</span>
        </div>
      </div>`;

    // ── Recommendations ──
    case 'recommendationsTitle':
      return `<div class="fragment fragment-recommendations-title" data-fragment-id="${id}" data-kind="${kind}">
        <h2 class="section-title" style="color:${color}; border-bottom-color:${color};">${label}</h2>
      </div>`;

    case 'recommendationGroupTitle':
      return `<div class="fragment fragment-rec-group" data-fragment-id="${id}" data-kind="${kind}">
        <h4 class="rec-group-title">${label}</h4>
      </div>`;

    case 'recommendationItem':
      return `<div class="fragment fragment-rec-item" data-fragment-id="${id}" data-kind="${kind}">
        <div class="rec-item">
          <span class="rec-number">${id.split(':').pop()}</span>
          <span class="rec-text">${label} [${id}]</span>
        </div>
      </div>`;

    // ── Notes ──
    case 'officialNotesTitle':
      return `<div class="fragment fragment-notes-title" data-fragment-id="${id}" data-kind="${kind}">
        <h2 class="section-title" style="color:${color}; border-bottom-color:${color};">${label}</h2>
      </div>`;

    case 'noteCategoryTitle':
      return `<div class="fragment fragment-note-category" data-fragment-id="${id}" data-kind="${kind}">
        <h4 class="note-category-title">${label}</h4>
      </div>`;

    case 'noteItem':
      return `<div class="fragment fragment-note-item" data-fragment-id="${id}" data-kind="${kind}">
        <div class="note-item">
          <span class="note-bullet">-</span>
          <span class="note-text">${label} [${id}]</span>
        </div>
      </div>`;

    // ── Appendices ──
    case 'appendicesTitle':
      return `<div class="fragment fragment-appendices-title" data-fragment-id="${id}" data-kind="${kind}">
        <h2 class="section-title" style="color:${color}; border-bottom-color:${color};">${label}</h2>
      </div>`;

    case 'appendixTitle':
      return `<div class="fragment fragment-appendix-title" data-fragment-id="${id}" data-kind="${kind}">
        <h3 class="appendix-title">${label}</h3>
      </div>`;

    case 'appendixParagraph':
      return `<div class="fragment fragment-appendix-paragraph" data-fragment-id="${id}" data-kind="${kind}">
        <div class="appendix-paragraph-body">
          <p>${label} — <span class="fragment-ref">[${id}]</span></p>
          <p class="placeholder-text">هذا النص هو نص تجريبي للملاحق.</p>
        </div>
      </div>`;

    // ── Closing ──
    case 'finalEvaluation':
      return `<div class="fragment fragment-final-evaluation" data-fragment-id="${id}" data-kind="${kind}">
        <h2 class="section-title" style="color:${color}; border-bottom-color:${color};">التقييم النهائي</h2>
        <div class="evaluation-body">
          <p class="placeholder-text">${label} — التقييم النهائي للتقرير [${id}]</p>
        </div>
      </div>`;

    case 'signatures':
      return `<div class="fragment fragment-signatures" data-fragment-id="${id}" data-kind="${kind}">
        <div class="signatures-container">
          <div class="signature-box">
            <div class="sig-line"></div>
            <div class="sig-label">رئيس هيئة التفتيش</div>
          </div>
          <div class="signature-box">
            <div class="sig-line"></div>
            <div class="sig-label">عضو</div>
          </div>
        </div>
      </div>`;

    default:
      return `<div class="fragment fragment-other" data-fragment-id="${id}" data-kind="${kind}">
        <div class="fragment-header">
          <span class="fragment-id">${id}</span>
          <span class="fragment-kind">${label}</span>
        </div>
      </div>`;
  }
};

// ── Page renderer ──────────────────────────────────────────────────────

const renderPageHtml = (
  pageNumber: number,
  placements: PagePlanV1['pages'][number]['placements'],
  fragmentMap: Readonly<Record<string, ReportFragmentV1>>,
): string => {
  const fragmentsHtml = placements
    .map((p) => {
      const fragment = fragmentMap[p.fragmentId];
      if (!fragment) {
        return `<div class="fragment fragment-missing" data-fragment-id="${p.fragmentId}">
          <div class="fragment-header">
            <span class="fragment-id">${p.fragmentId}</span>
            <span class="fragment-kind">[MISSING]</span>
          </div>
        </div>`;
      }
      return renderFragmentHtml(fragment);
    })
    .join('\n');

  return `<div class="pdf-page" data-page-number="${pageNumber}" data-page-id="page:${pageNumber}">
    <div class="page-content">
      ${fragmentsHtml}
    </div>
    <div class="page-footer">
      <span class="confidential-label">سري</span>
    </div>
  </div>`;
};

// ── Public types ───────────────────────────────────────────────────────

export type OfficialLikeHtmlShadowReport = {
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

export const renderOfficialLikeHtmlShadow = (
  v1Document: ReportDocumentV1,
  pagePlan: PagePlanV1,
): OfficialLikeHtmlShadowReport => {
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
<title>Official-like Planned HTML Shadow — ${v1Document.documentId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Cairo', 'Times New Roman', serif;
    background: #e0e0e0;
    direction: rtl;
    text-align: right;
    padding: 10px 0;
    font-size: 14px;
    line-height: 1.7;
    color: #1a1a1a;
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

  .page-content { min-height: ${contentHeightPx - 20}px; }

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

  /* ── Logo / Header ── */
  .report-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #0c2340;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .header-text {
    font-size: 13px;
    font-weight: bold;
    line-height: 1.8;
  }
  .header-placeholder-logo {
    text-align: center;
  }
  .logo-circle {
    width: 75px;
    height: 75px;
    border-radius: 50%;
    background: #0c2340;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
  }

  /* ── Report Title ── */
  .report-title {
    text-align: center;
    font-size: 21px;
    font-weight: bold;
    margin: 30px 0;
    color: #0c2340;
    text-decoration: underline;
    text-underline-offset: 8px;
  }

  /* ── Section Titles ── */
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #0c2340;
    border-bottom: 2px solid #0c2340;
    padding-bottom: 5px;
    margin-top: 30px;
    margin-bottom: 15px;
    page-break-after: avoid;
    break-after: avoid;
  }

  .subsection-title {
    font-size: 15px;
    font-weight: bold;
    color: #0c2340;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  /* ── Intro Sections ── */
  .intro-section {
    padding: 4px 0;
    margin-bottom: 4px;
  }
  .intro-label {
    font-size: 15px;
    font-weight: bold;
    display: inline;
  }
  .intro-value {
    font-size: 14px;
    color: #4a5568;
    margin-right: 8px;
  }

  /* ── Narrative ── */
  .narrative-body {
    margin-right: 15px;
    margin-bottom: 16px;
    text-align: justify;
    font-size: 14px;
    line-height: 1.7;
  }
  .placeholder-text {
    color: #4a5568;
    font-style: italic;
    font-size: 13px;
    margin-top: 4px;
  }
  .fragment-ref {
    font-family: monospace;
    font-size: 11px;
    color: #888;
  }

  /* ── Tables ── */
  .military-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
  }
  .military-table th, .military-table td {
    border: 1px solid #000000;
    padding: 8px 10px;
    text-align: center;
    font-size: 13px;
  }
  .military-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  .table-caption {
    font-size: 14px;
    font-weight: bold;
    margin: 12px 0 6px 0;
    color: #0c2340;
  }

  /* ── Findings ── */
  .finding-group-title {
    font-size: 14px;
    font-weight: bold;
    color: #0c2340;
    margin: 14px 0 6px 0;
  }
  .finding-item {
    margin-right: 20px;
    margin-bottom: 3px;
    display: flex;
    gap: 6px;
  }
  .finding-bullet {
    color: #0c2340;
    font-size: 14px;
  }
  .finding-text {
    font-size: 14px;
  }

  /* ── Notes ── */
  .note-category-title {
    font-size: 14px;
    font-weight: bold;
    color: #0c2340;
    margin: 12px 0 4px 0;
  }
  .note-item {
    margin-right: 20px;
    margin-bottom: 2px;
    display: flex;
    gap: 6px;
  }
  .note-bullet { color: #4a5568; }
  .note-text { font-size: 14px; }

  /* ── Recommendations ── */
  .rec-group-title {
    font-size: 14px;
    font-weight: bold;
    color: #0c2340;
    margin: 12px 0 4px 0;
  }
  .rec-item {
    margin-right: 20px;
    margin-bottom: 4px;
    display: flex;
    gap: 8px;
  }
  .rec-number {
    font-weight: bold;
    color: #0c2340;
    min-width: 20px;
  }
  .rec-text { font-size: 14px; }

  /* ── Appendices ── */
  .appendix-title {
    font-size: 15px;
    font-weight: bold;
    color: #0c2340;
    margin: 16px 0 8px 0;
  }
  .appendix-paragraph-body {
    margin-right: 15px;
    margin-bottom: 14px;
    text-align: justify;
    font-size: 14px;
    line-height: 1.7;
  }

  /* ── Final Evaluation ── */
  .evaluation-body {
    margin-right: 15px;
    margin-top: 10px;
    margin-bottom: 20px;
  }

  /* ── Signatures ── */
  .signatures-container {
    display: flex;
    justify-content: space-around;
    margin-top: 60px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .signature-box {
    text-align: center;
    width: 45%;
  }
  .sig-line {
    border-bottom: 2px solid #0c2340;
    margin-bottom: 8px;
    height: 40px;
  }
  .sig-label {
    font-weight: bold;
    font-size: 14px;
    color: #0c2340;
  }

  /* ── Missing fragment ── */
  .fragment-missing {
    padding: 8px;
    margin-bottom: 4px;
    border: 1px solid #d00;
    background: #fff0f0;
    font-size: 12px;
  }
  .fragment-missing .fragment-kind { color: #d00; }

  /* ── Fragment break-inside rules ── */
  .fragment-signatures { break-inside: avoid; page-break-inside: avoid; }
  .fragment-table-title { break-inside: avoid; }
  .fragment-table-header { break-inside: avoid; }
  .fragment-final-evaluation { break-inside: avoid; }
  .fragment-missing { break-inside: avoid; }
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
