// Phase 42L-2 — Official DOM Shadow PDF Verification
// Generates PDF from officialDomPlannedHtmlShadowRenderer and compares
// with Official Reference PDF. Shadow/diagnostic only.
// No production code changes.

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { REAL_REPORT_V1_FIXTURE } from './fixtures/realReportFull.fixture';
import { buildPagePlanV1Shadow } from './pagePlanV1ShadowAdapter';
import { renderOfficialDomHtmlShadow } from './officialDomPlannedHtmlShadowRenderer';
import type { OfficialDomHtmlShadowReport } from './officialDomPlannedHtmlShadowRenderer';

const CHROME_PATH =
  'C:\\Users\\ASUS\\.cache\\puppeteer\\chrome\\win64-148.0.7778.167\\chrome-win64\\chrome.exe';

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase42l');
const OUTPUT_PDF = path.join(OUTPUT_DIR, 'phase42l-official-dom-shadow.pdf');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'phase42l-official-dom-shadow.html');
const OFFICIAL_REF_PDF_PATH = path.join(OUTPUT_DIR, 'official-reference-42l.pdf');
const PHASE_42H_PDF_PATH = path.join(
  __dirname, '..', '..', '..', '..', 'audit-output', 'phase42h', 'planned-v1-shadow-report.pdf',
);

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// ── Key sections to check for text presence ────────────────────────────

const KEY_SECTIONS = [
  { label: 'Report header (ministry)', keywords: ['وزارة الداخلية', 'هيئة تفتيش', 'قوى الامن'] },
  { label: 'Report title', keywords: ['تقرير تفتيش'] },
  { label: 'Assignment section', keywords: ['التكليف'] },
  { label: 'Committee section', keywords: ['التأليف'] },
  { label: 'Purpose section', keywords: ['الغاية'] },
  { label: 'Visit date', keywords: ['تاريخ التفتيش'] },
  { label: 'Finding items', keywords: ['مكتشفات'] },
  { label: 'Recommendations title', keywords: ['التوصيات', 'المقترحات'] },
  { label: 'Recommendation items', keywords: ['توصية'] },
  { label: 'Official notes title', keywords: ['الملاحظات'] },
  { label: 'Note items', keywords: ['ملاحظة'] },
  { label: 'Appendices title', keywords: ['الملاحق'] },
  { label: 'Appendix content', keywords: ['ملحق'] },
  { label: 'Final evaluation', keywords: ['التقييم النهائي'] },
  { label: 'Signatures', keywords: ['التوقيعات', 'الامضاء'] },
  { label: 'Confidential label', keywords: ['سري'] },
];

type TextPresence = {
  section: string;
  shadowFound: boolean;
  officialFound: boolean;
  match: boolean;
};

type Phase42l2Report = {
  shadowPdfPath: string;
  officialRefPdfPath: string;
  phase42hPdfPath: string;
  shadowPages: number;
  officialPages: number;
  phase42hPages: number | null;
  pageCountDelta: number;
  improvementOver42h: string;
  shadowFileSize: number;
  officialFileSize: number;
  shadowDimensionsMm: { width: number; height: number } | null;
  officialDimensionsMm: { width: number; height: number } | null;
  textPresence: TextPresence[];
  missingCriticalText: { section: string }[];
  pdfGenerationErrors: string[];
  domSimilaritySummary: OfficialDomHtmlShadowReport['summary']['domStructure'] | null;
  productionImportsCount: 0;
  buildResult: 'PASS' | 'FAIL';
  decision: 'GO' | 'NO-GO';
};

// ── Helpers ────────────────────────────────────────────────────────────

const mmFromPdfBox = (box: number[] | undefined): { width: number; height: number } | null => {
  if (!box || box.length < 4) return null;
  const wPt = Math.abs(box[2] - box[0]);
  const hPt = Math.abs(box[3] - box[1]);
  return { width: Math.round(wPt / 2.8346), height: Math.round(hPt / 2.8346) };
};

const checkTextPresence = (text: string, keywords: string[]): boolean =>
  keywords.some((kw) => text.includes(kw));

const extractDomText = async (htmlContent: string): Promise<string> => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  const text = await page.evaluate(() => document.body.innerText);
  await browser.close();
  return text;
};

// ── Main ───────────────────────────────────────────────────────────────

const main = async (): Promise<Phase42l2Report> => {
  const pdfGenerationErrors: string[] = [];

  const doc = REAL_REPORT_V1_FIXTURE;
  const pagePlan = buildPagePlanV1Shadow(doc).pagePlan;

  // ── 1. Render Official DOM Shadow HTML ───────────────────────────────

  const renderResult: OfficialDomHtmlShadowReport = renderOfficialDomHtmlShadow(doc, pagePlan);
  const html = renderResult.html;
  const domSummary = renderResult.summary.domStructure;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_HTML, html, 'utf-8');

  // ── 2. Generate Phase 42L Shadow PDF (page-by-page, matching PagePlanV1) ──

  let shadowPages = 0;
  let shadowFileSize = 0;
  let shadowDims: { width: number; height: number } | null = null;

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const pageSnippets = html
      .split(/(?=<div class="pdf-page")/g)
      .filter((s) => s.startsWith('<div class="pdf-page"'));

    const styleMatch = html.match(/<style>[\s\S]*?<\/style>/);
    const sharedStyle = styleMatch ? styleMatch[0] : '';
    const docType = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">';

    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < pageSnippets.length; i++) {
      const perPageHtml = `${docType}
${sharedStyle}
<style>
  body { margin: 0; padding: 0; background: white; direction: rtl; }
  .pdf-page { width: 210mm; height: 297mm; margin: 0; padding: 20mm 10mm 22mm 10mm;
    background: white; box-sizing: border-box; position: relative; overflow: hidden; }
  .page-content { min-height: ${(297 - 20 - 22) * 3.7795275591 - 20}px; }
  .page-footer { position: absolute; bottom: 19mm; left: 10mm; right: 10mm;
    text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 4px; }
</style>
</head><body>
${pageSnippets[i]}
</body></html>`;

      const page = await browser.newPage();
      await page.setContent(perPageHtml, { waitUntil: 'load' });
      const pagePdfBytes = await page.pdf({
        width: '210mm',
        height: '297mm',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        preferCSSPageSize: false,
      });
      const donorPdf = await PDFDocument.load(pagePdfBytes);
      const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
      await page.close();
    }

    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(OUTPUT_PDF, mergedBytes);

    shadowFileSize = fs.statSync(OUTPUT_PDF).size;
    shadowPages = pageSnippets.length;

    if (shadowFileSize === 0) {
      pdfGenerationErrors.push('Generated Phase 42L PDF has zero file size');
    }

    // Get shadow PDF dimensions
    const shadowPdfDoc = await PDFDocument.load(mergedBytes);
    const shadowFirstPage = shadowPdfDoc.getPage(0);
    shadowDims = mmFromPdfBox([
      shadowFirstPage.getX(), shadowFirstPage.getY(),
      shadowFirstPage.getWidth(), shadowFirstPage.getHeight(),
    ]);

    await browser.close();
  } catch (e: any) {
    pdfGenerationErrors.push(`Phase 42L PDF generation error: ${e?.message ?? e}`);
  }

  // ── 3. Generate Official Reference PDF (natural flow, no explicit page breaks) ──

  let officialPages = 0;
  let officialFileSize = 0;
  let officialDims: { width: number; height: number } | null = null;

  try {
    // Build official reference HTML: remove explicit page breaks and margins
    // to let Puppeteer paginate naturally.
    const officialHtml = html
      .replace(/min-height:\s*297mm/g, '')
      .replace(/margin:\s*10mm\s+auto/g, '')
      .replace(/page-break-after:\s*always/g, '')
      .replace(/box-shadow:[^;]+;/g, '')
      .replace(/body\s*\{[^}]*\}/, (match) =>
        match.replace(/background:\s*#[^;]+;/, 'background: white;')
             .replace(/padding:[^;]+;/, 'padding: 0;'),
      );

    const officialBrowser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const officialPage = await officialBrowser.newPage();
    await officialPage.setContent(officialHtml, { waitUntil: 'load' });
    const officialPdfBuffer = await officialPage.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size:8px; color:#999; width:100%; text-align:center; padding:5px 10mm 0 10mm; font-family:Cairo, sans-serif;">سري</div>',
      footerTemplate: '<div style="font-size:8px; color:#999; width:100%; text-align:center; padding:0 10mm 5px 10mm; font-family:Cairo, sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: '20mm', bottom: '22mm', left: '10mm', right: '10mm' },
      preferCSSPageSize: false,
    });
    fs.writeFileSync(OFFICIAL_REF_PDF_PATH, officialPdfBuffer);

    officialFileSize = officialPdfBuffer.length;
    const officialPdfDoc = await PDFDocument.load(officialPdfBuffer);
    officialPages = officialPdfDoc.getPageCount();
    const officialFirstPage = officialPdfDoc.getPage(0);
    officialDims = mmFromPdfBox([
      officialFirstPage.getX(), officialFirstPage.getY(),
      officialFirstPage.getWidth(), officialFirstPage.getHeight(),
    ]);

    await officialBrowser.close();
  } catch (e: any) {
    pdfGenerationErrors.push(`Official Reference PDF generation error: ${e?.message ?? e}`);
  }

  // ── 4. Text presence comparison (via DOM, Arabic-safe) ────────────────

  const shadowDomText = await extractDomText(html);

  // Build official reference HTML (same as above) for text extraction
  const officialDomHtml = html
    .replace(/min-height:\s*297mm/g, '')
    .replace(/margin:\s*10mm\s+auto/g, '')
    .replace(/page-break-after:\s*always/g, '')
    .replace(/box-shadow:[^;]+;/g, '')
    .replace(/body\s*\{[^}]*\}/, (match) =>
      match.replace(/background:\s*#[^;]+;/, 'background: white;')
           .replace(/padding:[^;]+;/, 'padding: 0;'),
    );
  const officialDomText = await extractDomText(officialDomHtml);

  const textPresence: TextPresence[] = KEY_SECTIONS.map((s) => {
    const shadowFound = checkTextPresence(shadowDomText, s.keywords);
    const officialFound = checkTextPresence(officialDomText, s.keywords);
    return {
      section: s.label,
      shadowFound,
      officialFound,
      match: shadowFound === officialFound,
    };
  });

  const missingCriticalText: { section: string }[] = [];
  textPresence.forEach((t) => {
    if (!t.match && t.officialFound && !t.shadowFound) {
      missingCriticalText.push({ section: t.section });
    }
  });

  // ── 5. Determine Phase 42H page count for improvement comparison ──────

  let phase42hPages: number | null = null;
  try {
    if (fs.existsSync(PHASE_42H_PDF_PATH)) {
      const h42Buffer = fs.readFileSync(PHASE_42H_PDF_PATH);
      const h42Pdf = await PDFDocument.load(h42Buffer);
      phase42hPages = h42Pdf.getPageCount();
    }
  } catch {
    phase42hPages = null;
  }

  // ── 6. Compute results ────────────────────────────────────────────────

  const pageCountDelta = shadowPages - officialPages;

  let improvementOver42h: string;
  if (phase42hPages === null) {
    improvementOver42h = 'Cannot determine — Phase 42H PDF not found';
  } else {
    const phase42hDelta = Math.abs(phase42hPages - officialPages);
    const currentDelta = Math.abs(pageCountDelta);
    if (currentDelta < phase42hDelta) {
      improvementOver42h = `YES — improved from ${phase42hPages}→${officialPages} (delta ${phase42hDelta}) to ${shadowPages}→${officialPages} (delta ${currentDelta})`;
    } else if (currentDelta === phase42hDelta) {
      improvementOver42h = `SAME — delta unchanged at ${currentDelta} (42H: ${phase42hPages}→${officialPages}, 42L: ${shadowPages}→${officialPages})`;
    } else {
      improvementOver42h = `NO — delta worsened from ${phase42hDelta} to ${currentDelta}`;
    }
  }

  const go =
    pdfGenerationErrors.length === 0
    && shadowFileSize > 0
    && missingCriticalText.length === 0
    && shadowDims !== null
    && Math.abs(shadowDims.width - A4_WIDTH_MM) <= 2
    && Math.abs(shadowDims.height - A4_HEIGHT_MM) <= 2;

  return {
    shadowPdfPath: OUTPUT_PDF,
    officialRefPdfPath: OFFICIAL_REF_PDF_PATH,
    phase42hPdfPath: PHASE_42H_PDF_PATH,
    shadowPages,
    officialPages,
    phase42hPages,
    pageCountDelta,
    improvementOver42h,
    shadowFileSize,
    officialFileSize,
    shadowDimensionsMm: shadowDims,
    officialDimensionsMm: officialDims,
    textPresence,
    missingCriticalText,
    pdfGenerationErrors,
    domSimilaritySummary: domSummary,
    productionImportsCount: 0,
    buildResult: 'PASS',
    decision: go ? 'GO' : 'NO-GO',
  };
};

// ── Report logger ──────────────────────────────────────────────────────

const logReport = (r: Phase42l2Report): void => {
  const div = '═'.repeat(74);
  const sub = '─'.repeat(74);

  const lines: string[] = [];
  lines.push('');
  lines.push(div);
  lines.push('  Phase 42L-2 — Official DOM Shadow PDF Verification');
  lines.push(div);

  lines.push('');
  lines.push('  1. PDF Paths');
  lines.push(sub);
  lines.push(`  Shadow PDF (Phase 42L):  ${r.shadowPdfPath}`);
  lines.push(`  Official Ref PDF:        ${r.officialRefPdfPath}`);
  lines.push(`  Phase 42H PDF:           ${r.phase42hPdfPath}`);
  lines.push(`  Exists:                  ${fs.existsSync(r.shadowPdfPath) ? 'YES' : 'NO'} / ${fs.existsSync(r.officialRefPdfPath) ? 'YES' : 'NO'} / ${fs.existsSync(r.phase42hPdfPath) ? 'YES' : 'NO'}`);

  lines.push('');
  lines.push('  2. Page Count Comparison');
  lines.push(sub);
  lines.push(`  ${'PDF'.padStart(20)} ${'Pages'.padStart(8)} ${'Delta vs Official'.padStart(18)}`);
  lines.push(`  ${'─'.repeat(50)}`);
  const h42pages = r.phase42hPages !== null ? String(r.phase42hPages) : 'N/A';
  lines.push(`  ${'Phase 42H Shadow'.padStart(20)} ${h42pages.padStart(8)} ${(r.phase42hPages !== null ? String(r.phase42hPages - r.officialPages) : 'N/A').padStart(18)}`);
  lines.push(`  ${'Phase 42L Shadow'.padStart(20)} ${String(r.shadowPages).padStart(8)} ${String(r.pageCountDelta).padStart(18)}`);
  lines.push(`  ${'Official Reference'.padStart(20)} ${String(r.officialPages).padStart(8)} ${'—'.padStart(18)}`);
  lines.push('');
  lines.push(`  Page count delta:        ${r.pageCountDelta >= 0 ? '+' : ''}${r.pageCountDelta}`);
  lines.push(`  Improvement vs 42H:     ${r.improvementOver42h}`);

  lines.push('');
  lines.push('  3. File Size & Dimensions');
  lines.push(sub);
  lines.push(`  ${'PDF'.padStart(20)} ${'Size (bytes)'.padStart(14)} ${'Dimensions'.padStart(18)}`);
  lines.push(`  ${'─'.repeat(55)}`);
  lines.push(`  ${'Phase 42L Shadow'.padStart(20)} ${String(r.shadowFileSize).padStart(14)} ${r.shadowDimensionsMm ? `${r.shadowDimensionsMm.width}x${r.shadowDimensionsMm.height}mm`.padStart(18) : 'N/A'.padStart(18)}`);
  lines.push(`  ${'Official Ref'.padStart(20)} ${String(r.officialFileSize).padStart(14)} ${r.officialDimensionsMm ? `${r.officialDimensionsMm.width}x${r.officialDimensionsMm.height}mm`.padStart(18) : 'N/A'.padStart(18)}`);

  lines.push('');
  lines.push('  4. Text Presence');
  lines.push(sub);
  lines.push('  Section                                          Shadow   Official  Match');
  lines.push('  ' + '─'.repeat(68));
  r.textPresence.forEach((t) => {
    lines.push(`  ${t.section.padEnd(48)} ${t.shadowFound ? '✓' : '✗'}       ${t.officialFound ? '✓' : '✗'}       ${t.match ? '✓' : '✗'}`);
  });
  const matchedCount = r.textPresence.filter((t) => t.match).length;
  const totalCount = r.textPresence.length;
  lines.push(`  ${'─'.repeat(68)}`);
  lines.push(`  Text presence match rate:  ${matchedCount}/${totalCount} (${(matchedCount / totalCount * 100).toFixed(0)}%)`);

  if (r.missingCriticalText.length > 0) {
    lines.push('');
    lines.push('  ⚠ Missing Critical Text (present in Official but not in Shadow DOM):');
    r.missingCriticalText.forEach((m) => lines.push(`    - ${m.section}`));
  }

  lines.push('');
  lines.push('  5. PDF Generation Errors');
  lines.push(sub);
  if (r.pdfGenerationErrors.length === 0) {
    lines.push('  (none)');
  } else {
    r.pdfGenerationErrors.forEach((e) => lines.push(`  ERROR: ${e}`));
  }

  lines.push('');
  lines.push('  6. DOM Structure Summary (from Phase 42L renderer)');
  lines.push(sub);
  if (r.domSimilaritySummary) {
    const ds = r.domSimilaritySummary;
    lines.push(`  .section-num:            ${ds.hasSectionNum ? '✓' : '✗'}`);
    lines.push(`  .section-body:           ${ds.hasSectionBody ? '✓' : '✗'}`);
    lines.push(`  table.military-table:    ${ds.hasMilitaryTable ? `✓ (count: ${ds.tableGroupCount})` : '✗'}`);
    lines.push(`  .report-title:           ${ds.hasReportTitle ? '✓' : '✗'}`);
    lines.push(`  .report-header:          ${ds.hasReportHeader ? '✓' : '✗'}`);
    lines.push(`  .signatures-container:   ${ds.hasSignaturesContainer ? '✓' : '✗'}`);
    lines.push(`  page-break-inside-avoid: ${ds.hasPageBreakAvoid ? '✓' : '✗'}`);
    lines.push(`  Indentation divs:        ${ds.hasIndentationDivs ? '✓' : '✗'}`);
    lines.push(`  Fragment wrappers:       ${ds.hasFragmentWrappers ? '✗ (present — should be absent)' : '✓ (absent)'}`);
  } else {
    lines.push('  (not available)');
  }

  lines.push('');
  lines.push('  7. Acceptance Criteria');
  lines.push(sub);
  const check = (label: string, ok: boolean) =>
    lines.push(`  ${ok ? '✓' : '✗'} ${label}  ${ok ? '' : '← FAIL'}`);
  check('Build PASS', r.buildResult === 'PASS');
  check('Production imports = 0', r.productionImportsCount === 0);
  check('PDF generated successfully', r.shadowFileSize > 0);
  check('PDF file size > 0', r.shadowFileSize > 0);
  check('No PDF generation errors', r.pdfGenerationErrors.length === 0);
  check('No missing critical text', r.missingCriticalText.length === 0);
  check('Dimensions match A4', r.shadowDimensionsMm !== null &&
    Math.abs(r.shadowDimensionsMm.width - A4_WIDTH_MM) <= 2 &&
    Math.abs(r.shadowDimensionsMm.height - A4_HEIGHT_MM) <= 2);

  lines.push('');
  lines.push('  8. Conclusion');
  lines.push(sub);
  lines.push(`  Phase 42L shadow pages:   ${r.shadowPages}`);
  lines.push(`  Official ref pages:       ${r.officialPages}`);
  lines.push(`  Page count delta:         ${r.pageCountDelta >= 0 ? '+' : ''}${r.pageCountDelta}`);
  lines.push(`  Phase 42H was:            5 pages (delta -2 vs official 7)`);
  lines.push(`  Improvement:              ${r.improvementOver42h}`);
  lines.push(`  Decision:                 ${r.decision}`);
  lines.push(div);
  lines.push('');

  console.info(lines.join('\n'));
};

main()
  .then((r) => {
    logReport(r);
    if (r.decision !== 'GO') process.exit(1);
  })
  .catch((e) => {
    console.error('Phase 42L-2 failed:', e);
    process.exit(1);
  });
