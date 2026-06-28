import { compareStructuralShadow } from '../structuralShadowCompare';
import {
  REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS,
  REAL_REPORT_V1_FIXTURE,
} from './realReportFull.fixture';

const report = compareStructuralShadow(
  REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS,
  REAL_REPORT_V1_FIXTURE,
);

const { elements, summary, decision, reasons } = report;

const KV = (k: string, v: unknown) => `  ${k.padEnd(42)} ${v}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const icon = (s: string) => s === 'match' ? '✓' : s === 'granularity' ? '~' : '✗';

console.log('');
console.log('='.repeat(70));
console.log('  Phase 42A — Structural Shadow Comparator');
console.log('='.repeat(70));

console.log('');
console.log('── Summary ──');
console.log(KV('Total elements', summary.totalElements));
console.log(KV('Matched', summary.matched));
console.log(KV('Granularity differences', summary.granularityDifferences));
console.log(KV('Structural differences', summary.structuralDifferences));
console.log(KV('Structural coverage', fmtPct(summary.structuralCoverage)));

console.log('');
console.log('── Per-element ──');
let ca = '';
for (const e of elements) {
  if (e.area !== ca) { ca = e.area; console.log(`  [${ca}]`); }
  console.log(`    ${icon(e.status)} ${e.label.padEnd(32)} D:${String(e.designerValue).padStart(4)}  V1:${String(e.v1Value).padStart(4)}  (${e.status})`);
  if (e.note) console.log(`         ${e.note}`);
}

console.log('');
console.log('── Granularity (expected) ──');
const g = elements.filter(e => e.status === 'granularity');
if (g.length) for (const e of g) console.log(`    ~ ${e.label.padEnd(32)} D:${e.designerValue} → V1:${e.v1Value}`);
else console.log('    (none)');

console.log('');
console.log('── Structural differences ──');
const s = elements.filter(e => e.status === 'structural-difference');
if (s.length) for (const e of s) console.log(`    ✗ ${e.label.padEnd(32)} D:${e.designerValue} → V1:${e.v1Value}  ${e.note ?? ''}`);
else console.log('    (none)');

console.log('');
console.log(`  Decision: ${decision}`);
if (reasons.length) { console.log('  Reasons:'); for (const r of reasons) console.log(`    • ${r}`); }
else console.log('  All differences are granularity — no regression.');
console.log('='.repeat(70));
console.log('');

console.log('---JSON_START---');
console.log(JSON.stringify({ summary, structuralDifferences: elements.filter(e => e.status === 'structural-difference').map(e => ({ id: e.id, label: e.label, designerValue: e.designerValue, v1Value: e.v1Value, note: e.note })), granularityDifferences: elements.filter(e => e.status === 'granularity').map(e => ({ id: e.id, label: e.label, designerValue: e.designerValue, v1Value: e.v1Value })), decision, reasons }));
console.log('---JSON_END---');
