import type { ElementStyleOverride } from './types';
import { DESIGNER_DRAFT_VERSION } from './designerDraft';

// ?? Designer Export Bridge Contract Draft ??
// Contract draft only. Backend integration deferred.
// No request is sent. Official PDF remains untouched.
export type DesignerExportBridgePayload = {
  campaignId: string;
  source: 'designer';
  draftVersion: 1;
  fragmentsCount: number;
  renderedPagesCount: number;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  manualPageBreaks: string[];
  generatedAt: string;
};

export type DesignerExportBridgeValidationResult = {
  valid: boolean;
  warnings: string[];
  errors: string[];
};

// ?? Phase 13H: PageDocument Request Preview ??
// Local preview only. No request is sent. Not the final request body â€”
// shows the shape the endpoint expects so the bridge transformation gap
// is visible. Does not modify DesignerExportBridgePayload, draft,
// pagination, /reports, PDF, backend, Prisma, or the Experimental Endpoint.
export type DesignerPageDocumentRequestPreview = {
  pageDocument: {
    source: 'designer';
    layout: { pageSize: 'A4' };
    pages: { pageNumber: number; fragments: { id: string; kind: string }[] }[];
    fragments: { id: string; kind: string }[];
    metadata: {
      campaignId: string;
      generatedAt: string;
      draftVersion: 1;
      textOverridesCount: number;
      styleOverridesCount: number;
      manualPageBreaksCount: number;
    };
  };
};

// ?? Phase 13I: PageDocument Request Validation ??
// Local validation only. No request is sent. No backend integration.
// Does not block saving or modify draft/pagination/inspectors.
export type PageDocumentRequestValidationResult = {
  valid: boolean;
  warnings: string[];
  errors: string[];
};

export const validateDesignerPageDocumentRequestPreview = (
  preview: DesignerPageDocumentRequestPreview | null,
  estimatedJsonBytes: number,
): PageDocumentRequestValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!preview) {
    return { valid: false, warnings, errors: ['PageDocument preview is null â€” no campaign or page document available.'] };
  }
  const pd = preview.pageDocument;
  if (!pd || typeof pd !== 'object') {
    errors.push('pageDocument must be an object.');
    return { valid: false, warnings, errors };
  }
  if (pd.source !== 'designer') {
    errors.push(`pageDocument.source must be 'designer' (got '${pd.source}').`);
  }
  if (!pd.layout || pd.layout.pageSize !== 'A4') {
    errors.push(`pageDocument.layout.pageSize must be 'A4' (got '${pd.layout?.pageSize ?? 'undefined'}').`);
  }
  if (!Array.isArray(pd.pages)) {
    errors.push('pageDocument.pages must be an array.');
  } else if (pd.pages.length === 0) {
    errors.push('pageDocument.pages must be a non-empty array.');
  } else {
    pd.pages.forEach((page, idx) => {
      if (typeof page.pageNumber !== 'number' || page.pageNumber < 1) {
        errors.push(`pageDocument.pages[${idx}].pageNumber must be a positive number (got '${page.pageNumber}').`);
      }
      if (!Array.isArray(page.fragments)) {
        errors.push(`pageDocument.pages[${idx}].fragments must be an array.`);
      } else {
        page.fragments.forEach((frag, fIdx) => {
          if (!frag.id || typeof frag.id !== 'string') {
            errors.push(`pageDocument.pages[${idx}].fragments[${fIdx}] missing or invalid 'id'.`);
          }
          if (!frag.kind || typeof frag.kind !== 'string') {
            errors.push(`pageDocument.pages[${idx}].fragments[${fIdx}] missing or invalid 'kind'.`);
          }
        });
      }
    });
    if (pd.pages.length < 2) {
      warnings.push('pageDocument.pages has only 1 page â€” multi-page reports are typical.');
    }
  }
  if (!Array.isArray(pd.fragments)) {
    errors.push('pageDocument.fragments must be an array.');
  } else if (pd.fragments.length === 0) {
    errors.push('pageDocument.fragments must be a non-empty array.');
  } else {
    const allPageFragmentIds = new Set(pd.pages.flatMap((p) => p.fragments.map((f) => f.id)));
    pd.fragments.forEach((frag, idx) => {
      if (!frag.id || typeof frag.id !== 'string') {
        errors.push(`pageDocument.fragments[${idx}] missing or invalid 'id'.`);
      }
      if (!frag.kind || typeof frag.kind !== 'string') {
        errors.push(`pageDocument.fragments[${idx}] missing or invalid 'kind'.`);
      }
      if (frag.id && !allPageFragmentIds.has(frag.id)) {
        warnings.push(`pageDocument.fragments[${idx}] id '${frag.id}' not assigned to any page.`);
      }
    });
    const allFragmentIds = new Set(pd.fragments.map((f) => f.id));
    pd.pages.forEach((page) => {
      page.fragments.forEach((frag) => {
        if (frag.id && !allFragmentIds.has(frag.id)) {
          warnings.push(`Page ${page.pageNumber} references fragment '${frag.id}' not found in pageDocument.fragments.`);
        }
      });
    });
  }
  if (!pd.metadata || typeof pd.metadata !== 'object') {
    errors.push('pageDocument.metadata must be an object.');
  } else {
    if (typeof pd.metadata.campaignId !== 'string' || pd.metadata.campaignId.trim() === '') {
      errors.push('pageDocument.metadata.campaignId must be a non-empty string.');
    }
  }
  const MAX_BYTES = 5 * 1024 * 1024;
  if (estimatedJsonBytes > MAX_BYTES) {
    errors.push(`Estimated JSON size (${(estimatedJsonBytes / 1024 / 1024).toFixed(2)} MB) exceeds the 5 MB endpoint limit.`);
  } else if (estimatedJsonBytes > 0.8 * MAX_BYTES) {
    warnings.push(`Estimated JSON size (${(estimatedJsonBytes / 1024).toFixed(1)} KB) is within 80â€“100% of the 5 MB limit.`);
  }
  return { valid: errors.length === 0, warnings, errors };
};

// ?? Phase 13C: Bridge Payload Validation ??
// Local validation only. No request is sent. No backend integration.
export const validateDesignerExportBridgePayload = (payload: DesignerExportBridgePayload | null): DesignerExportBridgeValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!payload) {
    return { valid: false, warnings, errors: ['Payload is null â€” no campaign selected.'] };
  }
  if (typeof payload.campaignId !== 'string' || payload.campaignId.trim() === '') {
    errors.push('campaignId must be a non-empty string.');
  }
  if (payload.source !== 'designer') {
    errors.push(`source must be 'designer' (got '${payload.source}').`);
  }
  if (payload.draftVersion !== 1) {
    errors.push(`draftVersion must be 1 (got ${payload.draftVersion}).`);
  }
  if (typeof payload.fragmentsCount !== 'number' || payload.fragmentsCount <= 0) {
    errors.push('fragmentsCount must be > 0.');
  } else if (payload.fragmentsCount < 3) {
    warnings.push('fragmentsCount is unusually low (< 3).');
  }
  if (typeof payload.renderedPagesCount !== 'number' || payload.renderedPagesCount <= 0) {
    errors.push('renderedPagesCount must be > 0.');
  }
  if (typeof payload.elementTextOverrides !== 'object' || payload.elementTextOverrides === null || Array.isArray(payload.elementTextOverrides)) {
    errors.push('elementTextOverrides must be an object.');
  } else if (Object.keys(payload.elementTextOverrides).length === 0) {
    warnings.push('elementTextOverrides is empty (no text edits).');
  }
  if (typeof payload.elementStyleOverrides !== 'object' || payload.elementStyleOverrides === null || Array.isArray(payload.elementStyleOverrides)) {
    errors.push('elementStyleOverrides must be an object.');
  } else if (Object.keys(payload.elementStyleOverrides).length === 0) {
    warnings.push('elementStyleOverrides is empty (no style edits).');
  }
  if (!Array.isArray(payload.manualPageBreaks)) {
    errors.push('manualPageBreaks must be an array.');
  } else if (payload.manualPageBreaks.some((b) => typeof b !== 'string')) {
    errors.push('manualPageBreaks must contain only strings.');
  }
  if (typeof payload.generatedAt !== 'string' || payload.generatedAt.trim() === '') {
    errors.push('generatedAt must be a non-empty string.');
  } else {
    const parsed = new Date(payload.generatedAt);
    if (isNaN(parsed.getTime())) {
      warnings.push('generatedAt is not a valid ISO date string.');
    }
  }
  return { valid: errors.length === 0, warnings, errors };
};

type DesignerPageDocumentPreviewInput = {
  selectedCampId: string;
  pageDocument: {
    generatedAt: string;
    pages: Array<{
      pageNumber: number;
      fragments: Array<{ id: string; kind: string }>;
    }>;
  } | null;
  fragments: Array<{ id: string; kind: string }>;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, unknown>;
  manualPageBreaks: string[];
};

// ?? Phase 13H: Build PageDocument Request Preview ??
// Builds a preview of the shape the Experimental PDF Endpoint expects.
// Local only. No request is sent. Does not modify DesignerExportBridgePayload,
// draft, pagination, /reports, PDF, backend, Prisma, or the Experimental Endpoint.
export const buildDesignerPageDocumentRequestPreview = ({
  selectedCampId,
  pageDocument,
  fragments,
  elementTextOverrides,
  elementStyleOverrides,
  manualPageBreaks,
}: DesignerPageDocumentPreviewInput): DesignerPageDocumentRequestPreview | null => {
  if (!selectedCampId || !pageDocument) return null;
  return {
    pageDocument: {
      source: 'designer',
      layout: { pageSize: 'A4' },
      pages: pageDocument.pages.map((p) => ({
        pageNumber: p.pageNumber,
        fragments: p.fragments.map((f) => ({ id: f.id, kind: f.kind })),
      })),
      fragments: fragments.map((f) => ({ id: f.id, kind: f.kind })),
      metadata: {
        campaignId: selectedCampId,
        generatedAt: pageDocument.generatedAt,
        draftVersion: DESIGNER_DRAFT_VERSION,
        textOverridesCount: Object.keys(elementTextOverrides).length,
        styleOverridesCount: Object.keys(elementStyleOverrides).length,
        manualPageBreaksCount: manualPageBreaks.length,
      },
    },
  };
};
