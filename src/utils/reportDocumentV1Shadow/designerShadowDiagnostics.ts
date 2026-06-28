import {
  DESIGNER_SHADOW_FIXTURE_FRAGMENTS,
  REPORT_DOCUMENT_V1_DESIGNER_SHADOW_FIXTURE,
} from './fixtures/designerShadow.fixture';
import {
  REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS,
  REAL_REPORT_V1_FIXTURE,
} from './fixtures/realReportFull.fixture';
import {
  compareReportDocumentV1Shadow,
  type ReportDocumentV1ShadowCompareReport,
} from './reportDocumentV1ShadowAdapter';
import {
  compareStructuralShadow,
  type StructuralShadowCompareReport,
} from './structuralShadowCompare';

export const runReportDocumentV1DesignerShadowDiagnostics = (): ReportDocumentV1ShadowCompareReport =>
  compareReportDocumentV1Shadow(
    DESIGNER_SHADOW_FIXTURE_FRAGMENTS,
    REPORT_DOCUMENT_V1_DESIGNER_SHADOW_FIXTURE,
  );

export const logReportDocumentV1DesignerShadowDiagnostics = (): ReportDocumentV1ShadowCompareReport => {
  const report = runReportDocumentV1DesignerShadowDiagnostics();
  console.info('[ReportDocumentV1 Designer Shadow]', report);
  return report;
};

// ── Structural shadow compare (Phase 42A) ─────────────────────────────────

export const runStructuralShadowCompare = (): StructuralShadowCompareReport =>
  compareStructuralShadow(
    REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS,
    REAL_REPORT_V1_FIXTURE,
  );

const pad = (n: number, w = 4): string => String(n).padStart(w);

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

const statusIcon = (status: string): string =>
  status === 'match' ? '✓' : status === 'granularity' ? '~' : '✗';

export const logStructuralShadowCompare = (): StructuralShadowCompareReport => {
  const report = runStructuralShadowCompare();
  const { elements, summary, decision, reasons } = report;

  const lines: string[] = [];
  const divider = '═'.repeat(68);
  const subDivider = '─'.repeat(68);
  lines.push('');
  lines.push(divider);
  lines.push('  Phase 42A — Structural Shadow Comparator');
  lines.push(divider);

  lines.push('');
  lines.push(`  Summary`);
  lines.push(`    Total structural elements:   ${pad(summary.totalElements)}`);
  lines.push(`    Matched:                     ${pad(summary.matched)}`);
  lines.push(`    Granularity differences:     ${pad(summary.granularityDifferences)}`);
  lines.push(`    Structural differences:      ${pad(summary.structuralDifferences)}`);
  lines.push(`    Structural coverage:         ${fmtPct(summary.structuralCoverage)}`);
  lines.push(`    Designer areas present:      ${pad(summary.designerAreas)}`);
  lines.push(`    V1 areas present:            ${pad(summary.v1Areas)}`);

  lines.push('');
  lines.push(subDivider);
  lines.push('  Per-element details');
  lines.push(subDivider);

  let currentArea = '';
  for (const elem of elements) {
    if (elem.area !== currentArea) {
      currentArea = elem.area;
      lines.push(`  [${currentArea}]`);
    }
    const icon = statusIcon(elem.status);
    const dv = String(elem.designerValue).padStart(4);
    const vv = String(elem.v1Value).padStart(4);
    lines.push(`    ${icon} ${elem.label.padEnd(30)} D:${dv}  V1:${vv}  (${elem.status})`);
    if (elem.note) {
      lines.push(`         ${elem.note}`);
    }
  }

  lines.push('');
  lines.push(subDivider);
  lines.push('  Granularity differences (expected)');
  lines.push(subDivider);
  const granularityItems = elements.filter((e) => e.status === 'granularity');
  if (granularityItems.length === 0) {
    lines.push('    (none)');
  } else {
    for (const elem of granularityItems) {
      lines.push(`    ~ ${elem.label.padEnd(30)} D:${elem.designerValue} → V1:${elem.v1Value}`);
      if (elem.note) lines.push(`        ${elem.note}`);
    }
  }

  lines.push('');
  lines.push(subDivider);
  lines.push('  Structural differences (regression if unexpected)');
  lines.push(subDivider);
  const structuralItems = elements.filter((e) => e.status === 'structural-difference');
  if (structuralItems.length === 0) {
    lines.push('    (none)');
  } else {
    for (const elem of structuralItems) {
      lines.push(`    ✗ ${elem.label.padEnd(30)} D:${elem.designerValue} → V1:${elem.v1Value}`);
      if (elem.note) lines.push(`        ${elem.note}`);
    }
  }

  lines.push('');
  lines.push(`  Decision: ${decision}`);
  if (reasons.length > 0) {
    lines.push('  Reasons:');
    for (const r of reasons) lines.push(`    • ${r}`);
  } else {
    lines.push('  All structural differences are granularity — no regression found.');
  }
  lines.push(divider);
  lines.push('');

  console.info(lines.join('\n'));
  return report;
};
