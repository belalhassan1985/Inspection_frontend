import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '../services/api';
import { buildFragments } from '../utils/reportFragments';
import type { Fragment } from '../utils/reportFragments';
import { normalizeFlowTargetIds, resolveFlowTargetId, resolveStructureFlowTargetId } from '../utils/designerFlowTargets';
import { paginate, AVAILABLE_PX } from '../utils/paginate';
import { DesignerDataStatus, type DesignerDataStatusProps } from '../components/designer/DesignerDataStatus';
import { DesignerCanvasShell, type DesignerCanvasShellProps } from '../components/designer/DesignerCanvasShell';
import { DesignerLayoutShell, type DesignerLayoutShellProps } from '../components/designer/DesignerLayoutShell';
import { applyDesignerOverridesToOfficialPayload } from '../utils/officialExportOverrideBridge';
import { exportDesignerSnapshotPdf } from '../utils/designerSnapshotPdfExport';
import { StructureTree, officialStructureTree } from '../components/designer/StructureTree';
import { PropertiesPanel } from '../components/designer/PropertiesPanel';
import { DesignerToolbar, type DesignerToolbarProps } from '../components/designer/DesignerToolbar';
import { DesignerStatusPanel, type DesignerStatusPanelProps } from '../components/designer/DesignerStatusPanel';
import { useDesignerDraft } from '../components/designer/useDesignerDraft';
import { useDesignerHistory } from '../components/designer/useDesignerHistory';
import { useDesignerMode } from '../components/designer/useDesignerMode';
import { useDesignerTextOverrides } from '../components/designer/useDesignerTextOverrides';
import { useDesignerStyleOverrides } from '../components/designer/useDesignerStyleOverrides';
import { useDesignerGlobalStyle } from '../components/designer/useDesignerGlobalStyle';
import { useDesignerSelectionDerived } from '../components/designer/useDesignerSelectionDerived';
import { useDesignerStructureHighlight } from '../components/designer/useDesignerStructureHighlight';
import { useDesignerFinalEvaluationCanvasSync } from '../components/designer/useDesignerFinalEvaluationCanvasSync';
import { useDesignerSummaryTablesCanvasSync } from '../components/designer/useDesignerSummaryTablesCanvasSync';
import { useDesignerOfficialNotesCanvasSync } from '../components/designer/useDesignerOfficialNotesCanvasSync';
import { useDesignerAppendicesCanvasSync } from '../components/designer/useDesignerAppendicesCanvasSync';
import { useDesignerRecommendationsCanvasSync } from '../components/designer/useDesignerRecommendationsCanvasSync';
import { useDesignerSignaturesCanvasSync } from '../components/designer/useDesignerSignaturesCanvasSync';
import { useDesignerCommitteeCanvasSync } from '../components/designer/useDesignerCommitteeCanvasSync';
import { useDesignerMainStyleSync } from '../components/designer/useDesignerMainStyleSync';
import { useDesignerSectionsCanvasSync } from '../components/designer/useDesignerSectionsCanvasSync';
import { useDesignerStructureNodeSelect } from '../components/designer/useDesignerStructureNodeSelect';
import { buildOfficialExportFormattingConfig } from '../components/designer/officialExportFormatting';
import { getElementId, getElementText } from '../components/designer/designerSelection';
import { buildPreviewStyleCss } from '../components/designer/designerStyleOverrides';
import {
  panelControlStyle,
  panelButtonStyle,
  shellPanelStyle,
  shellPanelHeaderStyle,
  shellPanelTitleStyle,
  shellPanelHintStyle,
} from '../components/designer/designerPanelStyles';
import {
  readReportDesignerDraft,
  serializeDraftPayload,
} from '../components/designer/designerDraft';
import type {
  SelectedElementType,
  PropertiesTab,
  DesignerSpacer,
  OfficialNotesListType,
} from '../components/designer/types';
import {
  DEFAULT_STYLE_STATE,
  RECOMMENDATIONS_CONTENT_ID,
  getSectionIndexFromFragmentIndex,
} from '../components/designer/types';
import { FloatingActionCard } from '../components/designer/FloatingActionCard';
import { OfficialPrintReview } from '../components/designer/OfficialPrintReview';


/**
 * Resolve a canvas fragment ID to a Structure Tree node ID for viewport tracking.
 * Uses exact canvasAnchorId matches first, then prefix patterns for dynamic fragments.
 */
function resolveFragmentToNodeId(fragId: string): string | null {
  // Build exact match lookup from tree (including children)
  const collectAnchors = (nodes: typeof officialStructureNode, map: Record<string, string>) => {
    for (const node of nodes) {
      if (node.canvasAnchorId) map[node.canvasAnchorId] = node.id;
      if (node.children) collectAnchors(node.children, map);
    }
  };
  const anchors: Record<string, string> = {};
  collectAnchors(officialStructureTree, anchors);

  // Exact match
  if (anchors[fragId]) return anchors[fragId];

  // Prefix patterns for dynamic section fragments
  if (fragId.startsWith('sec-') && fragId.includes('-sub-')) return 'subsections';
  if (fragId.startsWith('sec-')) return 'main-sections';
  if (fragId.startsWith('subsection/')) return 'subsections';
  if (fragId.startsWith('section/')) return 'main-sections';
  if (fragId.startsWith('frag-official-notes')) return 'official-notes';
  if (fragId.startsWith('list-item/official_notes')) return 'official-notes';
  if (fragId.startsWith('frag-recommendations')) return 'recommendations-main';
  if (fragId.startsWith('recommendation')) return 'recommendations-main';
  if (fragId.startsWith('frag-appendices') || fragId.startsWith('frag-appendix')) return 'appendices-main';
  if (fragId.startsWith('appendix/')) return 'appendices-main';
  if (fragId === 'frag-final-evaluation') return 'final-evaluation';
  if (fragId === 'frag-signatures') return 'signatures-main';

  return null;
}

const officialStructureNode = officialStructureTree;
const DEV_MEASUREMENT_AUDIT = import.meta.env.DEV;

type DesignerSelectionDiagnostic = {
  selectedElementId: string | null;
  selectedDomCount: number;
  selectedDom: string[];
};

const readDesignerSelectionDiagnostic = (
  root: HTMLElement | null,
  selectedElementId: string | null,
): DesignerSelectionDiagnostic => {
  const selectedDom = root
    ? Array.from(root.querySelectorAll<HTMLElement>('.rd-selected-element')).map((element) => (
      element.dataset.fragId
      || element.dataset.flowTargetId
      || element.id
      || `${element.tagName.toLowerCase()}:${(element.textContent || '').trim().slice(0, 48)}`
    ))
    : [];
  return {
    selectedElementId,
    selectedDomCount: selectedDom.length,
    selectedDom,
  };
};

/**
 * ReportDesigner أ¢â‚¬â€‌ ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط·آ­ط¸â€‍ط·آ© 1 (Paginator ط·ع¾ط·آ¬ط·آ±ط¸ظ¹ط·آ¨ط¸ظ¹ / ط¸â€ڑط·آ±ط·آ§ط·طŒط·آ© ط¸ظ¾ط¸â€ڑط·آ·)
 *
 * ط·آµط¸ظ¾ط·آ­ط·آ© ط¸â€¦ط·آ¹ط·آ²ط¸ث†ط¸â€‍ط·آ© ط·ع¾ط¸â€¦ط·آ§ط¸€¦ط·آ§ط¸â€¹ ط·آ¹ط¸â€  /reports. ط·ع¾ط¸â€ڑط·آ±ط·آ£ ط¸â€ ط¸ظ¾ط·آ³ payload ط¸â€¦ط¸â€  endpoint ط·آ§ط¸â€‍ط¸â€¦ط¸ث†ط·آ¬ط¸ث†ط·آ¯ط·إ’ ط·ع¾ط¸عˆط·آ³ط·آ·ط¸â€کط·آ­ ط·آ§ط¸â€‍ط·ع¾ط¸â€ڑط·آ±ط¸ظ¹ط·آ± ط·آ¥ط¸â€‍ط¸â€°
 * ط·آ´ط·آ¸ط·آ§ط¸ظ¹ط·آ§ط·إ’ ط·ع¾ط¸â€ڑط¸ظ¹ط·آ³ ط·آ§ط·آ±ط·ع¾ط¸ظ¾ط·آ§ط·آ¹ط¸â€،ط·آ§ ط¸ظ¾ط·آ¹ط¸â€‍ط¸ظ¹ط·آ§ط¸â€¹ ط¸â€¦ط¸â€  DOMط·إ’ ط·ع¾ط¸ث†ط·آ²ط¸â€کط·آ¹ط¸â€،ط·آ§ ط·آ¹ط¸â€‍ط¸â€° ط·آµط¸ظ¾ط·آ­ط·آ§ط·ع¾ A4ط·إ’ ط¸ث†ط·ع¾ط·آ¹ط·آ±ط·آ¶ط¸â€،ط·آ§ أ¢â‚¬â€‌ ط·آ¯ط¸ث†ط¸â€  ط·آ­ط¸ظ¾ط·آ¸ ط·آ£ط¸ث† ط·ع¾ط·آµط·آ¯ط¸ظ¹ط·آ± ط·آ£ط¸ث†
 * ط·ع¾ط·آ¹ط·آ¯ط¸ظ¹ط¸â€‍ Backend/PDF/Word/Database.
 */
export const ReportDesigner: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [reportPayload, setReportPayload] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [heights, setHeightsState] = useState<Map<string, number> | null>(null);
  const [availableContentHeightPx, setAvailableContentHeightPxState] = useState<number | null>(null);

  // Phase 8G أ¢â‚¬â€‌ local per-element preview controls only; no save and no official PDF changes.
  const [selectedElementType, setSelectedElementType] = useState<SelectedElementType>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementText, setSelectedElementText] = useState('');
  const [, setShowTextEditor] = useState(false);
  const [activePropertiesTab, setActivePropertiesTab] = useState<PropertiesTab>('content');
  // ?? Phase 18E: Official PDF Export from Designer ??
  const [officialExportStatus, setOfficialExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [officialExportError, setOfficialExportError] = useState<string>('');
  const [snapshotExportStatus, setSnapshotExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [snapshotExportError, setSnapshotExportError] = useState<string>('');
  const [snapshotExportProgress, setSnapshotExportProgress] = useState<{ completed: number; total: number } | null>(null);
  const [wordExportStatus, setWordExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [wordExportError, setWordExportError] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewPayload, setReviewPayload] = useState<Record<string, unknown> | undefined>(undefined);
  const [reviewCampaignName, setReviewCampaignName] = useState('');
  const [pdfReviewDecision, setPdfReviewDecision] = useState<'pending' | 'approved' | 'needs_changes'>('pending');
  const [pdfReviewNotes, setPdfReviewNotes] = useState('');
  const [structureSearch, setStructureSearch] = useState('');
  const [expandedStructureNodes, setExpandedStructureNodes] = useState<Record<string, boolean>>({
    introduction: true,
    tables: true,
    sections: true,
    'inspection-details': true,
    'manual-notes': true,
    recommendations: true,
    'protected-evaluation': true,
    appendices: true,
    signatures: true,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [highlightedStructureAnchorId, setHighlightedStructureAnchorId] = useState<string | null>(null);
  const [activeViewportNodeId, setActiveViewportNodeId] = useState<string | null>(null);
  const [formattingDrawerOpen, setFormattingDrawerOpen] = useState(false);
  const [manualPageBreaks, setManualPageBreaks] = useState<string[]>([]);
  const [selectedFlowTargetId, setSelectedFlowTargetId] = useState<string | null>(null);
  const [designerSpacers, setDesignerSpacers] = useState<DesignerSpacer[]>([]);
  const [activeOfficialNoteAction, setActiveOfficialNoteAction] = useState<{
    listType: OfficialNotesListType;
    index: number;
    top: number;
    left: number;
  } | null>(null);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const previewScopeRef = useRef<HTMLDivElement | null>(null);
  const originalTextRef = useRef<Record<string, string>>({});
  const saveDraftNowRef = useRef<((statusLabel?: string) => void) | null>(null);
  const setDraftNoticeRef = useRef<((notice: string) => void) | null>(null);
  const devMeasurementCountsRef = useRef({
    payloadGetCalls: 0,
    setHeightsCalls: 0,
    setAvailableContentHeightPxCalls: 0,
    formattingChanges: 0,
  });
  const devAvailableLogCallRef = useRef(0);
  const devSelectedElementIdRef = useRef<string | null>(null);
  const devReportPayloadRef = useRef<any | null>(null);
  const devLastSelectionRef = useRef<DesignerSelectionDiagnostic | null>(null);
  const devFormattingAuditRef = useRef<{
    id: number;
    baseline: { payloadGetCalls: number; setHeightsCalls: number; setAvailableContentHeightPxCalls: number };
    payloadAtStart: any | null;
    selectionAtStart: DesignerSelectionDiagnostic;
    timeoutId: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const {
    styleState,
    setStyleState,
    updateStyle,
  } = useDesignerGlobalStyle();
  const devPreviousStyleStateRef = useRef(styleState);
  const devPayloadAtLastStyleRef = useRef<any | null>(reportPayload);

  devSelectedElementIdRef.current = selectedElementId;
  devReportPayloadRef.current = reportPayload;

  const readCurrentSelectionDiagnostic = React.useCallback(() => (
    readDesignerSelectionDiagnostic(previewScopeRef.current, devSelectedElementIdRef.current)
  ), []);

  const logSelectionChangeIfNeeded = React.useCallback((reason: string) => {
    if (!DEV_MEASUREMENT_AUDIT || !devFormattingAuditRef.current) return;
    const current = readCurrentSelectionDiagnostic();
    const previous = devLastSelectionRef.current;
    const changed = !previous
      || previous.selectedElementId !== current.selectedElementId
      || previous.selectedDomCount !== current.selectedDomCount
      || previous.selectedDom.join('|') !== current.selectedDom.join('|');
    if (changed) {
      console.debug('[Phase51J] selection changed during measurement loop', {
        formattingChange: devFormattingAuditRef.current.id,
        reason,
        previous,
        current,
      });
      devLastSelectionRef.current = current;
    }
  }, [readCurrentSelectionDiagnostic]);

  const setHeights = React.useCallback<React.Dispatch<React.SetStateAction<Map<string, number> | null>>>((value) => {
    if (DEV_MEASUREMENT_AUDIT) {
      devMeasurementCountsRef.current.setHeightsCalls += 1;
      console.debug('[Phase51J] setHeights call', {
        call: devMeasurementCountsRef.current.setHeightsCalls,
        formattingChange: devFormattingAuditRef.current?.id ?? null,
        selection: readCurrentSelectionDiagnostic(),
      });
      logSelectionChangeIfNeeded('setHeights');
    }
    setHeightsState(value);
  }, [logSelectionChangeIfNeeded, readCurrentSelectionDiagnostic]);

  const setAvailableContentHeightPx = React.useCallback<React.Dispatch<React.SetStateAction<number | null>>>((value) => {
    const call = DEV_MEASUREMENT_AUDIT
      ? ++devMeasurementCountsRef.current.setAvailableContentHeightPxCalls
      : 0;
    setAvailableContentHeightPxState((previous) => {
      const next = typeof value === 'function' ? value(previous) : value;
      if (DEV_MEASUREMENT_AUDIT && devAvailableLogCallRef.current !== call) {
        devAvailableLogCallRef.current = call;
        console.debug('[Phase51J] availableContentHeightPx update', {
          call,
          formattingChange: devFormattingAuditRef.current?.id ?? null,
          previous,
          next,
          delta: previous === null || next === null ? null : next - previous,
          selection: readCurrentSelectionDiagnostic(),
        });
        logSelectionChangeIfNeeded('setAvailableContentHeightPx');
      }
      return next;
    });
  }, [logSelectionChangeIfNeeded, readCurrentSelectionDiagnostic]);

  const {
    elementTextOverrides,
    setElementTextOverrides,
    setTextOverride,
    resetTextOverride,
    updateSelectedText,
    resetSelectedText,
    resetAllTextEdits,
  } = useDesignerTextOverrides({
    selectedElementId,
    setSelectedElementText,
    originalTextRef,
  });

  const {
    canEditSelectedText,
    hasSelectedTextOverride,
  } = useDesignerSelectionDerived({
    selectedElementType,
    selectedElementId,
    elementTextOverrides,
  });

  const {
    elementStyleOverrides,
    setElementStyleOverrides,
    copiedStyle,
    setStyleOverride,
    resetStyleOverride,
    updateSelectedStyle,
    getSelectedStyleValue,
    selectedStyleOverride,
    hasSelectedStyleOverride,
    resetSelectedStyle,
    copySelectedStyle,
    pasteSelectedStyle,
  } = useDesignerStyleOverrides({
    selectedElementId,
    styleState,
  });

  const {
    designerMode,
    setDesignerMode,
  } = useDesignerMode();

  const {
    canUndo,
    canRedo,
    clearHistory,
    undo,
    redo,
  } = useDesignerHistory({
    elementTextOverrides,
    setElementTextOverrides,
    elementStyleOverrides,
    setElementStyleOverrides,
    selectedNodeId,
    setSelectedNodeId,
    setSelectedNodeType,
    setHighlightedStructureAnchorId,
    manualPageBreaks,
    setManualPageBreaks,
  });

  const {
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
    applyDraft,
    saveDraftNow,
    loadDraftForCurrentCampaign,
    startNewDraft,
    deleteCurrentDraft,
    clearDesignerDraft,
  } = useDesignerDraft({
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
  });

  saveDraftNowRef.current = saveDraftNow;
  setDraftNoticeRef.current = setDraftNotice;


  // ?? Phase 18E: Official PDF Export from Designer ??
  // Applies designer text overrides via the override bridge, then sends
  // the modified payload to the official PDF endpoint POST /reports/campaign/:id/pdf.
  // Falls back to diagnostic message if the endpoint rejects the body.
  const handleOfficialExportPdf = async () => {
    if (!selectedCampId || !reportPayload) return;
    setOfficialExportStatus('exporting');
    setOfficialExportError('');
    const exportFilename = `official-designer-report-${selectedCampId}-${Date.now()}.pdf`;
    try {
      // Phase 18G/18M-2: Map Designer state + current element overrides into official PDF payload.
      const formattingConfig = buildOfficialExportFormattingConfig(styleState);
      const overridePayload = applyDesignerOverridesToOfficialPayload(reportPayload, {
        elementTextOverrides,
        elementStyleOverrides,
        formattingConfig,
        manualPageBreaks,
        designerSpacers,
      });
      const blob: Blob = await apiFetch(`/reports/campaign/${selectedCampId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overridePayload),
      });
      if (!blob || blob.size === 0) {
        setOfficialExportStatus('error');
        setOfficialExportError('استجابة فارغة من نقطة التصدير الرسمية.');
        return;
      }
      if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
        setOfficialExportStatus('error');
        setOfficialExportError(`نوع استجابة غير متوقع: ${blob.type}. متوقع PDF.`);
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setOfficialExportStatus('success');
    } catch (err: any) {
      const statusCode = err?.status || err?.response?.status || 0;
      const rawMessage: string = err?.message || err?.statusText || '';
      let errorMessage = 'حدث خطأ أثناء تصدير التقرير الرسمي.';
      if (statusCode === 404 || rawMessage.includes('404') || rawMessage.includes('not found') || rawMessage.includes('NotFound')) {
        errorMessage = 'جسر التصدير الرسمي يتطلب دعم تجاوز الحمولة من الخلفية.';
      } else if (rawMessage) {
        errorMessage = rawMessage;
      }
      setOfficialExportStatus('error');
      setOfficialExportError(errorMessage);
    }
  };

  const handleSnapshotExportPdf = async () => {
    if (!selectedCampId || !reportPayload || snapshotExportStatus === 'exporting') return;

    setSnapshotExportStatus('exporting');
    setSnapshotExportError('');
    setSnapshotExportProgress(null);

    try {
      const previewRoot = previewScopeRef.current;
      if (!previewRoot) {
        throw new Error('معاينة التقرير غير جاهزة للتصدير.');
      }

      await exportDesignerSnapshotPdf({
        root: previewRoot,
        filename: `designer-preview-${selectedCampId}-${Date.now()}.pdf`,
        onProgress: setSnapshotExportProgress,
      });
      setSnapshotExportStatus('success');
    } catch (err: any) {
      setSnapshotExportStatus('error');
      setSnapshotExportError(err?.message || 'حدث خطأ أثناء إنشاء PDF مطابق للمعاينة.');
    } finally {
      setSnapshotExportProgress(null);
    }
  };

  // ?? Phase 26B: Official Word Export from Designer ??
  // Same override bridge pattern as PDF export, but sends to the Word endpoint.
  // Text overrides are applied; formatting/style overrides are not consumed by
  // the Word generator (hardcoded styles) — this is expected and documented.
  const handleOfficialExportWord = async () => {
    if (!selectedCampId || !reportPayload) return;
    setWordExportStatus('exporting');
    setWordExportError('');
    const exportFilename = `official-designer-report-${selectedCampId}-${Date.now()}.docx`;
    try {
      const formattingConfig = buildOfficialExportFormattingConfig(styleState);
      const overridePayload = applyDesignerOverridesToOfficialPayload(reportPayload, {
        elementTextOverrides,
        elementStyleOverrides,
        formattingConfig,
        manualPageBreaks,
        designerSpacers,
      });
      const blob: Blob = await apiFetch(`/reports/campaign/${selectedCampId}/word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overridePayload),
      });
      if (!blob || blob.size === 0) {
        setWordExportStatus('error');
        setWordExportError('استجابة فارغة من نقطة تصدير Word.');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setWordExportStatus('success');
    } catch (err: any) {
      const statusCode = err?.status || err?.response?.status || 0;
      const rawMessage: string = err?.message || err?.statusText || '';
      let errorMessage = 'حدث خطأ أثناء تصدير مستند Word.';
      if (statusCode === 404 || rawMessage.includes('404') || rawMessage.includes('not found') || rawMessage.includes('NotFound')) {
        errorMessage = 'نقطة تصدير Word غير موجودة.';
      } else if (rawMessage) {
        errorMessage = rawMessage;
      }
      setWordExportStatus('error');
      setWordExportError(errorMessage);
    }
  };

  const handleOfficialReviewClick = () => {
    if (!selectedCampId || !reportPayload) return;
    const formattingConfig = buildOfficialExportFormattingConfig(styleState);
    const payload = applyDesignerOverridesToOfficialPayload(reportPayload, {
      elementTextOverrides,
      elementStyleOverrides,
      formattingConfig,
      manualPageBreaks,
      designerSpacers,
    });
    setReviewPayload(payload);
    const camp = campaigns.find((c) => c.id === selectedCampId);
    setReviewCampaignName(camp?.name || '');
    setShowReviewModal(true);
  };

  const handleReviewConfirmExport = async (campId: string) => {
    setShowReviewModal(false);
    if (!reviewPayload) return;
    setOfficialExportStatus('exporting');
    setOfficialExportError('');
    const exportFilename = `official-designer-report-${campId}-${Date.now()}.pdf`;
    try {
      const blob: Blob = await apiFetch(`/reports/campaign/${campId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      });
      if (!blob || blob.size === 0) {
        setOfficialExportStatus('error');
        setOfficialExportError('استجابة فارغة من نقطة التصدير الرسمية.');
        return;
      }
      if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
        setOfficialExportStatus('error');
        setOfficialExportError(`نوع استجابة غير متوقع: ${blob.type}. متوقع PDF.`);
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setOfficialExportStatus('success');
    } catch (err: any) {
      const statusCode = err?.status || err?.response?.status || 0;
      const rawMessage: string = err?.message || err?.statusText || '';
      let errorMessage = 'حدث خطأ أثناء تصدير التقرير الرسمي.';
      if (statusCode === 404 || rawMessage.includes('404') || rawMessage.includes('not found') || rawMessage.includes('NotFound')) {
        errorMessage = 'جسر التصدير الرسمي يتطلب دعم تجاوز الحمولة من الخلفية.';
      } else if (rawMessage) {
        errorMessage = rawMessage;
      }
      setOfficialExportStatus('error');
      setOfficialExportError(errorMessage);
    }
  };

  const handleReviewReturnToEdit = () => {
    setShowReviewModal(false);
    setReviewPayload(undefined);
  };

  const setSelectedElement = (type: Exclude<SelectedElementType, null>, element: HTMLElement) => {
    const elementId = getElementId(type, element);
    const originalText = originalTextRef.current[elementId] ?? getElementText(element);
    originalTextRef.current[elementId] = originalText;

    selectedElementRef.current?.classList.remove('rd-selected-element');
    selectedElementRef.current = element;
    element?.classList.add('rd-selected-element');
    setDesignerMode('edit');
    setSelectedElementType(type);
    setSelectedElementId(elementId);
    setSelectedElementText(elementTextOverrides[elementId] ?? originalText);
    setShowTextEditor(false);
    setActivePropertiesTab(type === 'page' ? 'layout' : type === 'table' || type === 'tableCell' ? 'style' : 'content');
  };

  const handleQuickEdit = (fragId: string) => {
    const flowFragment = fragments.find((fragment) => fragment.id === fragId);
    setSelectedFlowTargetId(flowFragment ? resolveFlowTargetId(flowFragment) : null);

    const officialNotesItemMatch = fragId.match(/^frag-official-notes-(positives|negatives|impediments|obstacles)-item-(\d+)$/);
    const officialNotesStableMatch = fragId.match(/^list-item\/official_notes\/(positives|negatives|impediments|obstacles)\/(.+)$/);
    if (officialNotesItemMatch || officialNotesStableMatch) {
      const listType = (officialNotesItemMatch?.[1] ?? officialNotesStableMatch![1]) as OfficialNotesListType;
      let index: number;
      if (officialNotesItemMatch) {
        index = parseInt(officialNotesItemMatch[2], 10);
      } else {
        // Compute index by finding position among same-type note items in DOM
        const targetEl = previewScopeRef.current?.querySelector(`[data-frag-id="${fragId}"]`) as HTMLElement | null;
        if (targetEl) {
          const siblings = previewScopeRef.current?.querySelectorAll<HTMLElement>(
            `.rd-fragment[data-frag-id^="list-item/official_notes/${listType}/"]`
          ) || [];
          index = Array.from(siblings).indexOf(targetEl);
        } else {
          return;
        }
      }
      const targetEl = previewScopeRef.current?.querySelector(`[data-frag-id="${fragId}"]`) as HTMLElement | null;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setActiveOfficialNoteAction({
          listType,
          index,
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
      return;
    }

    const nodeId = resolveFragmentToNodeId(fragId);
    if (nodeId) {
      selectedElementRef.current?.classList.remove('rd-selected-element');
      selectedElementRef.current = null;
      setSelectedNodeId(nodeId);
      setSelectedNodeType(nodeId);
      setHighlightedStructureAnchorId(null);
      setSelectedElementType(null);
      setSelectedElementId(null);
      setSelectedElementText('');
      setShowTextEditor(false);
      setActivePropertiesTab('content');
    }
  };

  const handlePreviewElementClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const flowTarget = target.closest<HTMLElement>('[data-flow-target-id]');
    setSelectedFlowTargetId(flowTarget?.dataset.flowTargetId || null);

    const tableCell = target.closest('td, th') as HTMLElement | null;
    if (tableCell) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('tableCell', tableCell);
      return;
    }

    const table = target.closest('table, .military-table') as HTMLElement | null;
    if (table) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('table', table);
      return;
    }

    const title = target.closest('[data-frag-kind="reportTitle"]') as HTMLElement | null;
    if (title) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('mainTitle', title);
      return;
    }

    const numbering = target.closest('.rd-numbering, .section-num') as HTMLElement | null;
    if (numbering) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('numbering', numbering);
      return;
    }

    const subheading = target.closest('.rd-subheading-title') as HTMLElement | null;
    if (subheading) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('subheading', subheading);
      return;
    }

    const spacer = target.closest('.rd-vertical-spacer') as HTMLElement | null;
    if (spacer) {
      event.preventDefault();
      event.stopPropagation();
      const frag = spacer.closest('[data-frag-id]') as HTMLElement | null;
      if (frag?.dataset.fragId) {
        setSelectedElementType('spacer');
        setSelectedElementId(frag.dataset.fragId);
        setSelectedElementText('');
        setShowTextEditor(false);
        setActivePropertiesTab('content');
        selectedElementRef.current?.classList.remove('rd-selected-element');
        selectedElementRef.current = spacer;
        spacer.classList.add('rd-selected-element');
      }
      return;
    }

    const paragraph = target.closest('.rd-paragraph-text, .section-body, .rd-fragment-narrative, .rd-fragment-inspectionDetailItem') as HTMLElement | null;
    if (paragraph) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('paragraph', paragraph);
      return;
    }

    const page = target.closest('.rd-a4-page') as HTMLElement | null;
    if (page) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedElement('page', page);
    }
  };


  const handleOfficialNoteEdit = () => {
    selectedElementRef.current?.classList.remove('rd-selected-element');
    selectedElementRef.current = null;
    setSelectedNodeId('official-notes');
    setSelectedNodeType('official-notes');
    setHighlightedStructureAnchorId(null);
    setSelectedElementType(null);
    setSelectedElementId(null);
    setSelectedElementText('');
    setShowTextEditor(false);
    setActivePropertiesTab('content');
  };

useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/campaigns');
        if (active) setCampaigns(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (active) setError(e.message || 'ظپط´ظ„ طھط­ظ…ظٹظ„ ظ‚ط§ط¦ظ…ط© ط§ظ„ط­ظ…ظ„ط§طھ');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCampaignChange = async (campId: string) => {
    setSelectedCampId(campId);
    setReportPayload(null);
    setHeights(null);
    setAvailableContentHeightPx(null);
    setError('');
    setStyleState(DEFAULT_STYLE_STATE);
    setElementStyleOverrides({});
setElementTextOverrides({});
    setSelectedElementId(null);
    setSelectedElementType(null);
    setSelectedElementText('');
    setManualPageBreaks([]);
    setPdfReviewDecision('pending');
    setPdfReviewNotes('');
    setAvailableDraft(null);
    setShowDraftRestorePrompt(false);
    setDraftStatus('idle');
    setDraftNotice('');
    setLastDraftSavedAt(null);
    setDesignerMode('edit');
    clearHistory();
    lastSavedSnapshotRef.current = serializeDraftPayload(DEFAULT_STYLE_STATE, {}, {}, null, [], []);
    lastPdfReviewSnapshotRef.current = JSON.stringify({ decision: pdfReviewDecision, notes: pdfReviewNotes });
    if (!campId) return;

    setLoading(true);
    try {
      if (DEV_MEASUREMENT_AUDIT) {
        devMeasurementCountsRef.current.payloadGetCalls += 1;
        console.debug('[Phase51J] GET report payload', {
          call: devMeasurementCountsRef.current.payloadGetCalls,
          campaignId: campId,
          formattingChange: devFormattingAuditRef.current?.id ?? null,
        });
      }
      const data = await apiFetch(`/reports/campaign/${campId}/payload`);
      setReportPayload(data);
      const draft = readReportDesignerDraft(campId);
      if (draft) {
        setAvailableDraft(draft);
        setLastDraftSavedAt(draft.updatedAt);
        setShowDraftRestorePrompt(true);
      }
    } catch (e: any) {
      setError(e.message || 'ظپط´ظ„ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ طھظ‚ط±ظٹط± ط§ظ„ط­ظ…ظ„ط©');
    } finally {
      setLoading(false);
    }
  };

  const recommendationsContentOverride = elementTextOverrides[RECOMMENDATIONS_CONTENT_ID];
  const previewReportPayload = useMemo(() => {
    if (!reportPayload || recommendationsContentOverride === undefined) return reportPayload;
    return applyDesignerOverridesToOfficialPayload(reportPayload, {
      elementTextOverrides: {
        [RECOMMENDATIONS_CONTENT_ID]: recommendationsContentOverride,
      },
    });
  }, [reportPayload, recommendationsContentOverride]);

  const fragments: Fragment[] = useMemo(() => {
    if (!previewReportPayload) return [];
    const base = buildFragments(previewReportPayload);
    if (designerSpacers.length === 0) return base;
    const spacersSorted = [...designerSpacers].sort((a, b) => a.afterFragmentIndex - b.afterFragmentIndex);
    const result: Fragment[] = [];
    let spacerIdx = 0;
    for (let i = 0; i < base.length; i++) {
      result.push(base[i]);
      while (spacerIdx < spacersSorted.length && spacersSorted[spacerIdx].afterFragmentIndex === i) {
        const sp = spacersSorted[spacerIdx];
        result.push({
          id: `spacer:${sp.id}`,
          kind: 'vertical_spacer',
          title: 'فراغ عمودي',
          atomicity: 'atomic',
          data: { heightMm: sp.heightMm },
        });
        spacerIdx++;
      }
    }
    return result;
  }, [previewReportPayload, designerSpacers]);

  useEffect(() => {
    if (!DEV_MEASUREMENT_AUDIT) return;

    const styleIdentityChanged = devPreviousStyleStateRef.current !== styleState;
    if (!styleIdentityChanged) {
      devPayloadAtLastStyleRef.current = reportPayload;
      return;
    }

    const counts = devMeasurementCountsRef.current;
    const id = ++counts.formattingChanges;
    const selectionAtStart = readCurrentSelectionDiagnostic();
    const payloadBeforeStyleChange = devPayloadAtLastStyleRef.current;
    const existingAudit = devFormattingAuditRef.current;
    if (existingAudit?.timeoutId) clearTimeout(existingAudit.timeoutId);

    const audit = {
      id,
      baseline: {
        payloadGetCalls: counts.payloadGetCalls,
        setHeightsCalls: counts.setHeightsCalls,
        setAvailableContentHeightPxCalls: counts.setAvailableContentHeightPxCalls,
      },
      payloadAtStart: reportPayload,
      selectionAtStart,
      timeoutId: null as ReturnType<typeof setTimeout> | null,
    };
    devFormattingAuditRef.current = audit;
    devLastSelectionRef.current = selectionAtStart;

    console.debug('[Phase51J] formatting change start', {
      formattingChange: id,
      reportPayloadSameAsPreviousStyleRender: payloadBeforeStyleChange === reportPayload,
      countersAtStart: audit.baseline,
      selectionAtStart,
    });

    audit.timeoutId = setTimeout(() => {
      const currentCounts = devMeasurementCountsRef.current;
      const selectionAtEnd = readCurrentSelectionDiagnostic();
      console.debug('[Phase51J] formatting change summary', {
        formattingChange: id,
        payloadGetCallsDuringChange: currentCounts.payloadGetCalls - audit.baseline.payloadGetCalls,
        setHeightsCallsDuringChange: currentCounts.setHeightsCalls - audit.baseline.setHeightsCalls,
        setAvailableContentHeightPxCallsDuringChange:
          currentCounts.setAvailableContentHeightPxCalls - audit.baseline.setAvailableContentHeightPxCalls,
        reportPayloadIdentityChanged: devReportPayloadRef.current !== audit.payloadAtStart,
        selectedElementIdChanged: selectionAtEnd.selectedElementId !== audit.selectionAtStart.selectedElementId,
        selectedDomChanged:
          selectionAtEnd.selectedDomCount !== audit.selectionAtStart.selectedDomCount
          || selectionAtEnd.selectedDom.join('|') !== audit.selectionAtStart.selectedDom.join('|'),
        selectionAtStart: audit.selectionAtStart,
        selectionAtEnd,
      });
      if (devFormattingAuditRef.current?.id === id) devFormattingAuditRef.current = null;
    }, 2000);

    devPreviousStyleStateRef.current = styleState;
    devPayloadAtLastStyleRef.current = reportPayload;
  }, [readCurrentSelectionDiagnostic, reportPayload, styleState]);

  // Structural/content changes require a fresh complete measurement. Style-only
  // changes keep the current pages mounted and flow through visible reconciliation.
  useEffect(() => {
    setHeights(null);
    setAvailableContentHeightPx(null);
  }, [
    designerSpacers,
    elementTextOverrides,
    fragments,
    manualPageBreaks,
    reportPayload,
    selectedCampId,
  ]);

  useEffect(() => {
    if (!selectedFlowTargetId) return;
    const targetStillExists = fragments.some((fragment) => resolveFlowTargetId(fragment) === selectedFlowTargetId);
    if (!targetStillExists) setSelectedFlowTargetId(null);
  }, [fragments, selectedFlowTargetId]);

const pagination = useMemo(() => {
    if (!heights || fragments.length === 0) return null;
    return paginate(fragments, heights, availableContentHeightPx ?? AVAILABLE_PX, manualPageBreaks);
  }, [availableContentHeightPx, heights, fragments, manualPageBreaks]);

  const renderedPages = pagination?.pages || [];

  useDesignerMainStyleSync({
    previewScopeRef,
    originalTextRef,
    selectedElementRef,
    elementTextOverrides,
    elementStyleOverrides,
    styleState,
    designerMode,
    selectedElementId,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });

  useDesignerStructureHighlight({
    previewScopeRef,
    highlightedStructureAnchorId,
    renderedPagesCount: renderedPages.length,
    designerMode,
  });

  useDesignerCommitteeCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });

  // ?? Phase 10F: Summary Tables canvas sync ??
  useDesignerSummaryTablesCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 10F canvas sync ??

  // ?? Phase 10G: Official Notes canvas sync ??
  useDesignerOfficialNotesCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 10G canvas sync ??

  // ?? Phase 10H: Recommendations canvas sync ??
  useDesignerRecommendationsCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 10H canvas sync ??

  // ?? Phase 10I: Appendices canvas sync ??
  useDesignerAppendicesCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 10I canvas sync ??

  // ?? Phase 10J: Final Evaluation canvas sync ??
  useDesignerFinalEvaluationCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 10J canvas sync ??

  // ?? Phase 10K: Signatures canvas sync ??
  useDesignerSignaturesCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    elementStyleOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 10K canvas sync ??

  // ?? Phase 24B: Sections canvas sync ??
  useDesignerSectionsCanvasSync({
    previewScopeRef,
    elementTextOverrides,
    reportPayload,
    renderedPagesCount: renderedPages.length,
  });
  // ?? End Phase 24B canvas sync ??

  useEffect(() => {
    if (!heights || renderedPages.length === 0) return;
    let cancelled = false;

    const reconcileVisibleMeasurements = async () => {
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Continue with the browser fallback font if font loading fails.
        }
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      const root = previewScopeRef.current;
      if (!root) return;
      logSelectionChangeIfNeeded('reconciliation after layout stabilization');

      const firstContent = root.querySelector<HTMLElement>('.rd-a4-content');
      if (firstContent) {
        const actualAvailableHeight = firstContent.clientHeight;
        setAvailableContentHeightPx((current) => (
          current === null || Math.abs(current - actualAvailableHeight) > 0.5
            ? actualAvailableHeight
            : current
        ));
      }

      const fragments = Array.from(root.querySelectorAll<HTMLElement>('.rd-a4-content > [data-frag-id]'));
      const visibleHeights = new Map<string, number>();

      const measureFragmentVisualHeight = (node: HTMLElement): number => {
        const rect = node.getBoundingClientRect();
        let top = rect.top;
        let bottom = rect.bottom;

        for (const child of Array.from(node.children)) {
          const childEl = child as HTMLElement;
          const childRect = childEl.getBoundingClientRect();
          const childStyle = window.getComputedStyle(childEl);

          const childTop = childRect.top - (parseFloat(childStyle.marginTop) || 0);
          const childBottom = childRect.bottom + (parseFloat(childStyle.marginBottom) || 0);

          top = Math.min(top, childTop);
          bottom = Math.max(bottom, childBottom);
        }

        return Math.max(0, bottom - top);
      };

      fragments.forEach((fragment) => {
        const id = fragment.dataset.fragId;
        if (!id) return;

        const height = measureFragmentVisualHeight(fragment);
        visibleHeights.set(id, height);
      });

      if (DEV_MEASUREMENT_AUDIT) {
        const heightDeltas = Array.from(visibleHeights.entries())
          .map(([fragmentId, next]) => {
            const previous = heights.get(fragmentId) ?? 0;
            return { fragmentId, previous, next, delta: next - previous };
          })
          .filter((entry) => Math.abs(entry.delta) > 0.5)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
        if (heightDeltas.length > 0) {
          console.debug('[Phase51J] reconciliation height deltas', {
            formattingChange: devFormattingAuditRef.current?.id ?? null,
            changedFragments: heightDeltas.length,
            selection: readCurrentSelectionDiagnostic(),
          });
          console.table(heightDeltas.slice(0, 20));
        }
      }

      setHeights((current) => {
        if (!current) return current;
        let changed = false;
        const next = new Map(current);
        visibleHeights.forEach((height, id) => {
          if (Math.abs((current.get(id) ?? 0) - height) > 0.5) {
            next.set(id, height);
            changed = true;
          }
        });
        return changed ? next : current;
      });
    };

    reconcileVisibleMeasurements();
    return () => {
      cancelled = true;
    };
  }, [
    elementStyleOverrides,
    elementTextOverrides,
    heights,
    manualPageBreaks,
    logSelectionChangeIfNeeded,
    readCurrentSelectionDiagnostic,
    renderedPages.length,
    reportPayload,
    styleState,
  ]);


  const resetSelectedAll = () => {
    resetSelectedStyle();
    resetSelectedText();
  };

  const resetAllOverrides = () => {
    setElementStyleOverrides({});
    setElementTextOverrides({});
    if (selectedElementId) setSelectedElementText(originalTextRef.current[selectedElementId] || '');
  };

  const togglePageBreakBefore = (flowTargetId: string) => {
    setManualPageBreaks((prev) => {
      const normalized = normalizeFlowTargetIds(prev);
      if (normalized.includes(flowTargetId)) return normalized.filter((id) => id !== flowTargetId);
      return [...normalized, flowTargetId];
    });
  };


  const { handleStructureNodeSelect } = useDesignerStructureNodeSelect({
    previewScopeRef,
    selectedElementRef,
    reportPayload,
    styleState,
    elementStyleOverrides,
    setSelectedNodeId,
    setSelectedNodeType,
    setHighlightedStructureAnchorId,
    setSelectedElementType,
    setSelectedElementId,
    setSelectedElementText,
    setShowTextEditor,
    setActivePropertiesTab,
  });

  const handleStructureFlowNodeSelect = (node: Parameters<typeof handleStructureNodeSelect>[0]) => {
    handleStructureNodeSelect(node);
    setSelectedFlowTargetId(resolveStructureFlowTargetId(node.id, node.canvasAnchorId));
  };

  const addSpacer = () => {
    if (!reportPayload) return;
    const base = buildFragments(reportPayload);
    const afterIndex = base.length > 0 ? base.length - 1 : 0;
    const secIdx = getSectionIndexFromFragmentIndex(afterIndex, base);
    const newSpacer: DesignerSpacer = {
      id: `spacer-${Date.now()}`,
      afterFragmentIndex: afterIndex,
      heightMm: 10,
      afterSectionIndex: secIdx,
    };
    setDesignerSpacers((prev) => [...prev, newSpacer]);
  };

  const toolbarProps: DesignerToolbarProps = {
    selectedCampId,
    handleCampaignChange,
    campaigns,
    saveDraftNow,
    undo,
    canUndo,
    redo,
    canRedo,
    loadDraftForCurrentCampaign,
    availableDraft,
    startNewDraft,
    clearDesignerDraft,
    handleOfficialExportPdf,
    handleSnapshotExportPdf,
    handleOfficialExportWord,
    onReviewClick: handleOfficialReviewClick,
    reportPayload,
    officialExportStatus,
    officialExportError,
    snapshotExportStatus,
    snapshotExportError,
    snapshotExportProgress,
    wordExportStatus,
    wordExportError,
    onToggleFormatting: () => setFormattingDrawerOpen((prev) => !prev),
  };

  const statusPanelProps: DesignerStatusPanelProps = {
    draftStatus,
    lastDraftSavedAt,
    draftNotice,
    showDraftRestorePrompt,
    availableDraft,
    applyDraft,
    setShowDraftRestorePrompt,
    deleteCurrentDraft,
  };

  const dataStatusProps: DesignerDataStatusProps = {
    loading,
    reportPayload,
    error,
    fragments,
    heights,
    setHeights,
    setAvailableContentHeightPx,
    styleState,
    elementStyleOverrides,
    elementTextOverrides,
    manualPageBreaks,
  };

  const canvasProps: DesignerCanvasShellProps = {
    previewScopeRef,
    renderedPages,
    handlePreviewElementClick,
    onQuickEdit: handleQuickEdit,
    selectedFlowTargetId,
    manualPageBreaks,
    onTogglePageBreak: togglePageBreakBefore,
  };

  const formattingDrawerContent = (
    <div>
      {([1, 2, 3, 4] as const).map((level) => {
        const samples: Record<number, string> = { 1: '١. ٢. ٣. ...', 2: 'أ. ب. ج. ...', 3: '(١) (٢) (٣) ...', 4: '(أ) (ب) (ج) ...' };
        return (
          <div key={level} style={{ borderBottom: level < 4 ? '1px solid #e2e8f0' : 'none', paddingBottom: level < 4 ? '10px' : 0, marginBottom: level < 4 ? '10px' : 0 }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#0c2340', marginBottom: '6px' }}>المستوى {level}: {samples[level]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>اللون</label>
                <input type="color" value={styleState[`numberingLevel${level}Color` as keyof typeof styleState] as string || styleState.numberingColor} onChange={(e) => updateStyle(`numberingLevel${level}Color` as any, e.target.value)} style={{ width: '100%', height: '38px', padding: '2px', cursor: 'pointer' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>حجم الخط</label>
                <input type="number" min={0} max={28} step={0.5} value={styleState[`numberingLevel${level}FontSize` as keyof typeof styleState] as number} onChange={(e) => updateStyle(`numberingLevel${level}FontSize` as any, Number(e.target.value))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>السماكة</label>
                <select value={styleState[`numberingLevel${level}Weight` as keyof typeof styleState] as string} onChange={(e) => updateStyle(`numberingLevel${level}Weight` as any, e.target.value)}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const layoutShellProps: Pick<DesignerLayoutShellProps, 'error' | 'showWorkspace' | 'previewStyle' | 'renderedPagesCount' | 'previewScopeRef' | 'setActiveViewportNodeId' | 'resolveFragmentToNodeId' | 'formattingDrawerOpen' | 'onToggleFormatting' | 'formattingDrawerContent'> = {
    error,
    showWorkspace: Boolean(reportPayload && pagination),
    previewStyle: <style dangerouslySetInnerHTML={{ __html: buildPreviewStyleCss(styleState) }} />,
    renderedPagesCount: renderedPages.length,
    previewScopeRef,
    setActiveViewportNodeId,
    resolveFragmentToNodeId,
    formattingDrawerOpen,
    onToggleFormatting: () => setFormattingDrawerOpen((prev) => !prev),
    formattingDrawerContent,
  };
  return (
    <DesignerLayoutShell
      {...layoutShellProps}
      toolbar={(
        <DesignerToolbar {...toolbarProps} />
      )}
      overlays={(
        <>
      {showReviewModal && selectedCampId && (
        <OfficialPrintReview
          campaignId={selectedCampId}
          campaignName={reviewCampaignName}
          overridePayload={reviewPayload}
          onReturnToEdit={handleReviewReturnToEdit}
          onConfirmExport={handleReviewConfirmExport}
        />
      )}
      {activeOfficialNoteAction && (
        <FloatingActionCard
          position={{ top: activeOfficialNoteAction.top, left: activeOfficialNoteAction.left }}
          onOpenInspector={handleOfficialNoteEdit}
          onClose={() => setActiveOfficialNoteAction(null)}
        />
      )}
        </>
      )}
      statusPanel={(
        <DesignerStatusPanel {...statusPanelProps} />
      )}
      hiddenStyleControls={<></>}
      dataStatus={(
        <DesignerDataStatus {...dataStatusProps} />
      )}
      structureTree={(
              <StructureTree
                structureSearch={structureSearch}
                setStructureSearch={setStructureSearch}
                expandedStructureNodes={expandedStructureNodes}
                setExpandedStructureNodes={setExpandedStructureNodes}
                selectedNodeId={selectedNodeId}
                activeViewportNodeId={activeViewportNodeId}
                manualPageBreaks={manualPageBreaks}
                onSelectNode={handleStructureFlowNodeSelect}
                onTogglePageBreak={togglePageBreakBefore}
                onAddSpacer={addSpacer}
                shellPanelStyle={shellPanelStyle}
                shellPanelHeaderStyle={shellPanelHeaderStyle}
                shellPanelTitleStyle={shellPanelTitleStyle}
                shellPanelHintStyle={shellPanelHintStyle}
                panelControlStyle={panelControlStyle}
                panelButtonStyle={panelButtonStyle}
              />
            )}
      canvas={(
            <DesignerCanvasShell {...canvasProps} />
      )}
      propertiesPanel={(
              <PropertiesPanel
                reportPayload={reportPayload}
                fragments={fragments}
                styleState={styleState}
                elementTextOverrides={elementTextOverrides}
                elementStyleOverrides={elementStyleOverrides}
                selectedElementType={selectedElementType}
                selectedElementId={selectedElementId}
                selectedElementText={selectedElementText}
                selectedNodeId={selectedNodeId}
                selectedNodeType={selectedNodeType}
                activePropertiesTab={activePropertiesTab}
                copiedStyle={copiedStyle}
                designerSpacers={designerSpacers}
                canEditSelectedText={canEditSelectedText}
                hasSelectedStyleOverride={hasSelectedStyleOverride}
                hasSelectedTextOverride={hasSelectedTextOverride}
                selectedStyleOverride={selectedStyleOverride}
                setTextOverride={setTextOverride}
                setStyleOverride={setStyleOverride}
                resetTextOverride={resetTextOverride}
                resetStyleOverride={resetStyleOverride}
                updateStyle={updateStyle}
                getSelectedStyleValue={getSelectedStyleValue}
                updateSelectedStyle={updateSelectedStyle}
                updateSelectedText={updateSelectedText}
                resetSelectedText={resetSelectedText}
                resetSelectedStyle={resetSelectedStyle}
                resetSelectedAll={resetSelectedAll}
                resetAllTextEdits={resetAllTextEdits}
                resetAllOverrides={resetAllOverrides}
                copySelectedStyle={copySelectedStyle}
                pasteSelectedStyle={pasteSelectedStyle}
                setActivePropertiesTab={setActivePropertiesTab}
                setSelectedElementType={setSelectedElementType}
                setSelectedElementId={setSelectedElementId}
                setDesignerSpacers={setDesignerSpacers}
                originalTextRef={originalTextRef}
                manualPageBreaks={manualPageBreaks}
                onTogglePageBreak={togglePageBreakBefore}
              />
            )}
      reviewToggle={<></>}
      diagnosticsDrawer={<></>}
    />
  );
};




































































