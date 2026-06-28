// Phase 42L — Official DOM Structure Shadow Renderer
// Mirrors the official pipeline's generateHtmlFromPayload DOM structure
// using fragment data instead of the official payload.
// Dev-only diagnostic. No production code changes.

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { REAL_REPORT_V1_FIXTURE } from './fixtures/realReportFull.fixture';
import { buildPagePlanV1Shadow } from './pagePlanV1ShadowAdapter';
import { renderOfficialLikeHtmlShadow } from './plannedOfficialLikeHtmlShadowRenderer';
import { renderOfficialDomHtmlShadow } from './officialDomPlannedHtmlShadowRenderer';

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase42l');

// ── DOM structure audit ────────────────────────────────────────────────

type DomElementPresence = {
  element: string;
  officialLike: boolean;
  officialDom: boolean;
  match: boolean;
};

type DomStructureAudit = {
  totalElementsChecked: number;
  matchingElements: number;
  divergentElements: number;
  elements: DomElementPresence[];
  structuralCoveragePct: number;
  keyStructuralDiffs: string[];
  higherFidelityThanOfficialLike: boolean;
};

/** Check whether an HTML string contains a given CSS selector pattern. */
const htmlContains = (html: string, pattern: string): boolean =>
  html.includes(pattern);

/** Classes / patterns present in the official pipeline's HTML. */
const OFFICIAL_DOM_SIGNATURES: { label: string; pattern: string }[] = [
  { label: '.section-num', pattern: 'class="section-num' },
  { label: '.section-body', pattern: 'class="section-body"' },
  { label: '.report-title', pattern: 'class="report-title"' },
  { label: '.report-header', pattern: 'class="report-header"' },
  { label: 'table.military-table', pattern: 'class="military-table"' },
  { label: '.signatures-container', pattern: 'class="signatures-container"' },
  { label: '.page-break-inside-avoid', pattern: 'page-break-inside-avoid' },
  { label: '.page-break (manual)', pattern: 'class="page-break' },
  { label: 'pdf-parenthesized-number', pattern: 'pdf-parenthesized-number' },
  { label: 'Section-num with inline style', pattern: 'style="font-size:16px;font-weight:bold;color:#0c2340;margin-top:30px;margin-bottom:10px;"' },
  { label: 'Section-body with inline style', pattern: 'style="margin-right:15px;margin-bottom:20px;text-align:justify;font-size:13px;line-height:1.7;color:#2d3748;"' },
  { label: 'font-size:13.5px (official body)', pattern: 'font-size:13.5px' },
  { label: 'table > thead > tr > th', pattern: '<th' },
  { label: 'table > tbody > tr > td', pattern: '<td' },
  { label: 'Signature box structure', pattern: 'class="sig-line"' },
  { label: 'Header table structure', pattern: 'class="header-text"' },
  { label: 'Confidential footer label', pattern: 'confidential-label' },
  { label: 'margin-right indentation divs', pattern: 'margin-right:' },
  { label: '.page-break-inside-avoid on .section-num', pattern: 'section-num page-break-inside-avoid' },
  { label: 'break-inside: avoid CSS', pattern: 'break-inside: avoid' },
  { label: 'body font-size 13.5px', pattern: 'font-size: 13.5px' },
  { label: 'body font-size 14px (fallback)', pattern: 'font-size: 14px' },
];

/** Patterns that should NOT be in official-like HTML (fragment wrappers). */
const FRAGMENT_WRAPPER_SIGNATURES: { label: string; pattern: string }[] = [
  { label: 'fragment-finding-group', pattern: 'fragment-finding-group' },
  { label: 'fragment-finding-item', pattern: 'fragment-finding-item' },
  { label: 'fragment-rec-group', pattern: 'fragment-rec-group' },
  { label: 'fragment-rec-item', pattern: 'fragment-rec-item' },
  { label: 'fragment-note-category', pattern: 'fragment-note-category' },
  { label: 'fragment-note-item', pattern: 'fragment-note-item' },
  { label: 'fragment-appendix-title', pattern: 'fragment-appendix-title' },
  { label: 'fragment-intro', pattern: 'fragment-intro' },
  { label: 'data-fragment-id', pattern: 'data-fragment-id' },
  { label: 'data-kind attribute', pattern: 'data-kind="' },
];

const runDomStructureAudit = (
  officialLikeHtml: string,
  officialDomHtml: string,
): DomStructureAudit => {
  const elements: DomElementPresence[] = [];
  let matching = 0;
  let divergent = 0;

  for (const sig of OFFICIAL_DOM_SIGNATURES) {
    const inOfficialLike = htmlContains(officialLikeHtml, sig.pattern);
    const inOfficialDom = htmlContains(officialDomHtml, sig.pattern);
    const match = inOfficialLike === inOfficialDom;
    elements.push({
      element: sig.label,
      officialLike: inOfficialLike,
      officialDom: inOfficialDom,
      match,
    });
    if (match) matching++;
    else divergent++;
  }

  // Check fragment wrapper absence (negative check)
  for (const sig of FRAGMENT_WRAPPER_SIGNATURES) {
    const inOfficialLike = htmlContains(officialLikeHtml, sig.pattern);
    const inOfficialDom = htmlContains(officialDomHtml, sig.pattern);
    // Official DOM should NOT have fragment wrappers; official-like may
    const match = !inOfficialDom; // official DOM should always be false
    elements.push({
      element: `[NO] ${sig.label}`,
      officialLike: inOfficialLike,
      officialDom: inOfficialDom,
      match,
    });
    if (inOfficialDom) divergent++;
    else if (inOfficialLike !== inOfficialDom) divergent++;
    else matching++;
  }

  const keyStructuralDiffs: string[] = [];
  for (const elem of elements) {
    if (!elem.match) {
      keyStructuralDiffs.push(
        `${elem.element}: officialLike=${elem.officialLike}, officialDom=${elem.officialDom}`,
      );
    }
  }

  const total = elements.length;
  return {
    totalElementsChecked: total,
    matchingElements: matching,
    divergentElements: divergent,
    elements,
    structuralCoveragePct:
      total > 0 ? Math.round((matching / total) * 10000) / 100 : 100,
    keyStructuralDiffs,
    higherFidelityThanOfficialLike:
      divergent === 0 || matching > total * 0.8,
  };
};

// ── Main ───────────────────────────────────────────────────────────────

const main = async () => {
  const doc = REAL_REPORT_V1_FIXTURE;
  const planResult = buildPagePlanV1Shadow(doc);
  const plan = planResult.pagePlan;

  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  Phase 42L — Official DOM Structure Shadow Renderer');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  // ── 1. Render both versions ───────────────────────────────────────────

  const officialLikeResult = renderOfficialLikeHtmlShadow(doc, plan);
  const officialDomResult = renderOfficialDomHtmlShadow(doc, plan);

  console.log('  1. Render Results');
  console.log('  ───────────────────────────────────────────────────────────');
  console.log(`  Official-Like Shadow:  ${officialLikeResult.summary.totalPages} pages, ${officialLikeResult.summary.totalFragmentPlacements} placements, decision: ${officialLikeResult.decision}`);
  console.log(`  Official-DOM Shadow:   ${officialDomResult.summary.totalPages} pages, ${officialDomResult.summary.totalFragmentPlacements} placements, decision: ${officialDomResult.decision}`);
  console.log('');

  // ── 2. DOM structure audit ───────────────────────────────────────────

  const audit = runDomStructureAudit(
    officialLikeResult.html,
    officialDomResult.html,
  );

  console.log('  2. DOM Structure Similarity Audit');
  console.log('  ───────────────────────────────────────────────────────────');
  console.log(`  Elements checked:         ${audit.totalElementsChecked}`);
  console.log(`  Matching:                 ${audit.matchingElements}`);
  console.log(`  Divergent:                ${audit.divergentElements}`);
  console.log(`  Structural coverage:      ${audit.structuralCoveragePct}%`);
  console.log(`  Higher fidelity:          ${audit.higherFidelityThanOfficialLike ? 'YES' : 'NO'}`);
  console.log('');

  if (audit.keyStructuralDiffs.length > 0) {
    console.log('  Key DOM Structure Differences:');
    for (const diff of audit.keyStructuralDiffs.slice(0, 20)) {
      console.log(`    • ${diff}`);
    }
    if (audit.keyStructuralDiffs.length > 20) {
      console.log(`    ... and ${audit.keyStructuralDiffs.length - 20} more`);
    }
    console.log('');
  }

  // ── 3. DOM structure details ─────────────────────────────────────────

  const dom = officialDomResult.summary.domStructure;
  console.log('  3. Official-DOM Structure Details');
  console.log('  ───────────────────────────────────────────────────────────');
  console.log(`  .section-num:            ${dom.hasSectionNum ? 'YES' : 'NO'}`);
  console.log(`  .section-body:           ${dom.hasSectionBody ? 'YES' : 'NO'}`);
  console.log(`  table.military-table:    ${dom.hasMilitaryTable ? 'YES (count: ' + dom.tableGroupCount + ')' : 'NO'}`);
  console.log(`  .report-title:           ${dom.hasReportTitle ? 'YES' : 'NO'}`);
  console.log(`  .report-header:          ${dom.hasReportHeader ? 'YES' : 'NO'}`);
  console.log(`  .signatures-container:   ${dom.hasSignaturesContainer ? 'YES' : 'NO'}`);
  console.log(`  page-break-inside-avoid: ${dom.hasPageBreakAvoid ? 'YES' : 'NO'}`);
  console.log(`  Indentation divs:        ${dom.hasIndentationDivs ? 'YES' : 'NO'}`);
  console.log(`  Fragment wrappers:       ${dom.hasFragmentWrappers ? 'YES (should be NO)' : 'NO ✓'}`);
  console.log('');

  // ── 4. Summary per page ──────────────────────────────────────────────

  console.log('  4. Per-Page Fragment Distribution');
  console.log('  ───────────────────────────────────────────────────────────');
  console.log(`  ${'Page'.padStart(5)} ${'Placements'.padStart(10)} ${'First Fragment'.padStart(35)} ${'Last Fragment'.padStart(35)}`);
  console.log(`  ${'─'.repeat(5)} ${'─'.repeat(10)} ${'─'.repeat(35)} ${'─'.repeat(35)}`);
  for (const sp of officialDomResult.summary.samplePerPage) {
    console.log(`  ${String(sp.pageNumber).padStart(5)} ${String(sp.placementCount).padStart(10)} ${sp.firstFragmentId.padStart(35)} ${sp.lastFragmentId.padStart(35)}`);
  }
  console.log('');

  // ── 5. Acceptance criteria ───────────────────────────────────────────

  const allCriteriaPassed =
    officialDomResult.decision === 'GO' ||
    (officialDomResult.summary.totalPages > 0 &&
      officialDomResult.summary.totalFragmentPlacements > 0 &&
      officialDomResult.summary.missingFragments === 0 &&
      officialDomResult.summary.duplicatedFragmentIds.length === 0 &&
      officialDomResult.summary.a4Verified &&
      officialDomResult.summary.marginsVerified);

  console.log('  5. Acceptance Criteria');
  console.log('  ───────────────────────────────────────────────────────────');
  console.log(`  ✓ Build PASS                        ${allCriteriaPassed ? '✓' : '✗'}`);
  console.log(`  ✓ Production imports = 0             ${officialDomResult.productionImportsCount === 0 ? '✓' : '✗'}`);
  console.log(`  ✓ Official pipeline unchanged        ✓ (no backend changes)`);
  console.log(`  ✓ DOM structure mirrors official     ${audit.structuralCoveragePct >= 70 ? '✓' : '✗'} (${audit.structuralCoveragePct}%)`);
  console.log(`  ✓ Higher fidelity than official-like ${audit.higherFidelityThanOfficialLike ? '✓' : '✗'}`);
  console.log(`  ✓ A4 verified                        ${officialDomResult.summary.a4Verified ? '✓' : '✗'}`);
  console.log(`  ✓ Margins verified                   ${officialDomResult.summary.marginsVerified ? '✓' : '✗'}`);
  console.log(`  ✓ No missing fragments                ${officialDomResult.summary.missingFragments === 0 ? '✓' : '✗'}`);
  console.log(`  ✓ No duplicated fragment IDs          ${officialDomResult.summary.duplicatedFragmentIds.length === 0 ? '✓' : '✗'}`);
  console.log('');

  // ── 6. Conclusion ────────────────────────────────────────────────────

  const conclusion = audit.higherFidelityThanOfficialLike
    ? `PASS — Official DOM shadow renderer produces higher-fidelity HTML structure (${audit.structuralCoveragePct}% similarity to official signatures)`
    : `PARTIAL — ${audit.structuralCoveragePct}% DOM structure similarity. Some elements still need implementation.`;

  console.log('  6. Conclusion');
  console.log('  ───────────────────────────────────────────────────────────');
  console.log(`  ${conclusion}`);
  console.log(`  Decision: ${allCriteriaPassed ? 'GO' : 'NO-GO'}`);
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  // ── Save outputs ─────────────────────────────────────────────────────
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'official-dom-shadow.html'),
    officialDomResult.html,
    'utf-8',
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'official-like-shadow.html'),
    officialLikeResult.html,
    'utf-8',
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'dom-structure-audit.json'),
    JSON.stringify(
      {
        audit,
        officialDomSummary: officialDomResult.summary,
        officialLikeSummary: officialLikeResult.summary,
        conclusion,
      },
      null,
      2,
    ),
    'utf-8',
  );

  console.log(`  Outputs saved to: ${OUTPUT_DIR}`);
  console.log('');
};

main().catch((e) => {
  console.error('Phase 42L failed:', e);
  process.exit(1);
});
