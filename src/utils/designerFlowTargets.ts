import type { Fragment, FragmentKind } from './reportFragments';

const FLOW_TARGET_KINDS = new Set<FragmentKind>([
  'sectionTitle',
  'subsectionTitle',
  'summaryTableTitle',
  'officialNotesTitle',
  'recommendationAuthorityTitle',
  'appendicesTitle',
  'appendixTitle',
  'signatures',
  'reportTitle',
  'recommendationsTitle',
]);

const LEGACY_FLOW_TARGET_IDS: Record<string, string> = {
  title: 'frag-report-title',
  assignment: 'frag-assignment',
  committee: 'frag-committee',
  purpose: 'frag-purpose',
  'visit-date': 'frag-visit-date',
  tables: 'frag-summary-tables-title',
  'commanders-table': 'frag-summary-tables-title',
  sections: 'frag-inspection-details-title',
  'inspection-details': 'frag-inspection-details-title',
  'main-sections': 'frag-inspection-details-title',
  subsections: 'frag-inspection-details-title',
  'manual-notes': 'frag-official-notes-title',
  'official-notes': 'frag-official-notes-title',
  observations: 'frag-official-notes-title',
  recommendations: 'frag-recommendations-title',
  'recommendations-main': 'frag-recommendations-title',
  'final-evaluation': 'frag-final-evaluation',
  appendices: 'frag-appendices-title',
  'appendices-main': 'frag-appendices-title',
  signatures: 'frag-signatures',
  'signatures-main': 'frag-signatures',
};

export const resolveFlowTargetId = (
  fragment: Pick<Fragment, 'id' | 'kind'>,
): string | null => (FLOW_TARGET_KINDS.has(fragment.kind) ? fragment.id : null);

export const isSupportedFlowTargetId = (flowTargetId: string | null | undefined): boolean => {
  if (!flowTargetId) return false;
  return flowTargetId === 'frag-inspection-details-title'
    || /^sec-\d+-title$/.test(flowTargetId)
    || /^sec-\d+-sub-\d+-title$/.test(flowTargetId)
    || flowTargetId === 'frag-summary-tables-title'
    || flowTargetId === 'frag-official-notes-title'
    || flowTargetId === 'frag-recommendations-title'
    || /^frag-recommendations-group-.+-title$/.test(flowTargetId)
    || flowTargetId === 'frag-report-title'
    || flowTargetId === 'frag-appendices-title'
    || /^frag-appendix-.+-title$/.test(flowTargetId)
    || flowTargetId === 'frag-signatures'
    // Phase 46B — Stable fragment ID patterns
    || /^section\/.+/.test(flowTargetId)
    || /^subsection\/.+/.test(flowTargetId)
    || /^recommendation-group\/.+/.test(flowTargetId)
    || /^appendix\/.+/.test(flowTargetId);
};

export const resolveStructureFlowTargetId = (
  nodeId: string,
  canvasAnchorId?: string,
): string | null => {
  const candidate = canvasAnchorId || LEGACY_FLOW_TARGET_IDS[nodeId];
  return isSupportedFlowTargetId(candidate) ? candidate! : null;
};

export const normalizeFlowTargetIds = (ids: unknown): string[] => {
  if (!Array.isArray(ids)) return [];
  const normalized = ids
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .map((id) => LEGACY_FLOW_TARGET_IDS[id] || id);
  return [...new Set(normalized)];
};

export const resolveOfficialExportBreakId = (flowTargetId: string): string | null => {
  if (flowTargetId === 'frag-report-title') return 'title';
  if (flowTargetId === 'frag-assignment') return 'assignment';
  if (flowTargetId === 'frag-committee') return 'committee';
  if (flowTargetId === 'frag-purpose') return 'purpose';
  if (flowTargetId === 'frag-visit-date') return 'visit-date';
  if (flowTargetId === 'frag-summary-tables-title') return 'commanders-table';
  if (flowTargetId === 'frag-inspection-details-title'
    || /^sec-\d+-title$/.test(flowTargetId)
    || /^sec-\d+-sub-\d+-title$/.test(flowTargetId)
    || /^section\/.+/.test(flowTargetId)
    || /^subsection\/.+/.test(flowTargetId)) return 'inspection-details';
  if (flowTargetId === 'frag-official-notes-title') return 'observations';
  if (flowTargetId === 'frag-recommendations-title' || /^frag-recommendations-group-.+-title$/.test(flowTargetId) || /^recommendation-group\/.+/.test(flowTargetId)) return 'recommendations';
  if (flowTargetId === 'frag-final-evaluation') return 'final-evaluation';
  if (flowTargetId === 'frag-appendices-title' || /^frag-appendix-.+-title$/.test(flowTargetId) || /^appendix\/.+/.test(flowTargetId)) return 'appendices';
  if (flowTargetId === 'frag-signatures') return 'signatures';
  return null;
};
