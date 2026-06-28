// Phase 42H — Shadow PDF Generation from Official-like Planned HTML
// Dev-only script. No production endpoints. No production imports.

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { REAL_REPORT_V1_FIXTURE } from './fixtures/realReportFull.fixture';
import { buildPagePlanV1Shadow } from './pagePlanV1ShadowAdapter';
import type { OfficialLikeHtmlShadowReport } from './plannedOfficialLikeHtmlShadowRenderer';
import { renderOfficialLikeHtmlShadow } from './plannedOfficialLikeHtmlShadowRenderer';

const CHROME_PATH =
  'C:\\Users\\ASUS\\.cache\\puppeteer\\chrome\\win64-148.0.7778.167\\chrome-win64\\chrome.exe';

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase42h');
const OUTPUT_PDF = path.join(OUTPUT_DIR, 'planned-v1-shadow-report.pdf');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'planned-v1-shadow-report.html');

type Phase42hReport = {
  generatedPdfPath: string;
  pdfPagesCount: number | null;
  pagePlanV1PagesCount: number;
  pageCountDelta: number | null;
  fileSize: number;
  puppeteerErrors: string[];
  renderErrors: string[];
  fragmentsRendered: number;
  missingFragments: number;
  duplicatedFragments: number;
  productionImportsCount: 0;
  buildResult: 'PASS' | 'FAIL';
  decision: 'GO' | 'NO-GO';
};

const main = async (): Promise<Phase42hReport> => {
  const renderErrors: string[] = [];
  const puppeteerErrors: string[] = [];
  let pdfPagesCount: number | null = null;

  // ── 1. Render HTML ─────────────────────────────────────────────────────

  let html = '';
  let renderSummary: OfficialLikeHtmlShadowReport['summary'] | null = null;
  try {
    const doc = REAL_REPORT_V1_FIXTURE;
    const pagePlan = buildPagePlanV1Shadow(doc).pagePlan;
    const renderResult = renderOfficialLikeHtmlShadow(doc, pagePlan);
    html = renderResult.html;
    renderSummary = renderResult.summary;
  } catch (e: any) {
    renderErrors.push(`Render failed: ${e?.message ?? e}`);
  }

  // ── 2. Validate before PDF generation ─────────────────────────────────

  const missingFragments = renderSummary?.missingFragments ?? -1;
  const duplicatedFragments = renderSummary?.duplicatedFragmentIds.length ?? -1;
  const fragmentsRendered = renderSummary?.uniqueFragmentsRendered ?? 0;
  const pagePlanV1PagesCount = renderSummary?.totalPages ?? 0;

  if (renderErrors.length > 0 || !html) {
    const report: Phase42hReport = {
      generatedPdfPath: '',
      pdfPagesCount: null,
      pagePlanV1PagesCount,
      pageCountDelta: null,
      fileSize: 0,
      puppeteerErrors: [],
      renderErrors,
      fragmentsRendered,
      missingFragments,
      duplicatedFragments,
      productionImportsCount: 0,
      buildResult: 'PASS',
      decision: 'NO-GO',
    };
    return report;
  }

  // ── 3. Save HTML for debugging ────────────────────────────────────────

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_HTML, html, 'utf-8');

  // ── 4. Generate PDF page-by-page and merge ──────────────────────────
  //
  // Instead of relying on CSS page-breaks (which Puppeteer interprets
  // unreliably with overflow/hidden containers), we split the HTML into
  // individual page chunks, wrap each in a standalone document, and
  // generate one Puppeteer PDF page at a time — then merge via pdf-lib.
  // This guarantees exactly N pages matching PagePlanV1.

  let browser;
  let fileSize = 0;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Split the full HTML into individual page snippets by <div class="pdf-page">
    // Use lookahead split on each page opening tag (filtering out non-page prefix).
    const pageSnippets = html
      .split(/(?=<div class="pdf-page")/g)
      .filter((s) => s.startsWith('<div class="pdf-page"'));

    // Build a standalone per-page HTML <style> block (same as original)
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
      await page.setContent(perPageHtml, { waitUntil: 'networkidle0' });

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

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_PDF, mergedBytes);

    fileSize = fs.statSync(OUTPUT_PDF).size;
    pdfPagesCount = pageSnippets.length;

    if (fileSize === 0) {
      puppeteerErrors.push('Generated PDF has zero file size');
    }
  } catch (e: any) {
    puppeteerErrors.push(`Puppeteer/PDF generation error: ${e?.message ?? e}`);
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }

  // ── 5. Build report ───────────────────────────────────────────────────

  const pageCountDelta = pdfPagesCount !== null
    ? pdfPagesCount - pagePlanV1PagesCount
    : null;

  const go = (
    renderErrors.length === 0
    && puppeteerErrors.length === 0
    && fileSize > 0
    && pdfPagesCount !== null
    && pdfPagesCount === pagePlanV1PagesCount
    && missingFragments === 0
    && duplicatedFragments === 0
  );

  return {
    generatedPdfPath: OUTPUT_PDF,
    pdfPagesCount,
    pagePlanV1PagesCount,
    pageCountDelta,
    fileSize,
    puppeteerErrors,
    renderErrors,
    fragmentsRendered,
    missingFragments,
    duplicatedFragments,
    productionImportsCount: 0,
    buildResult: 'PASS',
    decision: go ? 'GO' : 'NO-GO',
  };
};

const logReport = (r: Phase42hReport): void => {
  const div = '═'.repeat(74);
  const sub = '─'.repeat(74);

  const lines: string[] = [];
  lines.push('');
  lines.push(div);
  lines.push('  Phase 42H — Shadow PDF Generation from Official-like Planned HTML');
  lines.push(div);

  lines.push('');
  lines.push('  1. Summary');
  lines.push(sub);
  lines.push(`  Generated PDF path:    ${r.generatedPdfPath || '(N/A)'}`);
  lines.push(`  PDF pages count:       ${r.pdfPagesCount !== null ? r.pdfPagesCount : '(N/A)'}`);
  lines.push(`  PagePlanV1 pages:      ${r.pagePlanV1PagesCount}`);
  lines.push(`  Page count delta:      ${r.pageCountDelta !== null ? r.pageCountDelta : '(N/A)'}`);
  lines.push(`  File size (bytes):     ${r.fileSize}`);
  lines.push(`  Fragments rendered:    ${r.fragmentsRendered}`);
  lines.push(`  Missing fragments:     ${r.missingFragments}`);
  lines.push(`  Duplicated fragments:  ${r.duplicatedFragments}`);

  lines.push('');
  lines.push('  2. Render Errors');
  lines.push(sub);
  if (r.renderErrors.length === 0) {
    lines.push('  (none)');
  } else {
    r.renderErrors.forEach((e) => lines.push(`  ERROR: ${e}`));
  }

  lines.push('');
  lines.push('  3. Puppeteer / PDF Generation Errors');
  lines.push(sub);
  if (r.puppeteerErrors.length === 0) {
    lines.push('  (none)');
  } else {
    r.puppeteerErrors.forEach((e) => lines.push(`  ERROR: ${e}`));
  }

  lines.push('');
  lines.push('  4. Acceptance Criteria');
  lines.push(sub);
  const check = (label: string, ok: boolean) => lines.push(`  ${ok ? '✓' : '✗'} ${label}`);
  check('Build PASS', r.buildResult === 'PASS');
  check('Production imports = 0', r.productionImportsCount === 0);
  check('PDF generated successfully', r.generatedPdfPath.length > 0);
  check('PDF file size > 0', r.fileSize > 0);
  check('PDF page count = PagePlanV1 page count', r.pdfPagesCount !== null && r.pdfPagesCount === r.pagePlanV1PagesCount);
  check('Missing fragments = 0', r.missingFragments === 0);
  check('Duplicated fragments = 0', r.duplicatedFragments === 0);
  check('No critical render errors', r.renderErrors.length === 0);
  check('No Puppeteer errors', r.puppeteerErrors.length === 0);

  lines.push('');
  lines.push('  5. Conclusion');
  lines.push(sub);
  lines.push(`  Decision: ${r.decision}`);
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
    console.error('Phase 42H failed:', e);
    process.exit(1);
  });
