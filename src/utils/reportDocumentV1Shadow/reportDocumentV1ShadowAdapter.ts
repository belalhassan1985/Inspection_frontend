import type {
  FragmentKind as ReportDocumentFragmentKind,
  ReportDocumentV1,
} from '../../contracts/report-document-v1/types';
import type {
  Fragment as DesignerFragment,
  FragmentKind as DesignerFragmentKind,
} from '../reportFragments';

const LEGACY_KIND_COMPATIBILITY: Readonly<Record<ReportDocumentFragmentKind, readonly DesignerFragmentKind[]>> = {
  reportHeader: ['reportHeader'],
  reportTitle: ['reportTitle'],
  reportFooter: [],
  assignment: ['assignment'],
  committee: ['committee'],
  purpose: ['purpose'],
  visitDate: ['visitDate'],
  tableTitle: ['summaryTables', 'summaryTableTitle', 'detailedTables', 'detailedTableTitle'],
  tableHeader: ['summaryTableHeader', 'detailedTableHeader'],
  tableRow: ['summaryTableRow', 'detailedTableRow', 'inspectionDetailItem'],
  sectionTitle: ['sectionTitle'],
  sectionNarrative: ['narrative'],
  subsectionTitle: ['subsectionTitle'],
  subsectionNarrative: ['narrative'],
  findingGroupTitle: ['inspectionDetailsTitle', 'findingListTitle', 'manualFindingListTitle'],
  findingItem: ['inspectionDetailItem', 'findingListItem', 'manualFindingListItem'],
  recommendationsTitle: ['recommendationsTitle'],
  recommendationGroupTitle: ['recommendationAuthorityTitle'],
  recommendationItem: ['recommendationItem'],
  officialNotesTitle: ['officialNotesTitle'],
  noteCategoryTitle: ['notesCategoryTitle'],
  noteItem: ['noteItem'],
  appendicesTitle: ['appendicesTitle'],
  appendixTitle: ['appendixTitle'],
  appendixParagraph: ['appendixParagraph'],
  finalEvaluation: ['finalEvaluation'],
  signatures: ['signatures'],
};

export type ReportDocumentV1ShadowCompareReport = {
  fragmentCount: {
    designer: number;
    reportDocumentV1: number;
    delta: number;
  };
  kindDistribution: {
    designer: Readonly<Record<string, number>>;
    reportDocumentV1: Readonly<Record<string, number>>;
  };
  fragmentOrderCoverage: {
    orderedIds: number;
    resolvedIds: number;
    coverage: number;
    missingIds: readonly string[];
    orphanIds: readonly string[];
  };
  logicalKindOrderCoverage: {
    matchedFragments: number;
    comparedFragments: number;
    coverage: number;
  };
  supportedKinds: readonly ReportDocumentFragmentKind[];
  unsupportedKinds: readonly ReportDocumentFragmentKind[];
  duplicateIds: {
    designer: readonly string[];
    reportDocumentV1Order: readonly string[];
  };
  decision: 'GO' | 'NO-GO';
  reasons: readonly string[];
};

const distribution = (kinds: readonly string[]): Record<string, number> =>
  kinds.reduce<Record<string, number>>((counts, kind) => {
    counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});

const duplicates = (ids: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  ids.forEach((id) => seen.has(id) ? duplicateIds.add(id) : seen.add(id));
  return [...duplicateIds];
};

const ratio = (matched: number, total: number): number => total === 0 ? 1 : matched / total;

const logicalKindOrderCoverage = (
  designerFragments: readonly DesignerFragment[],
  document: ReportDocumentV1,
): { matchedFragments: number; comparedFragments: number; coverage: number } => {
  let designerIndex = 0;
  let matchedFragments = 0;
  const orderedFragments = document.fragmentOrder
    .map((id) => document.fragments[id])
    .filter((fragment) => fragment !== undefined);

  orderedFragments.forEach((fragment) => {
    const compatibleKinds = LEGACY_KIND_COMPATIBILITY[fragment.kind];
    while (designerIndex < designerFragments.length) {
      const currentKind = designerFragments[designerIndex].kind;
      designerIndex += 1;
      if (compatibleKinds.includes(currentKind)) {
        matchedFragments += 1;
        break;
      }
    }
  });

  return {
    matchedFragments,
    comparedFragments: orderedFragments.length,
    coverage: ratio(matchedFragments, orderedFragments.length),
  };
};

export const compareReportDocumentV1Shadow = (
  designerFragments: readonly DesignerFragment[],
  document: ReportDocumentV1,
): ReportDocumentV1ShadowCompareReport => {
  const missingIds = document.fragmentOrder.filter((id) => document.fragments[id] === undefined);
  const orderIds = new Set(document.fragmentOrder);
  const orphanIds = Object.keys(document.fragments).filter((id) => !orderIds.has(id));
  const documentKinds = [...new Set(document.fragmentOrder
    .map((id) => document.fragments[id]?.kind)
    .filter((kind): kind is ReportDocumentFragmentKind => kind !== undefined))];
  const supportedKinds = documentKinds.filter((kind) => LEGACY_KIND_COMPATIBILITY[kind].length > 0);
  const unsupportedKinds = documentKinds.filter((kind) => LEGACY_KIND_COMPATIBILITY[kind].length === 0);
  const designerDuplicateIds = duplicates(designerFragments.map((fragment) => fragment.id));
  const documentDuplicateIds = duplicates(document.fragmentOrder);
  const orderCoverage = ratio(document.fragmentOrder.length - missingIds.length, document.fragmentOrder.length);
  const kindOrderCoverage = logicalKindOrderCoverage(designerFragments, document);
  const reasons: string[] = [];

  if (missingIds.length > 0) reasons.push(`${missingIds.length} fragmentOrder IDs are missing from the V1 fragment registry.`);
  if (orphanIds.length > 0) reasons.push(`${orphanIds.length} V1 fragments are absent from fragmentOrder.`);
  if (designerDuplicateIds.length > 0) reasons.push(`${designerDuplicateIds.length} duplicate Designer fragment IDs were found.`);
  if (documentDuplicateIds.length > 0) reasons.push(`${documentDuplicateIds.length} duplicate V1 fragmentOrder IDs were found.`);
  if (unsupportedKinds.length > 0) reasons.push(`${unsupportedKinds.length} V1 kinds have no current Designer-kind compatibility mapping.`);
  if (kindOrderCoverage.coverage < 1) reasons.push('Logical kind order is not fully covered by the current Designer fragments.');

  return {
    fragmentCount: {
      designer: designerFragments.length,
      reportDocumentV1: document.fragmentOrder.length,
      delta: document.fragmentOrder.length - designerFragments.length,
    },
    kindDistribution: {
      designer: distribution(designerFragments.map((fragment) => fragment.kind)),
      reportDocumentV1: distribution(document.fragmentOrder
        .map((id) => document.fragments[id]?.kind)
        .filter((kind): kind is ReportDocumentFragmentKind => kind !== undefined)),
    },
    fragmentOrderCoverage: {
      orderedIds: document.fragmentOrder.length,
      resolvedIds: document.fragmentOrder.length - missingIds.length,
      coverage: orderCoverage,
      missingIds,
      orphanIds,
    },
    logicalKindOrderCoverage: kindOrderCoverage,
    supportedKinds,
    unsupportedKinds,
    duplicateIds: {
      designer: designerDuplicateIds,
      reportDocumentV1Order: documentDuplicateIds,
    },
    decision: reasons.length === 0 ? 'GO' : 'NO-GO',
    reasons,
  };
};

export const REPORT_DOCUMENT_V1_SHADOW_SUPPORTED_KINDS = Object.freeze(
  (Object.keys(LEGACY_KIND_COMPATIBILITY) as ReportDocumentFragmentKind[])
    .filter((kind) => LEGACY_KIND_COMPATIBILITY[kind].length > 0),
);

export const REPORT_DOCUMENT_V1_SHADOW_UNSUPPORTED_KINDS = Object.freeze(
  (Object.keys(LEGACY_KIND_COMPATIBILITY) as ReportDocumentFragmentKind[])
    .filter((kind) => LEGACY_KIND_COMPATIBILITY[kind].length === 0),
);
