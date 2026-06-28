import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { findStructureNodeById, officialStructureTree } from './StructureTree';
import { normalizeFlowTargetIds } from '../../utils/designerFlowTargets';
import {
  DESIGNER_DRAFT_VERSION,
  getDraftStorageKey,
  readReportDesignerDraft,
  serializeDraftPayload,
  type ReportDesignerDraft,
} from './designerDraft';
import type {
  DesignerMode,
  DesignerSpacer,
  DesignerStyleState,
  DraftSaveStatus,
  ElementStyleOverride,
} from './types';
import { DEFAULT_STYLE_STATE } from './types';

type PdfReviewDecision = 'pending' | 'approved' | 'needs_changes';

type UseDesignerDraftParams = {
  selectedCampId: string;
  styleState: DesignerStyleState;
  setStyleState: Dispatch<SetStateAction<DesignerStyleState>>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  setElementStyleOverrides: Dispatch<SetStateAction<Record<string, ElementStyleOverride>>>;
  elementTextOverrides: Record<string, string>;
  setElementTextOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  selectedNodeId: string | null;
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>;
  setSelectedNodeType: Dispatch<SetStateAction<string | null>>;
  setHighlightedStructureAnchorId: Dispatch<SetStateAction<string | null>>;
  manualPageBreaks: string[];
  setManualPageBreaks: Dispatch<SetStateAction<string[]>>;
  designerSpacers: DesignerSpacer[];
  setDesignerSpacers: Dispatch<SetStateAction<DesignerSpacer[]>>;
  pdfReviewDecision: PdfReviewDecision;
  setPdfReviewDecision: Dispatch<SetStateAction<PdfReviewDecision>>;
  pdfReviewNotes: string;
  setPdfReviewNotes: Dispatch<SetStateAction<string>>;
  selectedElementId: string | null;
  setSelectedElementText: Dispatch<SetStateAction<string>>;
  originalTextRef: MutableRefObject<Record<string, string>>;
  setDesignerMode: Dispatch<SetStateAction<DesignerMode>>;
  clearHistory: () => void;
};

export const useDesignerDraft = ({
  selectedCampId,
  styleState,
  setStyleState,
  elementStyleOverrides,
  setElementStyleOverrides,
  elementTextOverrides,
  setElementTextOverrides,
  selectedNodeId,
  setSelectedNodeId,
  setSelectedNodeType,
  setHighlightedStructureAnchorId,
  manualPageBreaks,
  setManualPageBreaks,
  designerSpacers,
  setDesignerSpacers,
  pdfReviewDecision,
  setPdfReviewDecision,
  pdfReviewNotes,
  setPdfReviewNotes,
  selectedElementId,
  setSelectedElementText,
  originalTextRef,
  setDesignerMode,
  clearHistory,
}: UseDesignerDraftParams) => {
  const [draftStatus, setDraftStatus] = useState<DraftSaveStatus>('idle');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [availableDraft, setAvailableDraft] = useState<ReportDesignerDraft | null>(null);
  const [showDraftRestorePrompt, setShowDraftRestorePrompt] = useState(false);
  const [draftNotice, setDraftNotice] = useState('');
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef(serializeDraftPayload(DEFAULT_STYLE_STATE, {}, {}, null, [], []));
  const lastPdfReviewSnapshotRef = useRef(JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes }));

  const buildCurrentDraft = (updatedAt = new Date().toISOString()): ReportDesignerDraft | null => {
    if (!selectedCampId) return null;
    return {
      version: DESIGNER_DRAFT_VERSION,
      campaignId: selectedCampId,
      styleState,
      elementStyleOverrides,
      elementTextOverrides,
      selectedNodeId: selectedNodeId ?? undefined,
      manualPageBreaks,
      designerSpacers,
      pdfReview: {
        decision: pdfReviewDecision,
        notes: pdfReviewNotes || undefined,
      },
      updatedAt,
    };
  };

  const applyDraft = (draft: ReportDesignerDraft, notice = 'Draft restored') => {
    setStyleState(draft.styleState);
    setElementStyleOverrides(draft.elementStyleOverrides && typeof draft.elementStyleOverrides === 'object' ? draft.elementStyleOverrides : {});
    setElementTextOverrides(draft.elementTextOverrides && typeof draft.elementTextOverrides === 'object' ? draft.elementTextOverrides : {});
    setManualPageBreaks(normalizeFlowTargetIds(draft.manualPageBreaks));
    setDesignerSpacers(Array.isArray(draft.designerSpacers) ? draft.designerSpacers : []);
    if (draft.pdfReview) {
      if (draft.pdfReview.decision) setPdfReviewDecision(draft.pdfReview.decision);
      if (draft.pdfReview.notes !== undefined) setPdfReviewNotes(draft.pdfReview.notes);
    }
    setLastDraftSavedAt(draft.updatedAt);
    setDraftStatus('saved');
    setDraftNotice(notice);
    setDesignerMode('edit');
    setShowDraftRestorePrompt(false);
    setAvailableDraft(draft);
    clearHistory();
    lastSavedSnapshotRef.current = serializeDraftPayload(
      draft.styleState,
      draft.elementStyleOverrides || {},
      draft.elementTextOverrides || {},
      draft.selectedNodeId,
      draft.manualPageBreaks || [],
      draft.designerSpacers || []
    );
    lastPdfReviewSnapshotRef.current = JSON.stringify({
      decision: draft.pdfReview?.decision ?? 'pending',
      notes: draft.pdfReview?.notes ?? '',
    });
    if (draft.selectedNodeId && findStructureNodeById(officialStructureTree, draft.selectedNodeId)) {
      setSelectedNodeId(draft.selectedNodeId);
      const node = findStructureNodeById(officialStructureTree, draft.selectedNodeId);
      if (node) {
        setSelectedNodeType(node.type);
        setHighlightedStructureAnchorId(node.canvasAnchorId || null);
      }
    }
  };

  const saveDraftNow = (statusLabel = 'تم حفظ المسودة') => {
    const draft = buildCurrentDraft();
    if (!draft) return;
    try {
      setDraftStatus('saving');
      window.localStorage.setItem(getDraftStorageKey(draft.campaignId), JSON.stringify(draft));
      setAvailableDraft(draft);
      setLastDraftSavedAt(draft.updatedAt);
      setDraftStatus('saved');
      setDraftNotice(statusLabel);
      lastSavedSnapshotRef.current = serializeDraftPayload(draft.styleState, draft.elementStyleOverrides, draft.elementTextOverrides, draft.selectedNodeId, draft.manualPageBreaks, draft.designerSpacers);
      lastPdfReviewSnapshotRef.current = JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes });
    } catch {
      setDraftStatus('error');
      setDraftNotice('Draft save failed');
    }
  };

  const loadDraftForCurrentCampaign = () => {
    if (!selectedCampId) return;
    const draft = readReportDesignerDraft(selectedCampId);
    if (!draft) {
      setDraftNotice('لا توجد مسودة محفوظة لهذه الحملة');
      return;
    }
    applyDraft(draft, 'Draft loaded');
  };

  const startNewDraft = () => {
    if (!window.confirm('Start a new draft in the preview? The saved LocalStorage draft will not be deleted.')) return;
    setStyleState(DEFAULT_STYLE_STATE);
    setElementStyleOverrides({});
    setElementTextOverrides({});
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setHighlightedStructureAnchorId(null);
    setManualPageBreaks([]);
    setDesignerSpacers([]);
    setDraftStatus('idle');
    setDraftNotice('New draft started');
    setDesignerMode('edit');
    clearHistory();
    lastSavedSnapshotRef.current = serializeDraftPayload(DEFAULT_STYLE_STATE, {}, {}, null, [], []);
    lastPdfReviewSnapshotRef.current = JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes });
    if (selectedElementId) setSelectedElementText(originalTextRef.current[selectedElementId] || '');
  };

  const deleteCurrentDraft = () => {
    if (!selectedCampId) return;
    if (!window.confirm('هل تريد حذف المسودة المحفوظة لهذه الحملة؟')) return;
    window.localStorage.removeItem(getDraftStorageKey(selectedCampId));
    setAvailableDraft(null);
    setShowDraftRestorePrompt(false);
    setLastDraftSavedAt(null);
    setDraftStatus('idle');
    setDraftNotice('Saved draft deleted');
    setDesignerMode('edit');
    clearHistory();
    lastPdfReviewSnapshotRef.current = JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes });
  };

  const clearDesignerDraft = () => {
    if (!selectedCampId) return;
    if (!window.confirm('هل تريد حذف المسودة المحفوظة لهذه الحملة؟ سيتم حذف التعديلات المحلية فقط دون التأثير على بيانات الخادم.')) return;
    window.localStorage.removeItem(getDraftStorageKey(selectedCampId));
    setStyleState(DEFAULT_STYLE_STATE);
    setElementStyleOverrides({});
    setElementTextOverrides({});
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setHighlightedStructureAnchorId(null);
    setManualPageBreaks([]);
    setDesignerSpacers([]);
    setAvailableDraft(null);
    setShowDraftRestorePrompt(false);
    setLastDraftSavedAt(null);
    setDraftStatus('idle');
    setDraftNotice('Designer draft cleared');
    setDesignerMode('edit');
    clearHistory();
    lastSavedSnapshotRef.current = serializeDraftPayload(DEFAULT_STYLE_STATE, {}, {}, null, [], []);
    lastPdfReviewSnapshotRef.current = JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes });
  };

  useEffect(() => {
    if (!selectedCampId) return;
    const currentSnapshot = serializeDraftPayload(styleState, elementStyleOverrides, elementTextOverrides, selectedNodeId, manualPageBreaks, designerSpacers);
    const designHasChanges =
      currentSnapshot !== serializeDraftPayload(DEFAULT_STYLE_STATE, {}, {}, null, [], []) &&
      currentSnapshot !== lastSavedSnapshotRef.current;
    const pdfReviewSnapshot = JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes });
    const pdfReviewHasChanges = pdfReviewSnapshot !== lastPdfReviewSnapshotRef.current;
    const hasChanges = designHasChanges || pdfReviewHasChanges;

    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (!hasChanges) return;
    setDraftStatus('unsaved');
    autoSaveTimerRef.current = window.setTimeout(() => {
      saveDraftNow('تم حفظ المسودة');
      autoSaveTimerRef.current = null;
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [selectedCampId, styleState, elementStyleOverrides, elementTextOverrides, manualPageBreaks, designerSpacers, pdfReviewDecision, pdfReviewNotes]);

  return {
    draftStatus,
    setDraftStatus,
    lastDraftSavedAt,
    setLastDraftSavedAt,
    availableDraft,
    setAvailableDraft,
    showDraftRestorePrompt,
    setShowDraftRestorePrompt,
    draftNotice,
    setDraftNotice,
    lastSavedSnapshotRef,
    lastPdfReviewSnapshotRef,
    buildCurrentDraft,
    applyDraft,
    saveDraftNow,
    loadDraftForCurrentCampaign,
    startNewDraft,
    deleteCurrentDraft,
    clearDesignerDraft,
  };
};
