import type {
  PagePlanV1,
  ReportDocumentV1,
  ReportFragmentV1,
  FragmentKind,
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

// ── Official fragment-number mapping ───────────────────────────────────

const LEVEL1_NUMBERS: Record<string, string> = {
  assignment: '١.',
  committee: '٢.',
  purpose: '٣.',
  visitDate: '٤.',
  commandersTable: '٥.',
  inspectionDetails: '٦.',
  observations: '٧.',
  recommendations: '٨.',
  finalEvaluation: '٩.',
  appendices: '١٠.',
};

const getLevel1Number = (kind: FragmentKind | string): string =>
  LEVEL1_NUMBERS[kind] ?? '';

// ── Indentation matching getIndentation(level) in official pipeline ────

const INDENT_LEVELS: Record<number, string> = {
  2: '15px',
  3: '30px',
  4: '45px',
};

const getIndent = (level: number): string =>
  INDENT_LEVELS[level] ?? `${(level - 1) * 15}px`;

// ── Official style helpers ─────────────────────────────────────────────

const SECTION_NUM_BASE = 'font-size:16px;font-weight:bold;color:#0c2340;margin-top:30px;margin-bottom:10px;';

const SECTION_BODY_BASE = 'margin-right:15px;margin-bottom:20px;text-align:justify;font-size:13px;line-height:1.7;color:#2d3748;';

// ── Labels ─────────────────────────────────────────────────────────────

const KIND_LABEL: Readonly<Record<string, string>> = Object.freeze({
  reportHeader: 'جمهورية العراق - وزارة الداخلية - هيئة تفتيش قوى الامن الداخلي',
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

// ── Fragment renderer ──────────────────────────────────────────────────

const renderIntroSectionNum = (
  kind: FragmentKind,
  label: string,
): string =>
  `<div class="section-num page-break-inside-avoid" style="${SECTION_NUM_BASE}">${getLevel1Number(kind)} ${label}</div>`;

const renderIntroSectionBody = (
  content: string,
): string =>
  `<div class="section-body" style="${SECTION_BODY_BASE}">${content}</div>`;

// ── Render a single fragment (non-table) ───────────────────────────────

const renderNonTableFragment = (
  fragment: ReportFragmentV1,
): string => {
  const kind = fragment.kind;
  const label = getKindLabel(kind);

  switch (kind) {
    case 'reportHeader':
      return `<div class="report-header" style="width:100%;margin-bottom:30px;">
        <table style="width:100%;border-collapse:collapse;border:none;border-bottom:2px solid #000;padding-bottom:15px;">
          <tr>
            <td style="width:35%;border:none;font-size:13.5px;font-weight:bold;text-align:right;vertical-align:middle;line-height:1.5;font-family:'Cairo',sans-serif;">
              جمهورية العراق<br/>
              وزارة الداخلية<br/>
              هيئة تفتيش قوى الامن الداخلي
            </td>
            <td style="width:30%;border:none;text-align:center;vertical-align:middle;">
              <div style="width:75px;height:75px;border-radius:50%;background:#0c2340;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;margin:0 auto;">ش</div>
            </td>
            <td style="width:35%;border:none;font-size:13.5px;text-align:left;direction:rtl;vertical-align:middle;line-height:1.6;font-weight:bold;font-family:'Cairo',sans-serif;">
              <div>التاريخ: —</div>
              <div style="margin-top:5px;">العدد: —</div>
            </td>
          </tr>
        </table>
      </div>`;

    case 'reportTitle':
      return `<div class="report-title" style="text-align:center;font-size:21px;font-weight:bold;margin:30px 0;color:#0c2340;text-decoration:underline;text-underline-offset:8px;">
        ${label}
      </div>`;

    case 'assignment':
      return `${renderIntroSectionNum(kind, label)}
        ${renderIntroSectionBody(`<p style="margin:0;text-align:justify;font-size:13.5px;line-height:1.7;">${label} — نص التكليف الرسمي للتفتيش.</p>`)}`;

    case 'committee':
      return `${renderIntroSectionNum(kind, label)}
        ${renderIntroSectionBody(`
          <table style="width:100%;max-width:650px;border-collapse:collapse;border:none;margin-top:10px;">
            <tbody>
              <tr><td style="border:none;padding:4px 0;font-size:15px;width:60%;text-align:right;">أ. م. ف. رعد جبار حمودي</td><td style="border:none;padding:4px 0;font-size:15px;width:40%;text-align:right;">رئيس هيئة التفتيش</td></tr>
              <tr><td style="border:none;padding:4px 0;font-size:15px;width:60%;text-align:right;">عقيد. علي كريم محسن</td><td style="border:none;padding:4px 0;font-size:15px;width:40%;text-align:right;">عضو</td></tr>
              <tr><td style="border:none;padding:4px 0;font-size:15px;width:60%;text-align:right;">مقدم. حيدر صالح جابر</td><td style="border:none;padding:4px 0;font-size:15px;width:40%;text-align:right;">عضو</td></tr>
            </tbody>
          </table>
        `)}`;

    case 'purpose':
      return `${renderIntroSectionNum(kind, label)}
        ${renderIntroSectionBody(`<p style="margin:0;text-align:justify;font-size:13.5px;line-height:1.7;">${label} — الغاية من التفتيش هي التأكد من مطابقة الإجراءات للتعليمات النافذة.</p>`)}`;

    case 'visitDate':
      return `${renderIntroSectionNum(kind, label)}
        ${renderIntroSectionBody(`<p style="margin:0;text-align:justify;font-size:13.5px;line-height:1.7;">${label} — تمت عملية التفتيش بتاريخ 12/06/2026.</p>`)}`;

    // ── Section title ──
    case 'sectionTitle':
      return `<div style="margin-top:25px;margin-right:${getIndent(2)};">
        <div style="font-weight:bold;font-size:15px;color:#0c2340;border-bottom:1.5px solid #0c2340;padding-bottom:3px;margin-bottom:10px;">
          ${label}
        </div>
      </div>`;

    case 'sectionNarrative':
      return `<div style="margin-right:${getIndent(3)};margin-bottom:10px;font-size:13.5px;text-align:justify;">
        ${label} — نص تفصيلي للقسم.
      </div>`;

    // ── Subsection ──
    case 'subsectionTitle':
      return `<div style="margin-top:18px;margin-right:${getIndent(3)};">
        <div style="font-weight:bold;font-size:14px;color:#1a202c;margin-bottom:10px;padding-right:8px;">
          ${label}
        </div>
      </div>`;

    case 'subsectionNarrative':
      return `<div style="margin-right:${getIndent(4)};font-size:13px;margin-top:6px;color:#4a5568;text-align:justify;">
        ${label} — نص تفصيلي إضافي.
      </div>`;

    // ── Findings ──
    case 'findingGroupTitle':
      return `<div style="font-weight:bold;font-size:14px;color:#0c2340;margin-right:${getIndent(3)};margin-top:12px;margin-bottom:6px;">
        ${label}
      </div>`;

    case 'findingItem':
      return `<div style="margin-right:${getIndent(4)};font-size:13.5px;margin-bottom:5px;display:flex;gap:6px;text-align:justify;line-height:1.8;">
        <span class="pdf-parenthesized-number" style="font-weight:bold;min-width:30px;">(١)</span>
        <span>${label} — نص المكتشف.</span>
      </div>`;

    // ── Recommendations ──
    case 'recommendationsTitle':
      return `<div class="section-num page-break-inside-avoid" style="${SECTION_NUM_BASE}">${getLevel1Number('recommendations')} ${label}</div>
        <div class="section-body" style="${SECTION_BODY_BASE}">`;

    case 'recommendationGroupTitle':
      return `<div style="font-weight:bold;margin-top:15px;font-size:14px;margin-right:${getIndent(2)};">
        ${label}
      </div>`;

    case 'recommendationItem':
      return `<div style="margin-right:${getIndent(3)};margin-bottom:8px;">
        <div style="margin-bottom:4px;font-size:13.5px;font-weight:500;">
          <span style="font-weight:bold;">١:</span> ${label} — نص التوصية.
        </div>
      </div>`;

    // ── Observations/Notes ──
    case 'officialNotesTitle':
      return `<div class="section-num page-break-inside-avoid" style="${SECTION_NUM_BASE}">${getLevel1Number('observations')} ${label}</div>
        <div class="section-body" style="${SECTION_BODY_BASE}">`;

    case 'noteCategoryTitle':
      return `<div style="font-weight:bold;margin-top:12px;font-size:14px;margin-right:${getIndent(2)};">
        ${label}
      </div>`;

    case 'noteItem':
      return `<div style="margin-right:${getIndent(3)};margin-bottom:6px;font-size:13.5px;text-align:justify;">
        ${label} — نص الملاحظة.
      </div>`;

    // ── Appendices ──
    case 'appendicesTitle':
      return `<div class="section-num page-break-inside-avoid" style="${SECTION_NUM_BASE}">${getLevel1Number('appendices')} ${label}</div>
        <div class="section-body" style="${SECTION_BODY_BASE}">`;

    case 'appendixTitle':
      return `<div style="font-weight:bold;font-size:15px;color:#0c2340;margin:16px 0 8px 0;margin-right:${getIndent(2)};">
        ${label}
      </div>`;

    case 'appendixParagraph':
      return `<div style="margin-right:${getIndent(3)};margin-bottom:14px;text-align:justify;font-size:13.5px;line-height:1.7;">
        ${label} — نص الملحق.
      </div>`;

    // ── Final evaluation ──
    case 'finalEvaluation':
      return `<div class="section-num page-break-inside-avoid" style="${SECTION_NUM_BASE}">${getLevel1Number('finalEvaluation')} ${label}</div>`;

    // ── Signatures ──
    case 'signatures':
      return `<div class="signatures-container" style="display:flex;justify-content:space-around;margin-top:60px;page-break-inside:avoid;break-inside:avoid;">
        <div class="signature-box" style="text-align:center;width:45%;">
          <div class="sig-line" style="border-bottom:2px solid #0c2340;margin-bottom:8px;height:40px;"></div>
          <div class="sig-label" style="font-weight:bold;font-size:14px;color:#0c2340;">رئيس هيئة التفتيش</div>
        </div>
        <div class="signature-box" style="text-align:center;width:45%;">
          <div class="sig-line" style="border-bottom:2px solid #0c2340;margin-bottom:8px;height:40px;"></div>
          <div class="sig-label" style="font-weight:bold;font-size:14px;color:#0c2340;">عضو</div>
        </div>
      </div>`;

    // ── Close section-body for recommendations/notes/appendices ──
    case 'recommendationGroupTitle':
    case 'recommendationItem':
    case 'noteCategoryTitle':
    case 'noteItem':
    case 'appendixParagraph':
      return '';

    default:
      return `<div style="padding:6px 8px;border:1px solid #e8e8e8;margin-bottom:3px;font-size:12px;">
        <span style="font-family:monospace;font-size:10px;color:#888;">${fragment.id}</span>
        <span style="font-size:11px;font-weight:700;">${label}</span>
      </div>`;
  }
};

// ── Table grouping ─────────────────────────────────────────────────────

type GroupedTable = {
  title: ReportFragmentV1 | null;
  header: ReportFragmentV1 | null;
  rows: ReportFragmentV1[];
};

const groupTableFragments = (
  fragments: readonly ReportFragmentV1[],
): { nonTable: ReportFragmentV1[]; tableGroups: GroupedTable[] } => {
  const nonTable: ReportFragmentV1[] = [];
  const tableGroups: GroupedTable[] = [];
  let i = 0;

  while (i < fragments.length) {
    const f = fragments[i];

    if (f.kind === 'tableTitle' || f.kind === 'tableHeader' || f.kind === 'tableRow') {
      const group: GroupedTable = { title: null, header: null, rows: [] };

      if (f.kind === 'tableTitle') {
        group.title = f;
        i++;
        if (i < fragments.length && fragments[i].kind === 'tableHeader') {
          group.header = fragments[i];
          i++;
          while (i < fragments.length && fragments[i].kind === 'tableRow') {
            group.rows.push(fragments[i]);
            i++;
          }
        } else {
          while (i < fragments.length && fragments[i].kind === 'tableRow') {
            group.rows.push(fragments[i]);
            i++;
          }
        }
      } else if (f.kind === 'tableHeader') {
        group.header = f;
        i++;
        while (i < fragments.length && fragments[i].kind === 'tableRow') {
          group.rows.push(fragments[i]);
          i++;
        }
      } else {
        group.rows.push(f);
        i++;
        while (i < fragments.length && fragments[i].kind === 'tableRow') {
          group.rows.push(fragments[i]);
          i++;
        }
      }

      tableGroups.push(group);
    } else {
      nonTable.push(f);
      i++;
    }
  }

  return { nonTable, tableGroups };
};

const renderTableGroup = (
  group: GroupedTable,
): string => {
  const titleHtml = group.title
    ? `<div class="section-num page-break-inside-avoid" style="${SECTION_NUM_BASE}">${getLevel1Number('commandersTable')} ${getKindLabel('tableTitle')}</div>
       <div class="section-body" style="${SECTION_BODY_BASE}">`
    : '';

  const headerHtml = group.header
    ? `<thead>
        <tr style="background-color:#f2f2f2;">
          <th style="padding:6px 8px;border:1px solid #000000;font-weight:bold;text-align:center;font-size:12px;">ت</th>
          <th style="padding:6px 8px;border:1px solid #000000;font-weight:bold;text-align:center;font-size:12px;">المنصب</th>
          <th style="padding:6px 8px;border:1px solid #000000;font-weight:bold;text-align:center;font-size:12px;">الرتبة</th>
          <th style="padding:6px 8px;border:1px solid #000000;font-weight:bold;text-align:center;font-size:12px;">الاسم الكامل</th>
          <th style="padding:6px 8px;border:1px solid #000000;font-weight:bold;text-align:center;font-size:12px;">الرقم</th>
        </tr>
      </thead>`
    : '';

  const rowsHtml = group.rows.length > 0
    ? `<tbody>
        ${group.rows.map((_row, idx) => `
          <tr>
            <td style="padding:6px;border:1px solid #000000;text-align:center;font-size:12px;">${idx + 1}</td>
            <td style="padding:6px;border:1px solid #000000;text-align:center;font-size:12px;font-weight:bold;">${getKindLabel('tableRow')}</td>
            <td style="padding:6px;border:1px solid #000000;text-align:center;font-size:12px;">—</td>
            <td style="padding:6px;border:1px solid #000000;text-align:center;font-size:12px;">—</td>
            <td style="padding:6px;border:1px solid #000000;text-align:center;font-size:12px;">—</td>
          </tr>
        `).join('')}
      </tbody>`
    : '<tbody><tr><td colspan="5" style="padding:10px;color:#a0aec0;text-align:center;">لا توجد سجلات.</td></tr></tbody>';

  const closingHtml = group.title ? `</div>` : '';

  return `${titleHtml}
    <table class="military-table" style="margin:5px 0 10px 0;width:100%;border-collapse:collapse;">
      ${headerHtml}
      ${rowsHtml}
    </table>
    ${closingHtml}`;
};

// ── Page renderer ──────────────────────────────────────────────────────

const renderPageHtml = (
  pageNumber: number,
  placements: PagePlanV1['pages'][number]['placements'],
  fragmentMap: Readonly<Record<string, ReportFragmentV1>>,
): string => {
  const availableFragments: ReportFragmentV1[] = [];
  const missingIds: string[] = [];

  for (const p of placements) {
    const fragment = fragmentMap[p.fragmentId];
    if (fragment) {
      availableFragments.push(fragment);
    } else {
      missingIds.push(p.fragmentId);
    }
  }

  // Group table fragments together
  const { tableGroups } = groupTableFragments(availableFragments);

  let contentHtml = '';

  // Determine first fragment ID of each table group for ordering
  const tableGroupFirstIds = tableGroups.map((g) => {
    if (g.title) return g.title.id;
    if (g.header) return g.header.id;
    return g.rows[0]?.id ?? '';
  });
  let tgIdx = 0;

  for (const p of placements) {
    const fid = p.fragmentId;
    if (missingIds.includes(fid)) {
      contentHtml += `<div class="fragment-missing" style="padding:8px;margin-bottom:4px;border:1px solid #d00;background:#fff0f0;font-size:12px;">
        <span style="font-family:monospace;font-size:10px;color:#d00;">${fid}</span>
        <span style="font-size:11px;font-weight:700;color:#d00;">[MISSING]</span>
      </div>`;
      continue;
    }

    // Check if this is a table group first fragment
    if (tgIdx < tableGroups.length && fid === tableGroupFirstIds[tgIdx]) {
      contentHtml += renderTableGroup(tableGroups[tgIdx]);
      tgIdx++;
      continue;
    }

    // Check if this is a table fragment already consumed by table group
    const isTableFrag = tableGroups.some((g) =>
      (g.title && g.title.id === fid) ||
      (g.header && g.header.id === fid) ||
      g.rows.some((r) => r.id === fid)
    );
    if (isTableFrag) continue;

    // Non-table fragment
    const frag = fragmentMap[fid];
    if (frag) {
      contentHtml += renderNonTableFragment(frag);
    }
  }

  // Render missing fragments
  for (const mid of missingIds) {
    contentHtml += `<div class="fragment-missing" style="padding:8px;margin-bottom:4px;border:1px solid #d00;background:#fff0f0;font-size:12px;">
      <span style="font-family:monospace;font-size:10px;color:#d00;">${mid}</span>
      <span style="font-size:11px;font-weight:700;color:#d00;">[MISSING]</span>
    </div>`;
  }

  return `<div class="pdf-page" data-page-number="${pageNumber}" data-page-id="page:${pageNumber}" style="width:${A4_WIDTH_MM}mm;min-height:${A4_HEIGHT_MM}mm;padding:${MARGIN_TOP_MM}mm ${MARGIN_RIGHT_MM}mm ${MARGIN_BOTTOM_MM}mm ${MARGIN_LEFT_MM}mm;background:#ffffff;position:relative;page-break-after:always;overflow:hidden;">
    <div class="page-content" style="min-height:${contentHeightPx - 20}px;">
      ${contentHtml}
    </div>
    <div class="page-footer" style="position:absolute;bottom:${MARGIN_BOTTOM_MM - 3}mm;left:${MARGIN_LEFT_MM}mm;right:${MARGIN_RIGHT_MM}mm;text-align:center;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:4px;">
      <span class="confidential-label" style="font-size:10px;color:#999;">سري</span>
    </div>
  </div>`;
};

// ── Public types ───────────────────────────────────────────────────────

export type OfficialDomHtmlShadowReport = {
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
    domStructure: {
      hasSectionNum: boolean;
      hasSectionBody: boolean;
      hasMilitaryTable: boolean;
      hasReportTitle: boolean;
      hasReportHeader: boolean;
      hasSignaturesContainer: boolean;
      hasPageBreakAvoid: boolean;
      hasIndentationDivs: boolean;
      hasFragmentWrappers: boolean;
      tableGroupCount: number;
    };
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

export const renderOfficialDomHtmlShadow = (
  v1Document: ReportDocumentV1,
  pagePlan: PagePlanV1,
): OfficialDomHtmlShadowReport => {
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
<title>Official DOM Structure Shadow — ${v1Document.documentId}</title>
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
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    page-break-after: always;
    overflow: hidden;
  }

  .section-num.page-break-inside-avoid {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .signatures-container {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .military-table {
    page-break-inside: auto;
  }

  .page-break-inside-avoid {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .fragment-missing {
    page-break-inside: avoid;
    break-inside: avoid;
  }
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

  const domStructure = {
    hasSectionNum: html.includes('class="section-num'),
    hasSectionBody: html.includes('class="section-body'),
    hasMilitaryTable: html.includes('class="military-table'),
    hasReportTitle: html.includes('class="report-title'),
    hasReportHeader: html.includes('class="report-header'),
    hasSignaturesContainer: html.includes('class="signatures-container'),
    hasPageBreakAvoid: html.includes('page-break-inside-avoid'),
    hasIndentationDivs: html.includes('margin-right:') || html.includes('margin-right '),
    hasFragmentWrappers: html.includes('class="fragment fragment-'),
    tableGroupCount: (html.match(/class="military-table"/g) || []).length,
  };

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
      domStructure,
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
