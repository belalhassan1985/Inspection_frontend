import type { ReportDocumentV1, ReportFragmentV1 } from '../../../contracts/report-document-v1/types';
import type { Fragment as DesignerFragment } from '../../reportFragments';

const flowDefaults = { keepTogether: false, keepWithNext: false, repeatHeader: false } as const;

const fragment = (id: string, kind: ReportFragmentV1['kind'], parentId?: string): ReportFragmentV1 => ({
  id,
  kind,
  parentId,
  sourceRef: { sourceType: 'fixture', sourceId: id, sourcePath: `$.fixture.${id}` },
  content: { fixture: true },
  visible: true,
  layoutDefaults: flowDefaults,
});

const orderedFragments = [
  fragment('report:header', 'reportHeader'),
  fragment('report:title', 'reportTitle'),
  fragment('introduction:assignment', 'assignment'),
  fragment('section:operations:title', 'sectionTitle'),
  fragment('subsection:communications:title', 'subsectionTitle', 'section:operations:title'),
  fragment('finding:communications:1', 'findingItem', 'subsection:communications:title'),
  fragment('recommendations:title', 'recommendationsTitle'),
  fragment('recommendation-group:police:title', 'recommendationGroupTitle', 'recommendations:title'),
  fragment('recommendation-group:police:item:1', 'recommendationItem', 'recommendation-group:police:title'),
  fragment('appendices:title', 'appendicesTitle'),
  fragment('appendix:a:title', 'appendixTitle', 'appendices:title'),
  fragment('appendix:a:paragraph:1', 'appendixParagraph', 'appendix:a:title'),
  fragment('signatures', 'signatures'),
] as const;

export const DESIGNER_SHADOW_FIXTURE_FRAGMENTS: readonly DesignerFragment[] = [
  { id: 'frag-report-header', kind: 'reportHeader', title: 'Report header', atomicity: 'atomic', data: {} },
  { id: 'frag-report-title', kind: 'reportTitle', title: 'Report title', atomicity: 'atomic', data: {} },
  { id: 'frag-assignment', kind: 'assignment', title: 'Assignment', atomicity: 'atomic', data: {} },
  { id: 'sec-0-title', kind: 'sectionTitle', title: 'Operations', atomicity: 'atomic', data: {} },
  { id: 'sec-0-sub-0-title', kind: 'subsectionTitle', title: 'Communications', atomicity: 'atomic', data: {} },
  { id: 'sec-0-sub-0-finding-0', kind: 'inspectionDetailItem', title: 'Finding', atomicity: 'atomic', data: {} },
  { id: 'frag-recommendations-title', kind: 'recommendationsTitle', title: 'Recommendations', atomicity: 'atomic', data: {} },
  { id: 'frag-recommendations-group-police-title', kind: 'recommendationAuthorityTitle', title: 'Police', atomicity: 'atomic', data: {} },
  { id: 'frag-recommendations-group-police-item-1', kind: 'recommendationItem', title: 'Recommendation', atomicity: 'atomic', data: {} },
  { id: 'frag-appendices-title', kind: 'appendicesTitle', title: 'Appendices', atomicity: 'atomic', data: {} },
  { id: 'frag-appendix-a-title', kind: 'appendixTitle', title: 'Appendix A', atomicity: 'atomic', data: {} },
  { id: 'frag-appendix-a-paragraph-0', kind: 'appendixParagraph', title: 'Appendix paragraph', atomicity: 'atomic', data: {} },
  { id: 'frag-signatures', kind: 'signatures', title: 'Signatures', atomicity: 'atomic', data: {} },
];

export const REPORT_DOCUMENT_V1_DESIGNER_SHADOW_FIXTURE: ReportDocumentV1 = {
  schemaVersion: 1,
  documentId: 'fixture:designer-shadow-readiness',
  campaignId: 'fixture-campaign',
  revision: 1,
  contentHash: 'fixture-only-not-for-production',
  generatedAt: '2026-06-27T00:00:00.000Z',
  locale: 'ar-IQ',
  direction: 'rtl',
  metadata: { fixture: true },
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
  fragmentOrder: orderedFragments.map(({ id }) => id),
  fragments: Object.fromEntries(orderedFragments.map((item) => [item.id, item])),
  hierarchy: orderedFragments.map(({ id, parentId }) => ({
    fragmentId: id,
    parentFragmentId: parentId,
    childFragmentIds: orderedFragments.filter((candidate) => candidate.parentId === id).map((candidate) => candidate.id),
  })),
};
