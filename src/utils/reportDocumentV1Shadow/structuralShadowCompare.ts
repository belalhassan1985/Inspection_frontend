import type {
  FragmentKind as ReportDocumentFragmentKind,
  ReportDocumentV1,
} from '../../contracts/report-document-v1/types';
import type {
  Fragment as DesignerFragment,
} from '../reportFragments';

// ── "logical element" model ────────────────────────────────────────────────
// A logical element is a semantic unit of the report, not a fragment kind.
// Multiple fragment kinds may map to the same logical element.
// Multiple fragments of different granularity may represent the same count.

type ElementStatus = 'match' | 'granularity' | 'structural-difference';

type StructureElement = {
  readonly id: string;
  readonly area: string;
  readonly label: string;
  readonly nature: 'boolean' | 'count';
  readonly designerValue: number;
  readonly v1Value: number;
  readonly status: ElementStatus;
  readonly note?: string;
};

export type StructuralShadowCompareReport = {
  readonly elements: readonly StructureElement[];
  readonly summary: {
    readonly totalElements: number;
    readonly matched: number;
    readonly granularityDifferences: number;
    readonly structuralDifferences: number;
    readonly structuralCoverage: number;
    readonly designerAreas: number;
    readonly v1Areas: number;
  };
  readonly decision: 'GO' | 'NO-GO';
  readonly reasons: readonly string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

const boolCount = (condition: boolean): number => condition ? 1 : 0;

const classify = (
  designerValue: number,
  v1Value: number,
  nature: 'boolean' | 'count',
): { status: ElementStatus; note?: string } => {
  if (nature === 'boolean') {
    if (designerValue === v1Value) return { status: 'match' };
    if ((designerValue > 0) !== (v1Value > 0)) return { status: 'structural-difference', note: `${designerValue > 0 ? 'Designer' : 'V1'} has this element but ${v1Value > 0 ? 'Designer' : 'V1'} does not` };
    return { status: 'match' };
  }

  if (designerValue === v1Value) return { status: 'match' };

  // Count mismatch — classify as granularity (expected due to V1 splitting)
  // unless one side is zero and the other is positive
  if (designerValue === 0 || v1Value === 0) {
    return {
      status: 'structural-difference',
      note: `${designerValue === 0 ? 'Designer' : 'V1'} count is 0 while ${v1Value === 0 ? 'Designer' : 'V1'} has ${Math.max(designerValue, v1Value)}`,
    };
  }

  const ratio = Math.min(designerValue, v1Value) / Math.max(designerValue, v1Value);
  if (ratio >= 0.5) {
    return { status: 'granularity', note: `Minor count difference (${designerValue} vs ${v1Value}, ratio ${ratio.toFixed(2)})` };
  }

  return { status: 'granularity', note: `Count difference (${designerValue} vs ${v1Value}, ratio ${ratio.toFixed(2)}) — expected due to V1 per-table vs Designer bundled granularity` };
};

const distribution = (kinds: readonly string[]): Record<string, number> =>
  kinds.reduce<Record<string, number>>((counts, kind) => {
    counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});

// ── Designer-side structural extraction ────────────────────────────────────

type DesignerStructure = {
  intro: Record<string, boolean>;
  summaryRowCount: number;
  rawKinds: readonly string[];
};

const extractDesignerStructure = (fragments: readonly DesignerFragment[]): DesignerStructure => {
  const kindCounts = distribution(fragments.map((f) => f.kind));

  return {
    intro: {
      reportHeader: (kindCounts.reportHeader ?? 0) > 0,
      reportTitle: (kindCounts.reportTitle ?? 0) > 0,
      assignment: (kindCounts.assignment ?? 0) > 0,
      committee: (kindCounts.committee ?? 0) > 0,
      purpose: (kindCounts.purpose ?? 0) > 0,
      visitDate: (kindCounts.visitDate ?? 0) > 0,
    },
    summaryRowCount: kindCounts.summaryTableRow ?? 0,
    rawKinds: fragments.map((f) => f.kind),
  };
};

// ── V1-side structural extraction ──────────────────────────────────────────

type V1Structure = {
  intro: Record<string, boolean>;
  summaryRowCount: number;
  rawKinds: readonly string[];
};

const extractV1Structure = (document: ReportDocumentV1): V1Structure => {
  const ordered = document.fragmentOrder
    .map((id) => document.fragments[id])
    .filter((f): f is NonNullable<typeof f> => f !== undefined);
  const kindCounts = distribution(ordered.map((f) => f.kind));

  // Identify summary table rows by following parentId chain from tableTitle
  const fragmentMap = document.fragments;
  const summaryTableTitleIds = new Set(
    Object.values(fragmentMap)
      .filter((f) => f.kind === 'tableTitle' && !f.parentId)
      .map((f) => f.id),
  );

  let summaryRowCount = 0;
  for (const fragment of ordered) {
    if (fragment.kind === 'tableRow') {
      // Walk up parentId chain: if grandparent is null/undefined, it's a summary row
      // (detailed tableRows have tableTitle whose parentId is a subsectionTitle)
      const parent = fragment.parentId ? fragmentMap[fragment.parentId] : undefined;
      if (parent && parent.kind === 'tableHeader') {
        const grandparent = parent.parentId ? fragmentMap[parent.parentId] : undefined;
        if (grandparent && summaryTableTitleIds.has(grandparent.id)) {
          summaryRowCount++;
        }
      } else if (parent && summaryTableTitleIds.has(parent.id)) {
        summaryRowCount++;
      }
    }
  }

  return {
    intro: {
      reportHeader: (kindCounts.reportHeader ?? 0) > 0,
      reportTitle: (kindCounts.reportTitle ?? 0) > 0,
      assignment: (kindCounts.assignment ?? 0) > 0,
      committee: (kindCounts.committee ?? 0) > 0,
      purpose: (kindCounts.purpose ?? 0) > 0,
      visitDate: (kindCounts.visitDate ?? 0) > 0,
    },
    summaryRowCount,
    rawKinds: ordered.map((f) => f.kind),
  };
};

// ── Main comparator ────────────────────────────────────────────────────────

const element = (
  id: string, area: string, label: string, nature: 'boolean' | 'count',
  designerValue: number, v1Value: number,
): StructureElement => {
  const { status, note } = classify(designerValue, v1Value, nature);
  return { id, area, label, nature, designerValue, v1Value, status, note };
};

export const compareStructuralShadow = (
  designerFragments: readonly DesignerFragment[],
  v1Document: ReportDocumentV1,
): StructuralShadowCompareReport => {
  const ds = extractDesignerStructure(designerFragments);
  const vs = extractV1Structure(v1Document);

  const kindCountsD = distribution(ds.rawKinds);
  const kindCountsV = distribution(vs.rawKinds);

  const elements: StructureElement[] = [
    // ── Introduction (boolean: present/absent) ──
    element('introduction:reportHeader', 'introduction', 'Report header', 'boolean',
      boolCount(ds.intro.reportHeader), boolCount(vs.intro.reportHeader)),
    element('introduction:reportTitle', 'introduction', 'Report title', 'boolean',
      boolCount(ds.intro.reportTitle), boolCount(vs.intro.reportTitle)),
    element('introduction:assignment', 'introduction', 'Assignment', 'boolean',
      boolCount(ds.intro.assignment), boolCount(vs.intro.assignment)),
    element('introduction:committee', 'introduction', 'Committee', 'boolean',
      boolCount(ds.intro.committee), boolCount(vs.intro.committee)),
    element('introduction:purpose', 'introduction', 'Purpose', 'boolean',
      boolCount(ds.intro.purpose), boolCount(vs.intro.purpose)),
    element('introduction:visitDate', 'introduction', 'Visit date', 'boolean',
      boolCount(ds.intro.visitDate), boolCount(vs.intro.visitDate)),

    // ── Summary tables ──
    element('summaryTables:exists', 'summaryTables', 'Summary tables exist', 'boolean',
      boolCount((kindCountsD.summaryTableTitle ?? 0) > 0),
      boolCount(vs.intro.assignment !== undefined)), // always present if summaryRowCount > 0
    element('summaryTables:rowCount', 'summaryTables', 'Summary table rows', 'count',
      ds.summaryRowCount, vs.summaryRowCount),

    // ── Sections ──
    element('sections:count', 'sections', 'Sections', 'count',
      (kindCountsD.sectionTitle ?? 0),
      (kindCountsV.sectionTitle ?? 0)),
    element('sections:narratives', 'sections', 'Narratives (section + subsection)', 'count',
      (kindCountsD.narrative ?? 0),
      (kindCountsV.sectionNarrative ?? 0) + (kindCountsV.subsectionNarrative ?? 0)),

    // ── Subsections ──
    element('subsections:count', 'subsections', 'Subsections', 'count',
      (kindCountsD.subsectionTitle ?? 0),
      (kindCountsV.subsectionTitle ?? 0)),

    // ── Findings ──
    element('findings:groupCount', 'findings', 'Finding groups', 'count',
      (kindCountsD.findingListTitle ?? 0) + (kindCountsD.inspectionDetailsTitle ?? 0) + (kindCountsD.manualFindingListTitle ?? 0),
      (kindCountsV.findingGroupTitle ?? 0)),

    // ── Detailed tables ──
    element('detailedTables:exists', 'detailedTables', 'Detailed tables exist', 'boolean',
      boolCount((kindCountsD.detailedTables ?? 0) > 0),
      boolCount(
        Object.values(v1Document.fragments).filter((f) =>
          f.kind === 'tableTitle' && f.parentId !== undefined
            && v1Document.fragments[f.parentId]?.kind === 'subsectionTitle'
        ).length > 0
      )),

    // ── Official notes ──
    element('officialNotes:exists', 'officialNotes', 'Official notes exist', 'boolean',
      boolCount((kindCountsD.officialNotesTitle ?? 0) > 0),
      boolCount((kindCountsV.officialNotesTitle ?? 0) > 0)),
    element('officialNotes:categoryCount', 'officialNotes', 'Note categories', 'count',
      (kindCountsD.notesCategoryTitle ?? 0),
      (kindCountsV.noteCategoryTitle ?? 0)),
    element('officialNotes:itemCount', 'officialNotes', 'Note items', 'count',
      (kindCountsD.noteItem ?? 0),
      (kindCountsV.noteItem ?? 0)),

    // ── Recommendations ──
    element('recommendations:exists', 'recommendations', 'Recommendations exist', 'boolean',
      boolCount((kindCountsD.recommendationsTitle ?? 0) > 0),
      boolCount((kindCountsV.recommendationsTitle ?? 0) > 0)),
    element('recommendations:groupCount', 'recommendations', 'Recommendation groups', 'count',
      (kindCountsD.recommendationAuthorityTitle ?? 0),
      (kindCountsV.recommendationGroupTitle ?? 0)),
    element('recommendations:itemCount', 'recommendations', 'Recommendation items', 'count',
      (kindCountsD.recommendationItem ?? 0),
      (kindCountsV.recommendationItem ?? 0)),

    // ── Appendices ──
    element('appendices:exists', 'appendices', 'Appendices exist', 'boolean',
      boolCount((kindCountsD.appendicesTitle ?? 0) > 0),
      boolCount((kindCountsV.appendicesTitle ?? 0) > 0)),
    element('appendices:count', 'appendices', 'Appendices', 'count',
      (kindCountsD.appendixTitle ?? 0),
      (kindCountsV.appendixTitle ?? 0)),
    element('appendices:paragraphCount', 'appendices', 'Appendix paragraphs', 'count',
      (kindCountsD.appendixParagraph ?? 0),
      (kindCountsV.appendixParagraph ?? 0)),

    // ── Closing ──
    element('closing:finalEvaluation', 'closing', 'Final evaluation', 'boolean',
      boolCount((kindCountsD.finalEvaluation ?? 0) > 0),
      boolCount((kindCountsV.finalEvaluation ?? 0) > 0)),
    element('closing:signatures', 'closing', 'Signatures', 'boolean',
      boolCount((kindCountsD.signatures ?? 0) > 0),
      boolCount((kindCountsV.signatures ?? 0) > 0)),

    // ── Additional granularity note: finding items ──
    element('findings:itemCount', 'findings', 'Finding items', 'count',
      (kindCountsD.findingListItem ?? 0) + (kindCountsD.inspectionDetailItem ?? 0) + (kindCountsD.manualFindingListItem ?? 0),
      (kindCountsV.findingItem ?? 0)),
  ];

  // ── Compute status breakdown ──
  const matched = elements.filter((e) => e.status === 'match').length;
  const granularity = elements.filter((e) => e.status === 'granularity').length;
  const structural = elements.filter((e) => e.status === 'structural-difference').length;

  const structuralCoverage = elements.length > 0
    ? (matched + granularity) / elements.length
    : 1;

  const reasons: string[] = [];
  for (const elem of elements) {
    if (elem.status === 'structural-difference') {
      reasons.push(`Structural difference: ${elem.label} — ${elem.note}`);
    }
  }

  // Calculate area coverage
  const areas = new Set(elements.map((e) => e.area));
  const designerAreas = new Set<string>();
  const v1Areas = new Set<string>();

  for (const elem of elements) {
    if (elem.designerValue > 0 || (elem.nature === 'boolean' && elem.designerValue > 0)) {
      designerAreas.add(elem.area);
    }
    if (elem.v1Value > 0 || (elem.nature === 'boolean' && elem.v1Value > 0)) {
      v1Areas.add(elem.area);
    }
  }

  return {
    elements,
    summary: {
      totalElements: elements.length,
      matched,
      granularityDifferences: granularity,
      structuralDifferences: structural,
      structuralCoverage,
      designerAreas: designerAreas.size,
      v1Areas: v1Areas.size,
    },
    decision: structural === 0 ? 'GO' : 'NO-GO',
    reasons,
  };
};
