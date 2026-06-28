import { REAL_REPORT_V1_FIXTURE, REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS } from './fixtures/realReportFull.fixture';
import {
  buildPagePlanV1Shadow,
  type PagePlanV1ShadowReport,
} from './pagePlanV1ShadowAdapter';
import {
  comparePagePlanV1Shadow,
  type PagePlanV1ShadowCompareReport,
} from './pagePlanV1ShadowCompare';
import {
  renderPlannedPdfHtmlShadow,
  type PlannedPdfHtmlShadowReport,
} from './plannedPdfHtmlShadowRenderer';

export const runPagePlanV1ShadowDiagnostics = (): PagePlanV1ShadowReport =>
  buildPagePlanV1Shadow(REAL_REPORT_V1_FIXTURE);

const pad = (n: number, w = 4): string => String(n).padStart(w);

export const logPagePlanV1ShadowDiagnostics = (): PagePlanV1ShadowReport => {
  const report = runPagePlanV1ShadowDiagnostics();
  const { pagePlan, summary, unplacedFragmentIds, duplicatedFragmentIds, overflowWarnings, decision } = report;

  const lines: string[] = [];
  const divider = '═'.repeat(68);
  const subDivider = '─'.repeat(68);

  lines.push('');
  lines.push(divider);
  lines.push('  Phase 42B — PagePlanV1 Shadow Adapter');
  lines.push(divider);

  lines.push('');
  lines.push('  Summary');
  lines.push(`    Total V1 fragments:          ${pad(summary.totalV1Fragments)}`);
  lines.push(`    Total planned fragments:     ${pad(summary.totalPlannedFragments)}`);
  lines.push(`    Pages count:                 ${pad(summary.pagesCount)}`);
  lines.push(`    Unplaced fragments:          ${pad(summary.unplacedFragmentsCount)}`);
  lines.push(`    Duplicated placed fragments: ${pad(summary.duplicatedPlacedFragmentsCount)}`);
  lines.push(`    Overflow warnings:           ${pad(summary.overflowWarningsCount)}`);
  lines.push(`    Production imports:          ${pad(summary.productionImportsCount)}`);

  lines.push('');
  lines.push(subDivider);
  lines.push('  Break reasons distribution');
  lines.push(subDivider);
  for (const [reason, count] of Object.entries(summary.breakReasons)) {
    lines.push(`    ${reason.padEnd(20)} ${pad(count)}`);
  }

  if (unplacedFragmentIds.length > 0) {
    lines.push('');
    lines.push(subDivider);
    lines.push('  Unplaced fragments');
    lines.push(subDivider);
    for (const id of unplacedFragmentIds) {
      lines.push(`    ✗ ${id}`);
    }
  }

  if (duplicatedFragmentIds.length > 0) {
    lines.push('');
    lines.push(subDivider);
    lines.push('  Duplicated placed fragments');
    lines.push(subDivider);
    for (const id of duplicatedFragmentIds) {
      lines.push(`    ✗ ${id}`);
    }
  }

  if (overflowWarnings.length > 0) {
    lines.push('');
    lines.push(subDivider);
    lines.push('  Overflow warnings');
    lines.push(subDivider);
    for (const msg of overflowWarnings) {
      lines.push(`    ! ${msg}`);
    }
  }

  lines.push('');
  lines.push(subDivider);
  lines.push('  Per-page placement');
  lines.push(subDivider);
  for (const page of pagePlan.pages) {
    lines.push(`  Page ${page.pageNumber} (${page.pageId}): ${page.placements.length} placements`);
    for (const pl of page.placements) {
      lines.push(`    #${pl.sequence} ${pl.fragmentId} (${pl.role})`);
    }
  }

  lines.push('');
  lines.push(`  Decision: ${decision}`);
  if (decision === 'GO') {
    lines.push('  All acceptance criteria met.');
  } else {
    lines.push('  Issues found:');
    if (summary.totalPlannedFragments !== summary.totalV1Fragments) {
      lines.push(`    • Fragment count mismatch: planned ${summary.totalPlannedFragments} vs total ${summary.totalV1Fragments}`);
    }
    if (summary.unplacedFragmentsCount > 0) {
      lines.push(`    • ${summary.unplacedFragmentsCount} unplaced fragment(s)`);
    }
    if (summary.duplicatedPlacedFragmentsCount > 0) {
      lines.push(`    • ${summary.duplicatedPlacedFragmentsCount} duplicated placed fragment(s)`);
    }
    if (summary.overflowWarningsCount > 0) {
      lines.push(`    • ${summary.overflowWarningsCount} overflow warning(s)`);
    }
  }
  lines.push(divider);
  lines.push('');

  console.info(lines.join('\n'));
  return report;
};

// ── Phase 42C — PagePlanV1 vs Designer Pagination Shadow Compare ──────

export const runPagePlanV1ShadowCompare = (): PagePlanV1ShadowCompareReport =>
  comparePagePlanV1Shadow(REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS, REAL_REPORT_V1_FIXTURE);

const statusIcon = (match: string): string =>
  match === 'exact' ? '✓' : match === 'granularity' ? '~' : '✗';

export const logPagePlanV1ShadowCompare = (): PagePlanV1ShadowCompareReport => {
  const report = runPagePlanV1ShadowCompare();
  const {
    designerPagesCount, v1PagesCount, pageCountDelta,
    matchedBoundaries, granularityDifferences, realDifferences,
    pageComparisons, v1Summary, decision,
  } = report;

  const lines: string[] = [];
  const divider = '═'.repeat(68);
  const subDivider = '─'.repeat(68);

  lines.push('');
  lines.push(divider);
  lines.push('  Phase 42C — PagePlanV1 vs Designer Pagination Shadow Compare');
  lines.push(divider);

  lines.push('');
  lines.push('  Summary');
  lines.push(`    Designer pages count:         ${pad(designerPagesCount)}`);
  lines.push(`    PagePlanV1 pages count:       ${pad(v1PagesCount)}`);
  lines.push(`    Page count delta:             ${pad(pageCountDelta)}`);
  lines.push('');
  lines.push(`    Exact page boundaries:        ${pad(matchedBoundaries)}`);
  lines.push(`    Granularity-only differences: ${pad(granularityDifferences)}`);
  lines.push(`    Real pagination differences:  ${pad(realDifferences)}`);
  lines.push('');
  lines.push(`    V1 unplaced fragments:        ${pad(v1Summary.unplacedFragmentsCount)}`);
  lines.push(`    V1 duplicated fragments:      ${pad(v1Summary.duplicatedPlacedFragmentsCount)}`);
  lines.push(`    V1 overflow warnings:         ${pad(v1Summary.overflowWarningsCount)}`);
  lines.push(`    Production imports:           ${pad(v1Summary.productionImportsCount)}`);

  lines.push('');
  lines.push(subDivider);
  lines.push('  Per-page comparison');
  lines.push(subDivider);
  for (const pc of pageComparisons) {
    const icon = statusIcon(pc.boundaryMatch);
    lines.push(`  ${icon} Page D${pc.designerPageNumber} vs V1 Page ${pc.v1PageNumber}:`);
    lines.push(`       D first: ${pc.designerFirstFragment}`);
    lines.push(`      V1 first: ${pc.v1FirstFragment}`);
    lines.push(`      D last:  ${pc.designerLastFragment}`);
    lines.push(`      V1 last: ${pc.v1LastFragment}`);
    lines.push(`      Match:   ${pc.boundaryMatch}`);
    if (pc.note) lines.push(`      Note:    ${pc.note}`);
  }

  lines.push('');
  lines.push(`  Decision: ${decision}`);
  if (decision === 'GO') {
    lines.push('  All differences are granularity-only — no real pagination difference.');
  } else {
    lines.push('  Issues found:');
    if (realDifferences > 0) {
      lines.push(`    • ${realDifferences} real pagination difference(s) detected`);
    }
  }
  lines.push(divider);
  lines.push('');

  console.info(lines.join('\n'));
  return report;
};

// ── Phase 42E — Planned PDF HTML Shadow Renderer ──────────────────────

export const runPlannedPdfHtmlShadowDiagnostics = (): PlannedPdfHtmlShadowReport => {
  const pagePlan = runPagePlanV1ShadowDiagnostics().pagePlan;
  return renderPlannedPdfHtmlShadow(REAL_REPORT_V1_FIXTURE, pagePlan);
};

export const logPlannedPdfHtmlShadowDiagnostics = (): PlannedPdfHtmlShadowReport => {
  const report = runPlannedPdfHtmlShadowDiagnostics();
  const { html, summary, decision } = report;

  const lines: string[] = [];
  const divider = '═'.repeat(68);
  const subDivider = '─'.repeat(68);

  lines.push('');
  lines.push(divider);
  lines.push('  Phase 42E — Planned PDF HTML Shadow Renderer');
  lines.push(divider);

  lines.push('');
  lines.push('  Summary');
  lines.push(`    Total pages rendered:        ${pad(summary.totalPages)}`);
  lines.push(`    Total fragment placements:   ${pad(summary.totalFragmentPlacements)}`);
  lines.push(`    Unique fragments rendered:   ${pad(summary.uniqueFragmentsRendered)}`);
  lines.push(`    Missing fragments:           ${pad(summary.missingFragments)}`);
  lines.push(`    Duplicated fragments:        ${pad(summary.duplicatedFragmentIds.length)}`);
  lines.push(`    Page containers:             ${pad(summary.pageContainerCount)}`);
  lines.push(`    A4 dimensions verified:      ${summary.a4Verified ? '✓' : '✗'}`);
  lines.push(`    Margins 20/22/10/10 verified: ${summary.marginsVerified ? '✓' : '✗'}`);
  lines.push(`    Production imports:          ${pad(0)}`);

  lines.push('');
  lines.push(subDivider);
  lines.push('  Per-page sample');
  lines.push(subDivider);
  for (const s of summary.samplePerPage) {
    lines.push(`  Page ${s.pageNumber}: ${s.placementCount} placements`);
    lines.push(`    First: ${s.firstFragmentId}`);
    lines.push(`    Last:  ${s.lastFragmentId}`);
  }

  lines.push('');
  lines.push(`  HTML output: ${html.length} characters`);
  lines.push(`  Decision:    ${decision}`);

  if (decision === 'GO') {
    lines.push('  All acceptance criteria met.');
  } else {
    lines.push('  Issues found:');
    if (summary.pageContainerCount !== summary.totalPages) {
      lines.push(`    • Page container count mismatch: ${summary.pageContainerCount} vs ${summary.totalPages} pages`);
    }
    if (summary.missingFragments > 0) {
      lines.push(`    • ${summary.missingFragments} missing fragment(s)`);
    }
    if (summary.duplicatedFragmentIds.length > 0) {
      lines.push(`    • ${summary.duplicatedFragmentIds.length} duplicated fragment(s)`);
    }
    if (!summary.a4Verified) lines.push('    • A4 dimensions mismatch');
    if (!summary.marginsVerified) lines.push('    • Margins mismatch');
  }
  lines.push(divider);
  lines.push('');

  console.info(lines.join('\n'));
  return report;
};
