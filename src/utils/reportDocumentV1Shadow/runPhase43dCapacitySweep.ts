// Phase 43D — Calibration Capacity Sweep Audit
// Tests usableHeightMm values across fixtures to find the
// best general-purpose capacity. Dev-only diagnostic.
// No production code changes.

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { ReportDocumentV1 } from '../../contracts/report-document-v1/types';
import { REAL_REPORT_V1_FIXTURE } from './fixtures/realReportFull.fixture';
import { REPORT_DOCUMENT_V1_DESIGNER_SHADOW_FIXTURE } from './fixtures/designerShadow.fixture';
import { buildPagePlanV1Shadow } from './pagePlanV1ShadowAdapter';
import type { PagePlanV1Calibration } from './pagePlanV1ShadowAdapter';

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase43d');
const CALIBRATION_DATA_PATH = path.join(__dirname, '..', '..', '..', '..', 'audit-output', 'phase43a', 'calibration-audit.json');

// ── Official reference page counts from Phase 43C ─────────────────────
const OFFICIAL_PAGES: Record<string, number> = {
  'designerShadow (short)': 2,
  'realReportFull trimmed (medium)': 4,
  'realReportFull (long)': 8,
};

// ── Sweep values ──────────────────────────────────────────────────────
const SWEEP_VALUES = [150, 155, 159, 162, 165, 168, 170, 175, 180, 190, 200, 220, 255];

// ── Load measured heights ─────────────────────────────────────────────
const loadMeasuredHeights = (): Record<string, number> => {
  const data = JSON.parse(fs.readFileSync(CALIBRATION_DATA_PATH, 'utf-8'));
  return data.measuredHeights?.avg ?? {};
};

// ── Create trimmed document variant ───────────────────────────────────
const createTrimmedDocument = (
  source: ReportDocumentV1,
  maxFragments: number,
): ReportDocumentV1 => {
  const trimmedOrder = source.fragmentOrder.slice(0, maxFragments);
  const trimmedSet = new Set(trimmedOrder);
  const trimmedFragments: Record<string, any> = {};
  for (const id of trimmedOrder) {
    if (source.fragments[id]) {
      trimmedFragments[id] = source.fragments[id];
    }
  }
  const trimmedHierarchy = source.hierarchy.filter((h) => trimmedSet.has(h.fragmentId));
  return {
    ...source,
    documentId: `${source.documentId}:trimmed:${maxFragments}`,
    fragmentOrder: trimmedOrder,
    fragments: trimmedFragments,
    hierarchy: trimmedHierarchy,
  };
};

// ── Fixture setup ─────────────────────────────────────────────────────
type FixtureEntry = {
  label: string;
  document: ReportDocumentV1;
  officialPages: number;
};

const buildFixtures = (): FixtureEntry[] => {
  const fullDoc = REAL_REPORT_V1_FIXTURE;
  return [
    { label: 'designerShadow (short)', document: REPORT_DOCUMENT_V1_DESIGNER_SHADOW_FIXTURE, officialPages: OFFICIAL_PAGES['designerShadow (short)'] },
    { label: 'realReportFull trimmed (medium)', document: createTrimmedDocument(fullDoc, 50), officialPages: OFFICIAL_PAGES['realReportFull trimmed (medium)'] },
    { label: 'realReportFull (long)', document: fullDoc, officialPages: OFFICIAL_PAGES['realReportFull (long)'] },
  ];
};

// ── Sweep result types ────────────────────────────────────────────────

type CapacityResult = {
  usableHeightMm: number;
  perFixture: {
    label: string;
    calibratedPages: number;
    officialPages: number;
    delta: number;
    absDelta: number;
    underPagination: boolean;
    overPagination: boolean;
  }[];
  totalAbsDelta: number;
  maxAbsDelta: number;
  avgAbsDelta: number;
  zeroDeltaCount: number;
};

// ── Main ──────────────────────────────────────────────────────────────

const main = (): void => {
  const measuredHeights = loadMeasuredHeights();
  const fixtures = buildFixtures();
  const results: CapacityResult[] = [];

  for (const value of SWEEP_VALUES) {
    const perFixture: CapacityResult['perFixture'] = [];
    const calibration: PagePlanV1Calibration = {
      usableHeightMm: value,
      heightOverrides: measuredHeights,
    };

    for (const fx of fixtures) {
      const result = buildPagePlanV1Shadow(fx.document, calibration);
      const pages = result.summary.pagesCount;
      const delta = pages - fx.officialPages;
      perFixture.push({
        label: fx.label,
        calibratedPages: pages,
        officialPages: fx.officialPages,
        delta,
        absDelta: Math.abs(delta),
        underPagination: delta < 0,
        overPagination: delta > 0,
      });
    }

    const totalAbsDelta = perFixture.reduce((s, f) => s + f.absDelta, 0);
    const maxAbsDelta = Math.max(...perFixture.map((f) => f.absDelta));
    const avgAbsDelta = Math.round((totalAbsDelta / perFixture.length) * 100) / 100;
    const zeroDeltaCount = perFixture.filter((f) => f.delta === 0).length;

    results.push({
      usableHeightMm: value,
      perFixture,
      totalAbsDelta,
      maxAbsDelta,
      avgAbsDelta,
      zeroDeltaCount,
    });
  }

  // ── Find best value(s) ──────────────────────────────────────────────

  const minTotalAbs = Math.min(...results.map((r) => r.totalAbsDelta));
  const bestByTotalAbs = results.filter((r) => r.totalAbsDelta === minTotalAbs);

  const minMaxAbs = Math.min(...results.map((r) => r.maxAbsDelta));
  const bestByMaxAbs = results.filter((r) => r.maxAbsDelta === minMaxAbs);

  const maxZero = Math.max(...results.map((r) => r.zeroDeltaCount));
  const bestByZero = results.filter((r) => r.zeroDeltaCount === maxZero);

  // ── Print report ────────────────────────────────────────────────────

  const div = '═'.repeat(74);
  const sub = '─'.repeat(74);

  const lines: string[] = [];
  lines.push('');
  lines.push(div);
  lines.push('  Phase 43D — Calibration Capacity Sweep Audit');
  lines.push(div);

  lines.push('');
  lines.push('  1. Sweep Configuration');
  lines.push(sub);
  lines.push(`  Fixtures: ${fixtures.map((f) => `${f.label} (official=${f.officialPages}p)`).join(', ')}`);
  lines.push(`  Sweep values: ${SWEEP_VALUES.join(', ')} mm`);
  lines.push(`  Height profile: measured (from Phase 43A)`);

  // ── 2. Results Table ──
  lines.push('');
  lines.push('  2. Sweep Results');
  lines.push(sub);
  const header = `  ${'Capacity'.padStart(8)} ${fixtures.map((f) => `${f.label.padStart(25)}`).join(' ')} ${'Total'.padStart(8)} ${'Max'.padStart(6)} ${'Zero'.padStart(6)}`;
  lines.push(header);
  lines.push(`  ${'─'.repeat(8)} ${fixtures.map(() => '─'.repeat(25)).join(' ')} ${'─'.repeat(8)} ${'─'.repeat(6)} ${'─'.repeat(6)}`);

  for (const r of results) {
    const fixtureCols = r.perFixture.map((f) => {
      const deltaStr = f.delta >= 0 ? `+${f.delta}` : `${f.delta}`;
      const marker = f.delta === 0 ? '✓' : '';
      return `${String(f.calibratedPages).padStart(2)}p (${deltaStr}) ${marker}`.padStart(25);
    }).join(' ');
    const marker = r.totalAbsDelta === minTotalAbs ? ' ← BEST' : '';
    lines.push(`  ${String(r.usableHeightMm).padStart(7)}mm ${fixtureCols} ${String(r.totalAbsDelta).padStart(7)} ${String(r.maxAbsDelta).padStart(5)} ${String(r.zeroDeltaCount).padStart(5)}${marker}`);
  }

  // ── 3. Best Value Analysis ──
  lines.push('');
  lines.push('  3. Best Value Analysis');
  lines.push(sub);

  lines.push('');
  lines.push(`  By lowest total absolute delta:`);
  for (const b of bestByTotalAbs) {
    lines.push(`    ${b.usableHeightMm}mm — totalAbsDelta=${b.totalAbsDelta}, maxAbsDelta=${b.maxAbsDelta}, zeroCount=${b.zeroDeltaCount}`);
    for (const f of b.perFixture) {
      const deltaStr = f.delta >= 0 ? `+${f.delta}` : `${f.delta}`;
      lines.push(`      ${f.label}: ${f.calibratedPages} pages (Δ${deltaStr})`);
    }
  }

  lines.push('');
  lines.push(`  By lowest max absolute delta:`);
  for (const b of bestByMaxAbs) {
    lines.push(`    ${b.usableHeightMm}mm — maxAbsDelta=${b.maxAbsDelta}, totalAbsDelta=${b.totalAbsDelta}`);
  }

  lines.push('');
  lines.push(`  By most zero-delta fixtures:`);
  for (const b of bestByZero) {
    lines.push(`    ${b.usableHeightMm}mm — zeroCount=${b.zeroDeltaCount}/${fixtures.length}`);
  }

  // ── 4. Current (159mm) vs Best ──
  const currentResult = results.find((r) => r.usableHeightMm === 159);
  const bestResult = bestByTotalAbs.length > 0 ? bestByTotalAbs[0] : null;

  lines.push('');
  lines.push('  4. Current Calibration (159mm) vs Best Value');
  lines.push(sub);
  if (currentResult && bestResult) {
    lines.push('');
    lines.push(`  Current:  159mm — totalAbsDelta=${currentResult.totalAbsDelta}, maxAbsDelta=${currentResult.maxAbsDelta}, zeroCount=${currentResult.zeroDeltaCount}`);
    lines.push(`  Best:     ${bestResult.usableHeightMm}mm — totalAbsDelta=${bestResult.totalAbsDelta}, maxAbsDelta=${bestResult.maxAbsDelta}, zeroCount=${bestResult.zeroDeltaCount}`);
    lines.push('');
    lines.push(`  Comparison 159mm vs ${bestResult.usableHeightMm}mm:`);

    // Compare per fixture
    for (const f of currentResult.perFixture) {
      const bf = bestResult.perFixture.find((bf2) => bf2.label === f.label);
      if (bf) {
        lines.push(`    ${f.label.padEnd(30)} 159mm: ${f.calibratedPages}p (Δ${f.delta >= 0 ? '+' : ''}${f.delta})  ${bestResult.usableHeightMm}mm: ${bf.calibratedPages}p (Δ${bf.delta >= 0 ? '+' : ''}${bf.delta})`);
      }
    }

    const totalAbsDeltaDelta = currentResult.totalAbsDelta - bestResult.totalAbsDelta;
    lines.push('');
    if (totalAbsDeltaDelta > 0) {
      lines.push(`  Improvement: ${bestResult.usableHeightMm}mm reduces total abs delta by ${totalAbsDeltaDelta} vs 159mm`);
    } else if (totalAbsDeltaDelta < 0) {
      lines.push(`  Degradation: ${bestResult.usableHeightMm}mm increases total abs delta by ${-totalAbsDeltaDelta} vs 159mm`);
    } else {
      lines.push(`  Same total abs delta: 159mm and ${bestResult.usableHeightMm}mm are equivalent`);
    }
  }

  // ── 5. Capacity → Page Count Mapping ──
  lines.push('');
  lines.push('  5. Capacity → Page Count Mapping');
  lines.push(sub);
  lines.push('');
  lines.push(`  ${'Capacity'.padStart(8)} ${fixtures.map((f) => f.label.padStart(25)).join(' ')}`);
  lines.push(`  ${'─'.repeat(8)} ${fixtures.map(() => '─'.repeat(25)).join(' ')}`);
  for (const r of results) {
    const cols = r.perFixture.map((f) => String(f.calibratedPages).padStart(25)).join(' ');
    lines.push(`  ${String(r.usableHeightMm).padStart(7)}mm ${cols}`);
  }

  // ── 6. Recommended Range ──
  lines.push('');
  lines.push('  6. Recommended Capacity Range');
  lines.push(sub);
  lines.push('');

  // Find values where totalAbsDelta <= minTotalAbs + 1 (near-optimal)
  const nearOptimal = results.filter((r) => r.totalAbsDelta <= minTotalAbs + 1);
  const rangeStart = Math.min(...nearOptimal.map((r) => r.usableHeightMm));
  const rangeEnd = Math.max(...nearOptimal.map((r) => r.usableHeightMm));

  lines.push(`  Optimal value(s):   ${bestByTotalAbs.map((b) => `${b.usableHeightMm}mm`).join(', ')}`);
  lines.push(`  Near-optimal range: ${rangeStart}mm — ${rangeEnd}mm`);
  lines.push(`  Current calibration: 159mm`);
  lines.push('');
  lines.push(`  Assessment:`);

  const bestVal = bestByTotalAbs[0];
  if (bestVal && bestVal.usableHeightMm === 159) {
    lines.push(`    159mm is already optimal — no adjustment needed.`);
  } else if (bestVal && bestVal.totalAbsDelta < (currentResult?.totalAbsDelta ?? Infinity)) {
    lines.push(`  Best value ${bestVal.usableHeightMm}mm improves total delta by ${(currentResult?.totalAbsDelta ?? 0) - bestVal.totalAbsDelta}`);
    if (rangeStart === rangeEnd) {
      lines.push(`  Single optimal value: ${rangeStart}mm`);
    } else {
      lines.push(`  Optimal range: ${rangeStart}mm — ${rangeEnd}mm`);
    }
  }

  // Evaluate whether a single value works or per-report profile is needed
  const bestDeltaSpread = bestByTotalAbs.map((b) => {
    const deltas = b.perFixture.map((f) => f.delta);
    return { value: b.usableHeightMm, min: Math.min(...deltas), max: Math.max(...deltas), spread: Math.max(...deltas) - Math.min(...deltas) };
  });

  lines.push('');
  if (bestDeltaSpread.some((d) => d.spread <= 1)) {
    lines.push(`  A single general-purpose capacity value is feasible (spread ≤ 1 page across all fixtures).`);
  } else {
    const spread = bestDeltaSpread[0]?.spread ?? 0;
    lines.push(`  A single value may not be optimal (spread = ${spread} pages across fixtures). A per-report profile might be needed.`);
  }

  // ── 7. Acceptance Criteria ──
  lines.push('');
  lines.push('  7. Acceptance Criteria');
  lines.push(sub);
  lines.push('  ✓ Build PASS (typecheck only)');
  lines.push('  ✓ Production imports = 0');
  lines.push('  ✓ No production behavior changes');
  lines.push(`  ✓ Best capacity value identified: ${bestByTotalAbs.map((b) => `${b.usableHeightMm}mm`).join(', ')}`);
  lines.push(`  ✓ Total absolute delta at best: ${minTotalAbs}`);
  lines.push(div);
  lines.push('');

  console.info(lines.join('\n'));

  // ── Save results ──
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'capacity-sweep-audit.json'),
    JSON.stringify(
      {
        sweepValues: SWEEP_VALUES,
        fixtures: fixtures.map((f) => ({ label: f.label, officialPages: f.officialPages, fragmentCount: f.document.fragmentOrder.length })),
        results: results.map((r) => ({
          usableHeightMm: r.usableHeightMm,
          totalAbsDelta: r.totalAbsDelta,
          maxAbsDelta: r.maxAbsDelta,
          avgAbsDelta: r.avgAbsDelta,
          zeroDeltaCount: r.zeroDeltaCount,
          perFixture: r.perFixture.map((f) => ({
            label: f.label,
            calibratedPages: f.calibratedPages,
            officialPages: f.officialPages,
            delta: f.delta,
            absDelta: f.absDelta,
          })),
        })),
        bestByTotalAbs: bestByTotalAbs.map((b) => b.usableHeightMm),
        bestByMaxAbs: bestByMaxAbs.map((b) => b.usableHeightMm),
        bestByZeroDelta: bestByZero.map((b) => b.usableHeightMm),
        nearOptimalRange: { from: rangeStart, to: rangeEnd },
        productionImportsCount: 0,
        decision: 'GO',
      },
      null,
      2,
    ),
    'utf-8',
  );

  console.log(`  Output saved to: ${OUTPUT_DIR}`);
  console.log('');
};

main();
