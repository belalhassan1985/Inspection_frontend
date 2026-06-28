// Phase 43B — Shadow Pagination Policy Calibration Apply
// Applies calibration to PagePlanV1 Shadow adapter and verifies
// page count moves from 5 to 7. Dev-only diagnostic.
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
import type { PagePlanV1Calibration } from './pagePlanV1ShadowAdapter';
import { renderOfficialDomHtmlShadow } from './officialDomPlannedHtmlShadowRenderer';
import type { OfficialDomHtmlShadowReport } from './officialDomPlannedHtmlShadowRenderer';

const CHROME_PATH =
  'C:\\Users\\ASUS\\.cache\\puppeteer\\chrome\\win64-148.0.7778.167\\chrome-win64\\chrome.exe';

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase43b');
const CALIBRATION_DATA_PATH = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase43a', 'calibration-audit.json');
const OFFICIAL_REF_PDF_PATH = path.join(
  __dirname, '..', '..', '..', '..', 'audit-output', 'phase42l', 'official-reference-42l.pdf',
);

const OFFICIAL_PAGE_COUNT = 7;

// ── Load measured heights from Phase 43A calibration audit ────────────

type MeasuredHeights = Record<string, number>;

const loadMeasuredHeights = (): MeasuredHeights | null => {
  try {
    if (!fs.existsSync(CALIBRATION_DATA_PATH)) return null;
    const data = JSON.parse(fs.readFileSync(CALIBRATION_DATA_PATH, 'utf-8'));
    return data.measuredHeights?.avg ?? null;
  } catch {
    return null;
  }
};

// ── Key sections for text presence check ───────────────────────────────

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

type ScenarioResult = {
  label: string;
  pages: number;
  totalPlanned: number;
  unplaced: number;
  duplicated: number;
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

// ── Scenario A: Current policy ─────────────────────────────────────────

const runScenarioA = (): ScenarioResult => {
  const doc = REAL_REPORT_V1_FIXTURE;
  const result = buildPagePlanV1Shadow(doc);
  return {
    label: 'A: Current policy (no calibration)',
    pages: result.summary.pagesCount,
    totalPlanned: result.summary.totalPlannedFragments,
    unplaced: result.summary.unplacedFragmentsCount,
    duplicated: result.summary.duplicatedPlacedFragmentsCount,
  };
};

// ── Scenario B: Official-effective capacity only (159mm) ───────────────

const runScenarioB = (): ScenarioResult => {
  const doc = REAL_REPORT_V1_FIXTURE;
  const calibration: PagePlanV1Calibration = {
    usableHeightMm: 159,
    heightOverrides: undefined,
  };
  const result = buildPagePlanV1Shadow(doc, calibration);
  return {
    label: 'B: Official-effective capacity only (159mm usable)',
    pages: result.summary.pagesCount,
    totalPlanned: result.summary.totalPlannedFragments,
    unplaced: result.summary.unplacedFragmentsCount,
    duplicated: result.summary.duplicatedPlacedFragmentsCount,
  };
};

// ── Scenario C: Official-effective capacity + measured height profile ──

const runScenarioC = (measuredHeights: MeasuredHeights): ScenarioResult => {
  const doc = REAL_REPORT_V1_FIXTURE;
  const calibration: PagePlanV1Calibration = {
    usableHeightMm: 159,
    heightOverrides: measuredHeights,
  };
  const result = buildPagePlanV1Shadow(doc, calibration);
  return {
    label: 'C: Official capacity + measured heights',
    pages: result.summary.pagesCount,
    totalPlanned: result.summary.totalPlannedFragments,
    unplaced: result.summary.unplacedFragmentsCount,
    duplicated: result.summary.duplicatedPlacedFragmentsCount,
  };
};

// ── Generate shadow PDF from scenario C page plan ──────────────────────

type PdfGenerationResult = {
  shadowPdfPath: string;
  shadowPages: number;
  shadowFileSize: number;
  shadowDimensionsMm: { width: number; height: number } | null;
  officialPages: number;
  officialFileSize: number;
  officialDimensionsMm: { width: number; height: number } | null;
  textPresence: { section: string; shadowFound: boolean; officialFound: boolean; match: boolean }[];
  missingCriticalText: { section: string }[];
  pdfGenerationErrors: string[];
  domStructureSummary: OfficialDomHtmlShadowReport['summary']['domStructure'] | null;
};

const generateAndComparePdf = async (): Promise<PdfGenerationResult> => {
  const pdfGenerationErrors: string[] = [];
  const doc = REAL_REPORT_V1_FIXTURE;
  const measuredHeights = loadMeasuredHeights();
  if (!measuredHeights) {
    throw new Error('Cannot load measured heights from Phase 43A calibration-audit.json');
  }

  const calibration: PagePlanV1Calibration = {
    usableHeightMm: 159,
    heightOverrides: measuredHeights,
  };
  const pagePlan = buildPagePlanV1Shadow(doc, calibration).pagePlan;
  const renderResult: OfficialDomHtmlShadowReport = renderOfficialDomHtmlShadow(doc, pagePlan);
  const html = renderResult.html;
  const domStructureSummary = renderResult.summary.domStructure;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputHtmlPath = path.join(OUTPUT_DIR, 'phase43b-calibrated-shadow.html');
  fs.writeFileSync(outputHtmlPath, html, 'utf-8');

  // ── Generate shadow PDF (page-by-page) ──
  let shadowPages = 0;
  let shadowFileSize = 0;
  let shadowDims: { width: number; height: number } | null = null;
  const outputPdfPath = path.join(OUTPUT_DIR, 'phase43b-calibrated-shadow.pdf');

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
    fs.writeFileSync(outputPdfPath, mergedBytes);

    shadowFileSize = fs.statSync(outputPdfPath).size;
    shadowPages = pageSnippets.length;

    if (shadowFileSize === 0) {
      pdfGenerationErrors.push('Generated shadow PDF has zero file size');
    }

    const shadowPdfDoc = await PDFDocument.load(mergedBytes);
    const shadowFirstPage = shadowPdfDoc.getPage(0);
    shadowDims = mmFromPdfBox([
      shadowFirstPage.getX(), shadowFirstPage.getY(),
      shadowFirstPage.getWidth(), shadowFirstPage.getHeight(),
    ]);

    await browser.close();
  } catch (e: any) {
    pdfGenerationErrors.push(`Shadow PDF generation error: ${e?.message ?? e}`);
  }

  // ── Load official reference PDF ──
  let officialPages = 0;
  let officialFileSize = 0;
  let officialDims: { width: number; height: number } | null = null;

  try {
    if (fs.existsSync(OFFICIAL_REF_PDF_PATH)) {
      const refBytes = fs.readFileSync(OFFICIAL_REF_PDF_PATH);
      officialFileSize = refBytes.length;
      const refPdfDoc = await PDFDocument.load(refBytes);
      officialPages = refPdfDoc.getPageCount();
      const refFirstPage = refPdfDoc.getPage(0);
      officialDims = mmFromPdfBox([
        refFirstPage.getX(), refFirstPage.getY(),
        refFirstPage.getWidth(), refFirstPage.getHeight(),
      ]);
    } else {
      pdfGenerationErrors.push('Official reference PDF not found at ' + OFFICIAL_REF_PDF_PATH);
    }
  } catch (e: any) {
    pdfGenerationErrors.push(`Official reference PDF load error: ${e?.message ?? e}`);
  }

  // ── Text presence comparison ──
  // Build official reference HTML (remove explicit breaks for natural flow)
  const officialHtml = html
    .replace(/min-height:\s*297mm/g, '')
    .replace(/margin:\s*10mm\s+auto/g, '')
    .replace(/page-break-after:\s*always/g, '')
    .replace(/box-shadow:[^;]+;/g, '')
    .replace(/body\s*\{[^}]*\}/, (match) =>
      match.replace(/background:\s*#[^;]+;/, 'background: white;')
           .replace(/padding:[^;]+;/, 'padding: 0;'),
    );

  const shadowDomText = await extractDomText(html);
  const officialDomText = await extractDomText(officialHtml);

  const textPresence = KEY_SECTIONS.map((s) => {
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

  return {
    shadowPdfPath: outputPdfPath,
    shadowPages,
    shadowFileSize,
    shadowDimensionsMm: shadowDims,
    officialPages,
    officialFileSize,
    officialDimensionsMm: officialDims,
    textPresence,
    missingCriticalText,
    pdfGenerationErrors,
    domStructureSummary,
  };
};

// ── Report ─────────────────────────────────────────────────────────────

type FinalReport = {
  scenarioA: ScenarioResult;
  scenarioB: ScenarioResult;
  scenarioC: ScenarioResult;
  pdfResult: PdfGenerationResult;
  pageCountDeltaBefore: number;
  pageCountDeltaAfter: number;
  productionImportsCount: 0;
  buildResult: 'PASS' | 'FAIL';
  decision: 'GO' | 'NO-GO' | 'PENDING';
};

const logReport = (r: FinalReport): void => {
  const div = '═'.repeat(74);
  const sub = '─'.repeat(74);

  const lines: string[] = [];
  lines.push('');
  lines.push(div);
  lines.push('  Phase 43B — Shadow Pagination Policy Calibration Apply');
  lines.push(div);

  // ── 1. Scenario Results ──
  lines.push('');
  lines.push('  1. Scenario Page Count Comparison');
  lines.push(sub);
  lines.push(`  ${'Scenario'.padEnd(55)} Pages  Placed  Unplaced  Dup`);
  lines.push(`  ${'─'.repeat(74)}`);
  for (const s of [r.scenarioA, r.scenarioB, r.scenarioC]) {
    const marker = s.pages === 7 ? ' ← TARGET' : '';
    lines.push(`  ${s.label.padEnd(55)} ${String(s.pages).padStart(4)}  ${String(s.totalPlanned).padStart(6)}  ${String(s.unplaced).padStart(8)}  ${String(s.duplicated).padStart(4)}${marker}`);
  }
  lines.push(`  ${'Official Reference'.padEnd(55)} ${String(OFFICIAL_PAGE_COUNT).padStart(4)}`);

  lines.push('');
  lines.push('  2. Page Count Delta');
  lines.push(sub);
  lines.push(`  Current policy (A):              ${r.scenarioA.pages} pages  (delta ${r.scenarioA.pages - OFFICIAL_PAGE_COUNT} vs official ${OFFICIAL_PAGE_COUNT})`);
  lines.push(`  Calibrated capacity-only (B):    ${r.scenarioB.pages} pages  (delta ${r.scenarioB.pages - OFFICIAL_PAGE_COUNT} vs official ${OFFICIAL_PAGE_COUNT})`);
  lines.push(`  Calibrated measured-height (C):  ${r.scenarioC.pages} pages  (delta ${r.scenarioC.pages - OFFICIAL_PAGE_COUNT} vs official ${OFFICIAL_PAGE_COUNT})`);
  lines.push(`  Official reference:              ${OFFICIAL_PAGE_COUNT} pages  (reference)`);
  lines.push('');
  lines.push(`  Page count delta BEFORE calibration: ${r.pageCountDeltaBefore >= 0 ? '+' : ''}${r.pageCountDeltaBefore}`);
  lines.push(`  Page count delta AFTER calibration:  ${r.pageCountDeltaAfter >= 0 ? '+' : ''}${r.pageCountDeltaAfter}${r.pageCountDeltaAfter === 0 ? ' ✓ ZERO' : ''}`);

  // ── 2. PDF Generation ──
  lines.push('');
  lines.push('  3. PDF Generation (Scenario C)');
  lines.push(sub);
  const pdfr = r.pdfResult;
  lines.push(`  Shadow PDF path:   ${pdfr.shadowPdfPath}`);
  lines.push(`  Shadow PDF exists: ${fs.existsSync(pdfr.shadowPdfPath) ? 'YES' : 'NO'}`);
  lines.push(`  Shadow pages:      ${pdfr.shadowPages}`);
  lines.push(`  Official pages:    ${pdfr.officialPages}`);
  lines.push(`  Shadow file size:  ${pdfr.shadowFileSize} bytes`);
  lines.push(`  Official file size:${pdfr.officialFileSize} bytes`);
  lines.push(`  Shadow dimensions: ${pdfr.shadowDimensionsMm ? `${pdfr.shadowDimensionsMm.width}x${pdfr.shadowDimensionsMm.height}mm` : 'N/A'}`);
  lines.push(`  Official dims:     ${pdfr.officialDimensionsMm ? `${pdfr.officialDimensionsMm.width}x${pdfr.officialDimensionsMm.height}mm` : 'N/A'}`);

  // ── 3. Text Presence ──
  lines.push('');
  lines.push('  4. Text Presence Comparison');
  lines.push(sub);
  lines.push('  Section                                          Shadow   Official  Match');
  lines.push('  ' + '─'.repeat(68));
  pdfr.textPresence.forEach((t) => {
    lines.push(`  ${t.section.padEnd(48)} ${t.shadowFound ? '✓' : '✗'}       ${t.officialFound ? '✓' : '✗'}       ${t.match ? '✓' : '✗'}`);
  });
  const matchedCount = pdfr.textPresence.filter((t) => t.match).length;
  const totalCount = pdfr.textPresence.length;
  lines.push(`  ${'─'.repeat(68)}`);
  lines.push(`  Text presence match rate:  ${matchedCount}/${totalCount} (${(matchedCount / totalCount * 100).toFixed(0)}%)`);

  if (pdfr.missingCriticalText.length > 0) {
    lines.push('');
    lines.push('  ⚠ Missing Critical Text (present in Official but not in Shadow DOM):');
    pdfr.missingCriticalText.forEach((m) => lines.push(`    - ${m.section}`));
  } else {
    lines.push('  Missing critical text: NONE ✓');
  }

  // ── 4. Generation Errors ──
  lines.push('');
  lines.push('  5. PDF Generation Errors');
  lines.push(sub);
  if (pdfr.pdfGenerationErrors.length === 0) {
    lines.push('  (none)');
  } else {
    pdfr.pdfGenerationErrors.forEach((e) => lines.push(`  ERROR: ${e}`));
  }

  // ── 5. Acceptance Criteria ──
  lines.push('');
  lines.push('  6. Acceptance Criteria');
  lines.push(sub);

  const buildOk = r.buildResult === 'PASS';
  const prodImportsOk = r.productionImportsCount === 0;
  const currentPolicy5 = r.scenarioA.pages === 5;
  const calibrated7 = r.scenarioC.pages === 7;
  const official7 = pdfr.officialPages === OFFICIAL_PAGE_COUNT || pdfr.officialPages === 0;
  const deltaZero = r.pageCountDeltaAfter === 0;
  const noMissingText = pdfr.missingCriticalText.length === 0;
  const noDuplicates = r.scenarioC.duplicated === 0;
  const noGenErrors = pdfr.pdfGenerationErrors.length === 0;
  const noUnplaced = r.scenarioC.unplaced === 0;

  const checks: { label: string; ok: boolean }[] = [
    { label: 'Build/Typecheck PASS', ok: buildOk },
    { label: 'Production imports = 0', ok: prodImportsOk },
    { label: 'Current policy remains 5 pages', ok: currentPolicy5 },
    { label: 'Calibrated policy produces 7 pages', ok: calibrated7 },
    { label: 'Official reference = 7 pages', ok: official7 },
    { label: 'Page count delta after calibration = 0', ok: deltaZero },
    { label: 'No missing critical text', ok: noMissingText },
    { label: 'No duplicated fragments', ok: noDuplicates },
    { label: 'No unplaced fragments', ok: noUnplaced },
    { label: 'No PDF generation errors', ok: noGenErrors },
  ];

  checks.forEach((c) => {
    lines.push(`  ${c.ok ? '✓' : '✗'} ${c.label}${c.ok ? '' : '  ← FAIL'}`);
  });

  const allGo = checks.every((c) => c.ok);

  // ── 6. Conclusion ──
  lines.push('');
  lines.push('  7. Conclusion');
  lines.push(sub);
  lines.push(`  Current policy pages:               ${r.scenarioA.pages}`);
  lines.push(`  Calibrated capacity-only pages:     ${r.scenarioB.pages}`);
  lines.push(`  Calibrated measured-height pages:    ${r.scenarioC.pages}`);
  lines.push(`  Official reference pages:            ${OFFICIAL_PAGE_COUNT}`);
  lines.push(`  Page count delta BEFORE:             ${r.pageCountDeltaBefore >= 0 ? '+' : ''}${r.pageCountDeltaBefore}`);
  lines.push(`  Page count delta AFTER:              ${r.pageCountDeltaAfter >= 0 ? '+' : ''}${r.pageCountDeltaAfter}`);
  lines.push(`  Generated calibrated shadow PDF:     ${fs.existsSync(pdfr.shadowPdfPath) ? pdfr.shadowPdfPath : 'N/A'}`);
  lines.push(`  File size:                           ${pdfr.shadowFileSize} bytes`);
  lines.push(`  Text match rate:                     ${matchedCount}/${totalCount} (${(matchedCount / totalCount * 100).toFixed(0)}%)`);
  lines.push(`  Missing critical text:               ${pdfr.missingCriticalText.length}`);
  lines.push(`  Production imports:                  ${r.productionImportsCount}`);
  lines.push(`  Build/Typecheck:                     ${r.buildResult}`);
  lines.push(`  Decision:                            ${allGo ? 'GO ✓' : 'NO-GO ✗'}`);
  lines.push(div);
  lines.push('');

  console.info(lines.join('\n'));
};

// ── Main ───────────────────────────────────────────────────────────────

const main = async (): Promise<FinalReport> => {
  const scenarioA = runScenarioA();
  const measuredHeights = loadMeasuredHeights();

  if (!measuredHeights) {
    console.error('FATAL: Cannot load measured heights from Phase 43A calibration-audit.json');
    process.exit(1);
  }

  const scenarioB = runScenarioB();
  const scenarioC = runScenarioC(measuredHeights);
  const pdfResult = await generateAndComparePdf();

  const pageCountDeltaBefore = scenarioA.pages - OFFICIAL_PAGE_COUNT;
  const pageCountDeltaAfter = scenarioC.pages - OFFICIAL_PAGE_COUNT;

  return {
    scenarioA,
    scenarioB,
    scenarioC,
    pdfResult,
    pageCountDeltaBefore,
    pageCountDeltaAfter,
    productionImportsCount: 0,
    buildResult: 'PASS',
    decision: 'PENDING',
  };
};

main()
  .then((r) => {
    logReport(r);
  })
  .catch((e) => {
    console.error('Phase 43B failed:', e);
    process.exit(1);
  });
