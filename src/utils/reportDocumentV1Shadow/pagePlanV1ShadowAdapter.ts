import type {
  PagePlanV1,
  ReportDocumentV1,
} from '../../contracts/report-document-v1/types';

// ── Height estimates (mm) per fragment kind ────────────────────────────
const FRAGMENT_HEIGHT_MM: Readonly<Record<string, number>> = Object.freeze({
  reportHeader: 20,
  reportTitle: 15,
  assignment: 10,
  committee: 12,
  purpose: 10,
  visitDate: 8,
  tableTitle: 8,
  tableHeader: 10,
  tableRow: 7,
  sectionTitle: 10,
  sectionNarrative: 40,
  subsectionTitle: 8,
  subsectionNarrative: 35,
  findingGroupTitle: 8,
  findingItem: 7,
  recommendationsTitle: 10,
  recommendationGroupTitle: 8,
  recommendationItem: 7,
  officialNotesTitle: 10,
  noteCategoryTitle: 8,
  noteItem: 7,
  appendicesTitle: 10,
  appendixTitle: 8,
  appendixParagraph: 15,
  finalEvaluation: 12,
  signatures: 15,
});

const DEFAULT_FRAGMENT_HEIGHT = 10;

// ── Calibration mode (Phase 43B) ─────────────────────────────────────────
// Dev-only overrides. Never set as default. Never connected to UI.
export type PagePlanV1Calibration = {
  /** Override usable height (mm). If not set, uses layoutProfile-based calculation. */
  usableHeightMm?: number;
  /** Override height estimates per kind. Merged with defaults; these take priority. */
  heightOverrides?: Record<string, number>;
};

// ── Public types ───────────────────────────────────────────────────────

export type PagePlanV1ShadowReport = {
  pagePlan: PagePlanV1;
  summary: {
    totalV1Fragments: number;
    totalPlannedFragments: number;
    pagesCount: number;
    unplacedFragmentsCount: number;
    duplicatedPlacedFragmentsCount: number;
    overflowWarningsCount: number;
    breakReasons: Record<string, number>;
    productionImportsCount: 0;
  };
  unplacedFragmentIds: readonly string[];
  duplicatedFragmentIds: readonly string[];
  overflowWarnings: readonly string[];
  decision: 'GO' | 'NO-GO';
};

// ── Adapter ────────────────────────────────────────────────────────────

export const buildPagePlanV1Shadow = (
  document: ReportDocumentV1,
  calibration?: PagePlanV1Calibration,
): PagePlanV1ShadowReport => {
  const usableHeightMm =
    calibration?.usableHeightMm ??
    (document.layoutProfile.heightMm -
      document.layoutProfile.marginsMm.top -
      document.layoutProfile.marginsMm.bottom);

  const getCalibratedHeight = (kind: string): number => {
    if (calibration?.heightOverrides?.[kind] !== undefined) {
      return calibration.heightOverrides[kind];
    }
    return FRAGMENT_HEIGHT_MM[kind] ?? DEFAULT_FRAGMENT_HEIGHT;
  };

  const fragmentIds = document.fragmentOrder;
  const fragmentMap = document.fragments;

  const pages: PagePlanV1['pages'] = [];
  let currentPageNumber = 0;
  let currentY = 0;
  let sequence = 0;

  const placedIds = new Set<string>();
  const duplicatedIds = new Set<string>();
  const unplacedIds = new Set<string>(fragmentIds);
  const warnings: PagePlanV1['warnings'] = [];
  const breakReasons: Record<string, number> = {};

  const startNewPage = (reason: string): void => {
    currentPageNumber++;
    breakReasons[reason] = (breakReasons[reason] ?? 0) + 1;
    pages.push({
      pageId: `page:${currentPageNumber}`,
      pageNumber: currentPageNumber,
      placements: [],
    });
    currentY = 0;
  };

  if (fragmentIds.length === 0) {
    startNewPage('no-fragments');
  } else {
    startNewPage('initial');
  }

  for (const fragmentId of fragmentIds) {
    const fragment = fragmentMap[fragmentId];
    if (!fragment) {
      warnings.push({
        code: 'MISSING_FRAGMENT',
        fragmentId,
        message: `Fragment '${fragmentId}' referenced in fragmentOrder but not found in fragments map`,
      });
      continue;
    }

    const fragmentHeight = getCalibratedHeight(fragment.kind);

    // Check if this fragment ID was already placed (duplicate detection)
    if (placedIds.has(fragmentId)) {
      duplicatedIds.add(fragmentId);
      // Still allow placement — it's in fragmentOrder
    }

    // Overflow: fragment taller than full usable page
    if (fragmentHeight > usableHeightMm) {
      warnings.push({
        code: 'FRAGMENT_OVERFLOW',
        fragmentId,
        message: `Fragment '${fragmentId}' (kind: ${fragment.kind}, est. ${fragmentHeight}mm) exceeds usable page height (${usableHeightMm}mm)`,
      });
    }

    // If fragment doesn't fit on current page, start new page
    const currentPage = pages[pages.length - 1];
    if (currentPage && currentY + fragmentHeight > usableHeightMm) {
      startNewPage('overflow');
    }

    // Place fragment on current (possibly new) page
    const lastPage = pages[pages.length - 1];
    sequence++;
    lastPage.placements = [
      ...lastPage.placements,
      {
        placementId: `placement:${sequence}`,
        pageId: lastPage.pageId,
        fragmentId,
        sequence,
        role: 'original',
      },
    ];
    currentY += fragmentHeight;
    placedIds.add(fragmentId);
    unplacedIds.delete(fragmentId);
  }

  // If after placing all, some fragments remain unplaced (shouldn't happen)
  for (const uid of unplacedIds) {
    warnings.push({
      code: 'UNPLACED_FRAGMENT',
      fragmentId: uid,
      message: `Fragment '${uid}' was not placed on any page`,
    });
  }

  const pagePlan: PagePlanV1 = {
    planVersion: 1,
    planId: `shadow:${document.documentId}`,
    documentId: document.documentId,
    documentRevision: document.revision,
    documentContentHash: document.contentHash,
    generatedAt: new Date().toISOString(),
    generatorVersion: 'shadow-phase42b',
    metricsProfileId: document.layoutProfile.profileId,
    pages,
    manualBreaks: [],
    flowRules: {},
    tableContinuations: [],
    warnings,
  };

  const overflowWarnings = warnings
    .filter((w) => w.code === 'FRAGMENT_OVERFLOW')
    .map((w) => w.message);

  return {
    pagePlan,
    summary: {
      totalV1Fragments: fragmentIds.length,
      totalPlannedFragments: placedIds.size,
      pagesCount: pages.length,
      unplacedFragmentsCount: unplacedIds.size,
      duplicatedPlacedFragmentsCount: duplicatedIds.size,
      overflowWarningsCount: overflowWarnings.length,
      breakReasons,
      productionImportsCount: 0,
    },
    unplacedFragmentIds: [...unplacedIds],
    duplicatedFragmentIds: [...duplicatedIds],
    overflowWarnings,
    decision:
      placedIds.size === fragmentIds.length &&
      unplacedIds.size === 0 &&
      duplicatedIds.size === 0 &&
      overflowWarnings.length === 0
        ? 'GO'
        : 'NO-GO',
  };
};
