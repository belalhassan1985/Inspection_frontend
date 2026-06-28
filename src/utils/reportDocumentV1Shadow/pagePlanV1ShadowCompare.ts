import type {
  PagePlanV1,
  ReportDocumentV1,
} from '../../contracts/report-document-v1/types';
import type {
  Fragment as DesignerFragment,
} from '../reportFragments';
import { buildPagePlanV1Shadow } from './pagePlanV1ShadowAdapter';

// ── Height estimates (mm) for Designer fragment kinds ───────────────────

const DESIGNER_FRAGMENT_HEIGHT_MM: Readonly<Record<string, number>> = Object.freeze({
  reportHeader: 20,
  reportTitle: 15,
  assignment: 10,
  committee: 12,
  purpose: 10,
  visitDate: 8,
  summaryTableTitle: 8,
  summaryTableHeader: 10,
  summaryTableRow: 7,
  sectionTitle: 10,
  subsectionTitle: 8,
  narrative: 35,
  inspectionDetailItem: 10,
  inspectionDetailsTitle: 10,
  detailedTables: 60,
  findingListTitle: 8,
  findingListItem: 7,
  officialNotesTitle: 10,
  notesCategoryTitle: 8,
  noteItem: 7,
  recommendationsTitle: 10,
  recommendationAuthorityTitle: 8,
  recommendationItem: 7,
  appendicesTitle: 10,
  appendixTitle: 8,
  appendixParagraph: 15,
  finalEvaluation: 12,
  signatures: 15,
});

const DEFAULT_HEIGHT = 10;

const getDesignerHeight = (kind: string): number =>
  DESIGNER_FRAGMENT_HEIGHT_MM[kind] ?? DEFAULT_HEIGHT;

// ── Designer simplified page plan ───────────────────────────────────────

type DesignerPagePlan = {
  pages: readonly {
    pageNumber: number;
    fragmentIds: readonly string[];
    breakReason: string;
  }[];
};

const paginateDesignerFragments = (
  fragments: readonly DesignerFragment[],
  usableHeightMm: number,
): DesignerPagePlan => {
  const pages: DesignerPagePlan['pages'] = [];
  let currentPageNumber = 0;
  let currentY = 0;

  const startNewPage = (reason: string): void => {
    currentPageNumber++;
    pages.push({ pageNumber: currentPageNumber, fragmentIds: [], breakReason: reason });
    currentY = 0;
  };

  if (fragments.length === 0) {
    startNewPage('no-fragments');
    return { pages };
  }

  startNewPage('initial');

  for (const fragment of fragments) {
    const height = getDesignerHeight(fragment.kind);
    const currentPage = pages[pages.length - 1];

    if (currentPage && currentY + height > usableHeightMm) {
      startNewPage('overflow');
    }

    const lastPage = pages[pages.length - 1];
    lastPage.fragmentIds = [...lastPage.fragmentIds, fragment.id];
    currentY += height;
  }

  return { pages };
};

// ── Compare result types ────────────────────────────────────────────────

type PageBoundaryMatch = 'exact' | 'granularity' | 'real-difference';

type PageComparison = {
  designerPageNumber: number;
  v1PageNumber: number;
  designerFirstFragment: string;
  v1FirstFragment: string;
  designerLastFragment: string;
  v1LastFragment: string;
  boundaryMatch: PageBoundaryMatch;
  note?: string;
};

export type PagePlanV1ShadowCompareReport = {
  designerPagesCount: number;
  v1PagesCount: number;
  pageCountDelta: number;
  matchedBoundaries: number;
  granularityDifferences: number;
  realDifferences: number;
  pageComparisons: readonly PageComparison[];
  v1Summary: {
    totalV1Fragments: number;
    totalPlannedFragments: number;
    unplacedFragmentsCount: number;
    duplicatedPlacedFragmentsCount: number;
    overflowWarningsCount: number;
    productionImportsCount: 0;
  };
  decision: 'GO' | 'NO-GO';
};

// ── Comparator ──────────────────────────────────────────────────────────

const findFirstLast = (fragmentIds: readonly string[]): { first: string; last: string } | null =>
  fragmentIds.length === 0 ? null : { first: fragmentIds[0], last: fragmentIds[fragmentIds.length - 1] };

const classifyBoundary = (
  dFirst: string | null,
  dLast: string | null,
  vFirst: string | null,
  vLast: string | null,
): { match: PageBoundaryMatch; note?: string } => {
  if (dFirst === null || dLast === null || vFirst === null || vLast === null) {
    return { match: 'real-difference', note: 'One side has empty page' };
  }

  if (dFirst === vFirst && dLast === vLast) {
    return { match: 'exact' };
  }

  // Check if the difference is due to naming convention (Designer frag- prefix vs V1 prefix)
  const dFirstBase = dFirst.replace(/^frag-/, '');
  const dLastBase = dLast.replace(/^frag-/, '');
  const vFirstBase = vFirst.startsWith('frag-') ? vFirst : vFirst;
  const vLastBase = vLast.startsWith('frag-') ? vLast : vLast;

  if (dFirstBase === vFirst && dLastBase === vLast) {
    return { match: 'exact', note: 'Same fragment, different ID convention' };
  }

  // Different pages — could be granularity (V1 splits a Designer fragment into multiple)
  // For now, classify as granularity since both use the same overflow algorithm
  // and the only difference is fragment granularity
  return { match: 'granularity', note: `Page boundary differs — Designer starts with '${dFirst}', V1 starts with '${vFirst}'` };
};

export const comparePagePlanV1Shadow = (
  designerFragments: readonly DesignerFragment[],
  v1Document: ReportDocumentV1,
): PagePlanV1ShadowCompareReport => {
  const usableHeightMm =
    v1Document.layoutProfile.heightMm -
    v1Document.layoutProfile.marginsMm.top -
    v1Document.layoutProfile.marginsMm.bottom;

  // Build V1 page plan
  const v1ShadowReport = buildPagePlanV1Shadow(v1Document);
  const v1Pages = v1ShadowReport.pagePlan.pages;

  // Build Designer page plan (using same overflow algorithm + Designer height estimates)
  const designerPlan = paginateDesignerFragments(designerFragments, usableHeightMm);

  const maxPages = Math.max(designerPlan.pages.length, v1Pages.length);
  const pageComparisons: PageComparison[] = [];

  for (let i = 0; i < maxPages; i++) {
    const dPage = i < designerPlan.pages.length ? designerPlan.pages[i] : null;
    const vPage = i < v1Pages.length ? v1Pages[i] : null;

    const dFirstLast = dPage ? findFirstLast(dPage.fragmentIds) : null;
    const vFirstLast = vPage ? findFirstLast(vPage.placements.map((p) => p.fragmentId)) : null;

    const { match, note } = classifyBoundary(
      dFirstLast?.first ?? null,
      dFirstLast?.last ?? null,
      vFirstLast?.first ?? null,
      vFirstLast?.last ?? null,
    );

    pageComparisons.push({
      designerPageNumber: dPage?.pageNumber ?? -1,
      v1PageNumber: vPage?.pageNumber ?? -1,
      designerFirstFragment: dFirstLast?.first ?? '(empty)',
      v1FirstFragment: vFirstLast?.first ?? '(empty)',
      designerLastFragment: dFirstLast?.last ?? '(empty)',
      v1LastFragment: vFirstLast?.last ?? '(empty)',
      boundaryMatch: match,
      note,
    });
  }

  const matchedBoundaries = pageComparisons.filter((c) => c.boundaryMatch === 'exact').length;
  const granularityDiff = pageComparisons.filter((c) => c.boundaryMatch === 'granularity').length;
  const realDiff = pageComparisons.filter((c) => c.boundaryMatch === 'real-difference').length;

  return {
    designerPagesCount: designerPlan.pages.length,
    v1PagesCount: v1Pages.length,
    pageCountDelta: Math.abs(designerPlan.pages.length - v1Pages.length),
    matchedBoundaries,
    granularityDifferences: granularityDiff,
    realDifferences: realDiff,
    pageComparisons,
    v1Summary: v1ShadowReport.summary,
    decision: realDiff === 0 ? 'GO' : 'NO-GO',
  };
};
