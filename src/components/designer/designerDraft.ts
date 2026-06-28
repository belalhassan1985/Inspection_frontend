import type { DesignerSpacer, DesignerStyleState, ElementStyleOverride } from './types';

export type ReportDesignerDraft = {
  version: 1;
  campaignId: string;
  styleState: DesignerStyleState;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  elementTextOverrides: Record<string, string>;
  selectedNodeId?: string;
  manualPageBreaks?: string[];
  designerSpacers?: DesignerSpacer[];
  pdfReview?: {
    decision?: 'pending' | 'approved' | 'needs_changes';
    notes?: string;
  };
  updatedAt: string;
};

export const DESIGNER_DRAFT_VERSION = 1;
export const getDraftStorageKey = (campaignId: string) => `report-designer-draft:${campaignId}`;

export const serializeDraftPayload = (
  styleState: DesignerStyleState,
  elementStyleOverrides: Record<string, ElementStyleOverride>,
  elementTextOverrides: Record<string, string>,
  selectedNodeId?: string | null,
  manualPageBreaks?: string[],
  designerSpacers?: DesignerSpacer[],
) => JSON.stringify({ styleState, elementStyleOverrides, elementTextOverrides, selectedNodeId: selectedNodeId ?? null, manualPageBreaks: manualPageBreaks ?? [], designerSpacers: designerSpacers ?? [] });

export const isReportDesignerDraft = (value: any, campaignId: string): value is ReportDesignerDraft =>
  Boolean(
    value &&
      value.version === DESIGNER_DRAFT_VERSION &&
      value.campaignId === campaignId &&
      value.styleState &&
      typeof value.styleState === 'object' &&
      value.elementStyleOverrides &&
      typeof value.elementStyleOverrides === 'object' &&
      value.elementTextOverrides &&
      typeof value.elementTextOverrides === 'object' &&
      typeof value.updatedAt === 'string'
  );

export const isLegacyDraft = (value: any, campaignId: string): boolean =>
  Boolean(
    value &&
      value.version === undefined &&
      value.campaignId === campaignId &&
      value.styleState &&
      typeof value.styleState === 'object' &&
      value.elementStyleOverrides &&
      typeof value.elementStyleOverrides === 'object' &&
      value.elementTextOverrides &&
      typeof value.elementTextOverrides === 'object' &&
      typeof value.updatedAt === 'string'
  );

export const migrateReportDesignerDraft = (raw: any, campaignId: string): ReportDesignerDraft | null => {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version === DESIGNER_DRAFT_VERSION) {
    if (raw.selectedNodeId !== undefined && typeof raw.selectedNodeId !== 'string') {
      raw.selectedNodeId = undefined;
    }
    if (raw.manualPageBreaks !== undefined && !Array.isArray(raw.manualPageBreaks)) {
      raw.manualPageBreaks = [];
    }
    if (raw.designerSpacers !== undefined && !Array.isArray(raw.designerSpacers)) {
      raw.designerSpacers = [];
    }
    if (isReportDesignerDraft(raw, campaignId)) {
      if (!raw.manualPageBreaks) raw.manualPageBreaks = [];
      if (!raw.designerSpacers) raw.designerSpacers = [];
      return raw;
    }
    return null;
  }
  if (raw.version !== undefined) {
    console.warn('[Designer Draft] Unsupported draft version', raw.version, '- discarding.');
    return null;
  }
  if (!isLegacyDraft(raw, campaignId)) return null;
  console.info('[Designer Draft] Migrating legacy draft (no version) for campaign', campaignId);
  const migrated: ReportDesignerDraft = {
    version: DESIGNER_DRAFT_VERSION,
    campaignId: raw.campaignId,
    styleState: raw.styleState,
    elementStyleOverrides: raw.elementStyleOverrides && typeof raw.elementStyleOverrides === 'object' ? raw.elementStyleOverrides : {},
    elementTextOverrides: raw.elementTextOverrides && typeof raw.elementTextOverrides === 'object' ? raw.elementTextOverrides : {},
    selectedNodeId: (raw.selectedNodeId !== undefined && raw.selectedNodeId !== null && typeof raw.selectedNodeId === 'string') ? raw.selectedNodeId : undefined,
    manualPageBreaks: Array.isArray(raw.manualPageBreaks) ? raw.manualPageBreaks : [],
    designerSpacers: Array.isArray(raw.designerSpacers) ? raw.designerSpacers : [],
    updatedAt: raw.updatedAt,
  };
  return migrated;
};

export const readReportDesignerDraft = (campaignId: string): ReportDesignerDraft | null => {
  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(campaignId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = migrateReportDesignerDraft(parsed, campaignId);
    if (!migrated) {
      console.warn('[Designer Draft] Corrupt or unsupported draft found for campaign', campaignId, '- discarding.');
    }
    return migrated;
  } catch (err) {
    console.warn('[Designer Draft] Failed to read draft for campaign', campaignId, err);
    return null;
  }
};
