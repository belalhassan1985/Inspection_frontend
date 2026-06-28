import type { ReportDocumentV1, ReportFragmentV1 } from '../../../contracts/report-document-v1/types';
import type { Fragment as DesignerFragment } from '../../reportFragments';

const flowDefaults = { keepTogether: false, keepWithNext: false, repeatHeader: false } as const;

// ── Helper: create a V1 fragment ──────────────────────────────────────────
const v1frag = (
  id: string,
  kind: ReportFragmentV1['kind'],
  parentId?: string,
  sourceId?: string,
): ReportFragmentV1 => ({
  id,
  kind,
  parentId,
  sourceRef: { sourceType: 'fixture', sourceId: sourceId ?? id, sourcePath: `$.fixture.${id}` },
  content: { fixture: true },
  visible: true,
  layoutDefaults: flowDefaults,
});

// ── V1 fragmentOrder & fragments ──────────────────────────────────────────
const V1_ORDER: string[] = [];
const V1_FRAGMENTS: Record<string, ReportFragmentV1> = {};

const addV1 = (id: string, kind: ReportFragmentV1['kind'], parentId?: string, sourceId?: string): void => {
  V1_ORDER.push(id);
  V1_FRAGMENTS[id] = v1frag(id, kind, parentId, sourceId);
};

// Helper: bulk-add table rows
const addV1Rows = (ids: string[], parentId: string): void => {
  ids.forEach((id) => addV1(id, 'tableRow', parentId));
};

const addV1FindingItems = (ids: string[], parentId: string): void => {
  ids.forEach((id) => addV1(id, 'findingItem', parentId));
};

const addV1NoteItems = (ids: string[], parentId: string): void => {
  ids.forEach((id) => addV1(id, 'noteItem', parentId));
};

const addV1RecItems = (ids: string[], parentId: string): void => {
  ids.forEach((id) => addV1(id, 'recommendationItem', parentId));
};

const addV1Paragraphs = (ids: string[], parentId: string): void => {
  ids.forEach((id) => addV1(id, 'appendixParagraph', parentId));
};

// ================================================================
// 1. INTRODUCTION
// ================================================================
addV1('report:header', 'reportHeader');
addV1('report:title', 'reportTitle');
addV1('introduction:assignment', 'assignment');
addV1('introduction:committee', 'committee');
addV1('introduction:purpose', 'purpose');
addV1('introduction:visit-date', 'visitDate');

// ================================================================
// 2. SUMMARY TABLE — 8 positions → 1 title + 1 header + 8 rows
// ================================================================
addV1('table:summary:title', 'tableTitle');
addV1('table:summary:header', 'tableHeader', 'table:summary:title');
addV1Rows([
  'table:summary:row:0',
  'table:summary:row:1',
  'table:summary:row:2',
  'table:summary:row:3',
  'table:summary:row:4',
  'table:summary:row:5',
  'table:summary:row:6',
  'table:summary:row:7',
], 'table:summary:title');

// ================================================================
// 3. INSPECTION DETAILS TITLE
// ================================================================
addV1('inspection-details:title', 'sectionTitle');

// ================================================================
// 4. SECTION — الموارد البشرية
// ================================================================
addV1('section:hr:title', 'sectionTitle', 'inspection-details:title');
addV1('section:hr:narrative', 'sectionNarrative', 'section:hr:title');

// Section-level finding lists: positives (3 items), negatives (2 items)
addV1('section:hr:findings:positives:title', 'findingGroupTitle', 'section:hr:title');
addV1FindingItems([
  'section:hr:finding:positives:0',
  'section:hr:finding:positives:1',
  'section:hr:finding:positives:2',
], 'section:hr:findings:positives:title');

addV1('section:hr:findings:negatives:title', 'findingGroupTitle', 'section:hr:title');
addV1FindingItems([
  'section:hr:finding:negatives:0',
  'section:hr:finding:negatives:1',
], 'section:hr:findings:negatives:title');

// ── Subsection 4.1 — شعبة التخطيط ─────────────────────────────────
addV1('subsection:planning:title', 'subsectionTitle', 'section:hr:title');

// Officer info → 4 tableRow (rank, fullName, statisticalNumber, joinedDate)
addV1Rows([
  'subsection:planning:officer:rank',
  'subsection:planning:officer:fullName',
  'subsection:planning:officer:statisticalNumber',
  'subsection:planning:officer:joinedDate',
], 'subsection:planning:title');

// General findings: 3 items
addV1('subsection:planning:findings:general:title', 'findingGroupTitle', 'subsection:planning:title');
addV1FindingItems([
  'subsection:planning:finding:general:0',
  'subsection:planning:finding:general:1',
  'subsection:planning:finding:general:2',
], 'subsection:planning:findings:general:title');

// Subsection narrative
addV1('subsection:planning:narrative', 'subsectionNarrative', 'subsection:planning:title');

// Finding lists: positives (3), impediments (2)
addV1('subsection:planning:findings:positives:title', 'findingGroupTitle', 'subsection:planning:title');
addV1FindingItems([
  'subsection:planning:finding:positives:0',
  'subsection:planning:finding:positives:1',
  'subsection:planning:finding:positives:2',
], 'subsection:planning:findings:positives:title');

addV1('subsection:planning:findings:impediments:title', 'findingGroupTitle', 'subsection:planning:title');
addV1FindingItems([
  'subsection:planning:finding:impediments:0',
  'subsection:planning:finding:impediments:1',
], 'subsection:planning:findings:impediments:title');

// Detailed table — 1 table × 5 rows
addV1('table:detailed:planning:title', 'tableTitle', 'subsection:planning:title');
addV1('table:detailed:planning:header', 'tableHeader', 'table:detailed:planning:title');
addV1Rows([
  'table:detailed:planning:row:0',
  'table:detailed:planning:row:1',
  'table:detailed:planning:row:2',
  'table:detailed:planning:row:3',
  'table:detailed:planning:row:4',
], 'table:detailed:planning:title');

// ── Subsection 4.2 — شعبة العمليات ────────────────────────────────
addV1('subsection:operations:title', 'subsectionTitle', 'section:hr:title');

// Officer info → 3 tableRow
addV1Rows([
  'subsection:operations:officer:rank',
  'subsection:operations:officer:fullName',
  'subsection:operations:officer:statisticalNumber',
], 'subsection:operations:title');

// General findings: 2 items
addV1('subsection:operations:findings:general:title', 'findingGroupTitle', 'subsection:operations:title');
addV1FindingItems([
  'subsection:operations:finding:general:0',
  'subsection:operations:finding:general:1',
], 'subsection:operations:findings:general:title');

// Finding lists: negatives (2)
addV1('subsection:operations:findings:negatives:title', 'findingGroupTitle', 'subsection:operations:title');
addV1FindingItems([
  'subsection:operations:finding:negatives:0',
  'subsection:operations:finding:negatives:1',
], 'subsection:operations:findings:negatives:title');

// Detailed tables — 2 tables, each with 4 rows
addV1('table:detailed:ops-1:title', 'tableTitle', 'subsection:operations:title');
addV1('table:detailed:ops-1:header', 'tableHeader', 'table:detailed:ops-1:title');
addV1Rows([
  'table:detailed:ops-1:row:0',
  'table:detailed:ops-1:row:1',
  'table:detailed:ops-1:row:2',
  'table:detailed:ops-1:row:3',
], 'table:detailed:ops-1:title');

addV1('table:detailed:ops-2:title', 'tableTitle', 'subsection:operations:title');
addV1('table:detailed:ops-2:header', 'tableHeader', 'table:detailed:ops-2:title');
addV1Rows([
  'table:detailed:ops-2:row:0',
  'table:detailed:ops-2:row:1',
  'table:detailed:ops-2:row:2',
  'table:detailed:ops-2:row:3',
], 'table:detailed:ops-2:title');

// ================================================================
// 5. SECTION — التدريب والتأهيل
// ================================================================
addV1('section:training:title', 'sectionTitle', 'inspection-details:title');
addV1('section:training:narrative', 'sectionNarrative', 'section:training:title');

// Section-level finding lists: impediments (3)
addV1('section:training:findings:impediments:title', 'findingGroupTitle', 'section:training:title');
addV1FindingItems([
  'section:training:finding:impediments:0',
  'section:training:finding:impediments:1',
  'section:training:finding:impediments:2',
], 'section:training:findings:impediments:title');

// ── Subsection 5.1 — شعبة التدريب ──────────────────────────────────
addV1('subsection:training:title', 'subsectionTitle', 'section:training:title');

// Officer info → 4 tableRow
addV1Rows([
  'subsection:training:officer:rank',
  'subsection:training:officer:fullName',
  'subsection:training:officer:statisticalNumber',
  'subsection:training:officer:joinedDate',
], 'subsection:training:title');

// General findings: 1 item
addV1('subsection:training:findings:general:title', 'findingGroupTitle', 'subsection:training:title');
addV1FindingItems([
  'subsection:training:finding:general:0',
], 'subsection:training:findings:general:title');

addV1('subsection:training:narrative', 'subsectionNarrative', 'subsection:training:title');

// Finding lists: positives (2), obstacles (2)
addV1('subsection:training:findings:positives:title', 'findingGroupTitle', 'subsection:training:title');
addV1FindingItems([
  'subsection:training:finding:positives:0',
  'subsection:training:finding:positives:1',
], 'subsection:training:findings:positives:title');

addV1('subsection:training:findings:obstacles:title', 'findingGroupTitle', 'subsection:training:title');
addV1FindingItems([
  'subsection:training:finding:obstacles:0',
  'subsection:training:finding:obstacles:1',
], 'subsection:training:findings:obstacles:title');

// ================================================================
// 6. OFFICIAL NOTES
// ================================================================
addV1('official-notes:title', 'officialNotesTitle');

addV1('official-notes:positives:title', 'noteCategoryTitle', 'official-notes:title');
addV1NoteItems([
  'official-notes:positives:item:0',
  'official-notes:positives:item:1',
  'official-notes:positives:item:2',
], 'official-notes:positives:title');

addV1('official-notes:negatives:title', 'noteCategoryTitle', 'official-notes:title');
addV1NoteItems([
  'official-notes:negatives:item:0',
  'official-notes:negatives:item:1',
  'official-notes:negatives:item:2',
  'official-notes:negatives:item:3',
], 'official-notes:negatives:title');

addV1('official-notes:impediments:title', 'noteCategoryTitle', 'official-notes:title');
addV1NoteItems([
  'official-notes:impediments:item:0',
  'official-notes:impediments:item:1',
], 'official-notes:impediments:title');

addV1('official-notes:obstacles:title', 'noteCategoryTitle', 'official-notes:title');
addV1NoteItems([
  'official-notes:obstacles:item:0',
], 'official-notes:obstacles:title');

// ================================================================
// 7. RECOMMENDATIONS
// ================================================================
addV1('recommendations:title', 'recommendationsTitle');

// Group 1 — Ministry of Interior — 3 items
addV1('recommendation-group:moi:title', 'recommendationGroupTitle', 'recommendations:title');
addV1RecItems([
  'recommendation-group:moi:item:0',
  'recommendation-group:moi:item:1',
  'recommendation-group:moi:item:2',
], 'recommendation-group:moi:title');

// Group 2 — Governorate — 4 items
addV1('recommendation-group:gov:title', 'recommendationGroupTitle', 'recommendations:title');
addV1RecItems([
  'recommendation-group:gov:item:0',
  'recommendation-group:gov:item:1',
  'recommendation-group:gov:item:2',
  'recommendation-group:gov:item:3',
], 'recommendation-group:gov:title');

// Group 3 — Police Directorate — 2 items
addV1('recommendation-group:police:title', 'recommendationGroupTitle', 'recommendations:title');
addV1RecItems([
  'recommendation-group:police:item:0',
  'recommendation-group:police:item:1',
], 'recommendation-group:police:title');

// ================================================================
// 8. APPENDICES
// ================================================================
addV1('appendices:title', 'appendicesTitle');

// Appendix A — 3 paragraphs
addV1('appendix:a:title', 'appendixTitle', 'appendices:title');
addV1Paragraphs([
  'appendix:a:paragraph:0',
  'appendix:a:paragraph:1',
  'appendix:a:paragraph:2',
], 'appendix:a:title');

// Appendix B — 2 paragraphs
addV1('appendix:b:title', 'appendixTitle', 'appendices:title');
addV1Paragraphs([
  'appendix:b:paragraph:0',
  'appendix:b:paragraph:1',
], 'appendix:b:title');

// ================================================================
// 9. CLOSING
// ================================================================
addV1('final-evaluation', 'finalEvaluation');
addV1('signatures', 'signatures');

// ================================================================
// BUILD V1 DOCUMENT
// ================================================================
const V1_HIERARCHY = V1_ORDER.map((fragmentId) => ({
  fragmentId,
  parentFragmentId: V1_FRAGMENTS[fragmentId].parentId,
  childFragmentIds: V1_ORDER.filter((candidateId) => V1_FRAGMENTS[candidateId].parentId === fragmentId),
}));

export const REAL_REPORT_V1_FIXTURE: ReportDocumentV1 = {
  schemaVersion: 1,
  documentId: 'fixture:real-report-full',
  campaignId: 'fixture-campaign',
  revision: 1,
  contentHash: 'fixture-only-not-for-production',
  generatedAt: '2026-06-27T00:00:00.000Z',
  locale: 'ar-IQ',
  direction: 'rtl',
  metadata: { fixture: true, description: 'Full real report with all major areas (sections, subsections, tables, findings, notes, recommendations, appendices, signatures)' },
  layoutProfile: {
    profileId: 'fixture-a4',
    pageSize: 'A4',
    widthMm: 210,
    heightMm: 297,
    marginsMm: { top: 20, right: 10, bottom: 22, left: 10 },
    locale: 'ar-IQ',
    direction: 'rtl',
    measurementUnit: 'mm',
    fontMetricsVersion: 'fixture',
  },
  styleTokens: {
    profileId: 'fixture-style',
    fontFamily: 'Cairo',
    fallbackFontFamilies: ['Arial'],
    baseFontSizePx: 14,
    lineHeight: 1.6,
    colors: {},
    fontSizesPx: {},
    spacingPx: {},
    table: { borderColor: '#000000', borderWidthPx: 1, headerBackgroundColor: '#ffffff', cellPaddingPx: 6 },
  },
  assets: [],
  fragmentOrder: V1_ORDER,
  fragments: V1_FRAGMENTS,
  hierarchy: V1_HIERARCHY,
};

// ================================================================
// DESIGNER FRAGMENTS
// ================================================================
const D = (id: string, kind: DesignerFragment['kind'], title: string, atomicity: 'atomic' | 'splittable' = 'atomic'): DesignerFragment => ({
  id, kind, title, atomicity, data: { fixture: true },
});

export const REAL_REPORT_DESIGNER_FIXTURE_FRAGMENTS: readonly DesignerFragment[] = [
  // ── Introduction ──────────────────────────────────────────────
  D('frag-report-header', 'reportHeader', 'رأس التقرير'),
  D('frag-report-title', 'reportTitle', 'عنوان التقرير'),
  D('frag-assignment', 'assignment', 'التكليف'),
  D('frag-committee', 'committee', 'التأليف'),
  D('frag-purpose', 'purpose', 'الغاية'),
  D('frag-visit-date', 'visitDate', 'تاريخ التفتيش'),

  // ── Summary table: title + header + 8 rows ──────────────────
  D('frag-summary-tables-title', 'summaryTableTitle', 'جدول المدراء والآمرين'),
  D('frag-summary-tables-header', 'summaryTableHeader', 'رأس الجدول'),
  D('frag-summary-tables-row-0', 'summaryTableRow', 'صف 1'),
  D('frag-summary-tables-row-1', 'summaryTableRow', 'صف 2'),
  D('frag-summary-tables-row-2', 'summaryTableRow', 'صف 3'),
  D('frag-summary-tables-row-3', 'summaryTableRow', 'صف 4'),
  D('frag-summary-tables-row-4', 'summaryTableRow', 'صف 5'),
  D('frag-summary-tables-row-5', 'summaryTableRow', 'صف 6'),
  D('frag-summary-tables-row-6', 'summaryTableRow', 'صف 7'),
  D('frag-summary-tables-row-7', 'summaryTableRow', 'صف 8'),

  // ── Section: تفاصيل التفتيش ─────────────────────────────────
  D('frag-inspection-details-title', 'sectionTitle', 'تفاصيل التفتيش'),

  // ── Section: الموارد البشرية ─────────────────────────────────
  D('sec-0-title', 'sectionTitle', 'الموارد البشرية'),
  D('sec-0-narrative', 'narrative', 'سرد: الموارد البشرية'),

  // Section-level finding lists: positives × 3, negatives × 2
  D('sec-0-list-positives-title', 'findingListTitle', 'الإيجابيات وعوامل القوة العامة'),
  D('sec-0-list-positives-item-0', 'findingListItem', 'إيجابية 1'),
  D('sec-0-list-positives-item-1', 'findingListItem', 'إيجابية 2'),
  D('sec-0-list-positives-item-2', 'findingListItem', 'إيجابية 3'),
  D('sec-0-list-negatives-title', 'findingListTitle', 'السلبيات ونقاط التقصير العامة'),
  D('sec-0-list-negatives-item-0', 'findingListItem', 'سلبية 1'),
  D('sec-0-list-negatives-item-1', 'findingListItem', 'سلبية 2'),

  // ── Subsection: شعبة التخطيط ─────────────────────────────────
  D('sec-0-sub-0-title', 'subsectionTitle', 'شعبة التخطيط'),

  // Officer info → inspectionDetailItem × 4
  D('sec-0-sub-0-officer-0', 'inspectionDetailItem', 'تفاصيل: شعبة التخطيط'),
  D('sec-0-sub-0-officer-1', 'inspectionDetailItem', 'تفاصيل: شعبة التخطيط'),
  D('sec-0-sub-0-officer-2', 'inspectionDetailItem', 'تفاصيل: شعبة التخطيط'),
  D('sec-0-sub-0-officer-3', 'inspectionDetailItem', 'تفاصيل: شعبة التخطيط'),

  // General findings × 3
  D('sec-0-sub-0-finding-0', 'inspectionDetailItem', 'مكتشفات: شعبة التخطيط'),
  D('sec-0-sub-0-finding-1', 'inspectionDetailItem', 'مكتشفات: شعبة التخطيط'),
  D('sec-0-sub-0-finding-2', 'inspectionDetailItem', 'مكتشفات: شعبة التخطيط'),

  D('sec-0-sub-0-narrative', 'narrative', 'سرد فرعي: شعبة التخطيط'),

  // Subsection-level finding lists: positives × 3, impediments × 2
  D('sec-0-sub-0-list-positives-title', 'findingListTitle', 'الإيجابيات وعوامل القوة المرصودة'),
  D('sec-0-sub-0-list-positives-item-0', 'findingListItem', 'إيجابية فرعية 1'),
  D('sec-0-sub-0-list-positives-item-1', 'findingListItem', 'إيجابية فرعية 2'),
  D('sec-0-sub-0-list-positives-item-2', 'findingListItem', 'إيجابية فرعية 3'),
  D('sec-0-sub-0-list-impediments-title', 'findingListTitle', 'المعوقات العامة'),
  D('sec-0-sub-0-list-impediments-item-0', 'findingListItem', 'معوق 1'),
  D('sec-0-sub-0-list-impediments-item-1', 'findingListItem', 'معوق 2'),

  // Detailed table (all tables bundled into one fragment)
  D('sec-0-sub-0-tables', 'detailedTables', 'جداول تفصيلية: شعبة التخطيط'),

  // ── Subsection: شعبة العمليات ────────────────────────────────
  D('sec-0-sub-1-title', 'subsectionTitle', 'شعبة العمليات'),

  // Officer info → inspectionDetailItem × 3
  D('sec-0-sub-1-officer-0', 'inspectionDetailItem', 'تفاصيل: شعبة العمليات'),
  D('sec-0-sub-1-officer-1', 'inspectionDetailItem', 'تفاصيل: شعبة العمليات'),
  D('sec-0-sub-1-officer-2', 'inspectionDetailItem', 'تفاصيل: شعبة العمليات'),

  // General findings × 2
  D('sec-0-sub-1-finding-0', 'inspectionDetailItem', 'مكتشفات: شعبة العمليات'),
  D('sec-0-sub-1-finding-1', 'inspectionDetailItem', 'مكتشفات: شعبة العمليات'),

  // Finding lists: negatives × 2
  D('sec-0-sub-1-list-negatives-title', 'findingListTitle', 'السلبيات ونقاط التقصير الإداري والتنظيمي'),
  D('sec-0-sub-1-list-negatives-item-0', 'findingListItem', 'سلبية فرعية 1'),
  D('sec-0-sub-1-list-negatives-item-1', 'findingListItem', 'سلبية فرعية 2'),

  // Detailed table (all tables bundled into one fragment)
  D('sec-0-sub-1-tables', 'detailedTables', 'جداول تفصيلية: شعبة العمليات'),

  // ── Section: التدريب والتأهيل ────────────────────────────────
  D('sec-1-title', 'sectionTitle', 'التدريب والتأهيل'),
  D('sec-1-narrative', 'narrative', 'سرد: التدريب والتأهيل'),

  // Section-level finding lists: impediments × 3
  D('sec-1-list-impediments-title', 'findingListTitle', 'المعوقات العامة'),
  D('sec-1-list-impediments-item-0', 'findingListItem', 'معوق تدريبي 1'),
  D('sec-1-list-impediments-item-1', 'findingListItem', 'معوق تدريبي 2'),
  D('sec-1-list-impediments-item-2', 'findingListItem', 'معوق تدريبي 3'),

  // ── Subsection: شعبة التدريب ──────────────────────────────────
  D('sec-1-sub-0-title', 'subsectionTitle', 'شعبة التدريب'),

  // Officer info → inspectionDetailItem × 4
  D('sec-1-sub-0-officer-0', 'inspectionDetailItem', 'تفاصيل: شعبة التدريب'),
  D('sec-1-sub-0-officer-1', 'inspectionDetailItem', 'تفاصيل: شعبة التدريب'),
  D('sec-1-sub-0-officer-2', 'inspectionDetailItem', 'تفاصيل: شعبة التدريب'),
  D('sec-1-sub-0-officer-3', 'inspectionDetailItem', 'تفاصيل: شعبة التدريب'),

  // General findings × 1
  D('sec-1-sub-0-finding-0', 'inspectionDetailItem', 'مكتشفات: شعبة التدريب'),

  D('sec-1-sub-0-narrative', 'narrative', 'سرد فرعي: شعبة التدريب'),

  // Finding lists: positives × 2, obstacles × 2
  D('sec-1-sub-0-list-positives-title', 'findingListTitle', 'الإيجابيات وعوامل القوة المرصودة'),
  D('sec-1-sub-0-list-positives-item-0', 'findingListItem', 'إيجابية تدريب 1'),
  D('sec-1-sub-0-list-positives-item-1', 'findingListItem', 'إيجابية تدريب 2'),
  D('sec-1-sub-0-list-obstacles-title', 'findingListTitle', 'المعاضل والمشاكل الهيكلية'),
  D('sec-1-sub-0-list-obstacles-item-0', 'findingListItem', 'معضل تدريبي 1'),
  D('sec-1-sub-0-list-obstacles-item-1', 'findingListItem', 'معضل تدريبي 2'),

  // ── Official Notes ──────────────────────────────────────────
  D('frag-official-notes-title', 'officialNotesTitle', 'الملاحظات'),

  D('frag-official-notes-positives-title', 'notesCategoryTitle', 'الإيجابيات'),
  D('frag-official-notes-positives-item-0', 'noteItem', 'ملاحظة إيجابية 1'),
  D('frag-official-notes-positives-item-1', 'noteItem', 'ملاحظة إيجابية 2'),
  D('frag-official-notes-positives-item-2', 'noteItem', 'ملاحظة إيجابية 3'),

  D('frag-official-notes-negatives-title', 'notesCategoryTitle', 'السلبيات'),
  D('frag-official-notes-negatives-item-0', 'noteItem', 'ملاحظة سلبية 1'),
  D('frag-official-notes-negatives-item-1', 'noteItem', 'ملاحظة سلبية 2'),
  D('frag-official-notes-negatives-item-2', 'noteItem', 'ملاحظة سلبية 3'),
  D('frag-official-notes-negatives-item-3', 'noteItem', 'ملاحظة سلبية 4'),

  D('frag-official-notes-impediments-title', 'notesCategoryTitle', 'المعوقات'),
  D('frag-official-notes-impediments-item-0', 'noteItem', 'معوق 1'),
  D('frag-official-notes-impediments-item-1', 'noteItem', 'معوق 2'),

  D('frag-official-notes-obstacles-title', 'notesCategoryTitle', 'المعاضل'),
  D('frag-official-notes-obstacles-item-0', 'noteItem', 'معضل 1'),

  // ── Recommendations ──────────────────────────────────────────
  D('frag-recommendations-title', 'recommendationsTitle', 'التوصيات'),

  D('frag-recommendations-group-moi-title', 'recommendationAuthorityTitle', 'وزارة الداخلية'),
  D('frag-recommendations-group-moi-item-0', 'recommendationItem', 'توصية 1'),
  D('frag-recommendations-group-moi-item-1', 'recommendationItem', 'توصية 2'),
  D('frag-recommendations-group-moi-item-2', 'recommendationItem', 'توصية 3'),

  D('frag-recommendations-group-gov-title', 'recommendationAuthorityTitle', 'محافظة'),
  D('frag-recommendations-group-gov-item-0', 'recommendationItem', 'توصية المحافظة 1'),
  D('frag-recommendations-group-gov-item-1', 'recommendationItem', 'توصية المحافظة 2'),
  D('frag-recommendations-group-gov-item-2', 'recommendationItem', 'توصية المحافظة 3'),
  D('frag-recommendations-group-gov-item-3', 'recommendationItem', 'توصية المحافظة 4'),

  D('frag-recommendations-group-police-title', 'recommendationAuthorityTitle', 'مديرية الشرطة'),
  D('frag-recommendations-group-police-item-0', 'recommendationItem', 'توصية الشرطة 1'),
  D('frag-recommendations-group-police-item-1', 'recommendationItem', 'توصية الشرطة 2'),

  // ── Appendices ──────────────────────────────────────────────
  D('frag-appendices-title', 'appendicesTitle', 'الملاحق'),

  D('frag-appendix-a-title', 'appendixTitle', 'ملحق (أ)'),
  D('frag-appendix-a-paragraph-0', 'appendixParagraph', 'نص ملحق (أ)'),
  D('frag-appendix-a-paragraph-1', 'appendixParagraph', 'نص ملحق (أ)'),
  D('frag-appendix-a-paragraph-2', 'appendixParagraph', 'نص ملحق (أ)'),

  D('frag-appendix-b-title', 'appendixTitle', 'ملحق (ب)'),
  D('frag-appendix-b-paragraph-0', 'appendixParagraph', 'نص ملحق (ب)'),
  D('frag-appendix-b-paragraph-1', 'appendixParagraph', 'نص ملحق (ب)'),

  // ── Closing ──────────────────────────────────────────────────
  D('frag-final-evaluation', 'finalEvaluation', 'التقييم النهائي'),
  D('frag-signatures', 'signatures', 'التوقيعات'),
];
