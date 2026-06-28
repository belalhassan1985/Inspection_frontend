import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { OfficialStructureNode } from './StructureTree';
import {
  INTRODUCTION_PARAGRAPH_NODE_IDS,
  SUMMARY_TABLES_NODE_IDS,
  OFFICIAL_NOTES_NODE_IDS,
  RECOMMENDATIONS_NODE_IDS,
  APPENDICES_NODE_IDS,
  FINAL_EVALUATION_NODE_IDS,
  SIGNATURES_NODE_IDS,
} from './types';
import type {
  IntroductionParagraphNodeId,
  DesignerStyleState,
  ElementStyleOverride,
  SelectedElementType,
  PropertiesTab,
} from './types';

interface UseDesignerStructureNodeSelectParams {
  previewScopeRef: RefObject<HTMLDivElement | null>;
  selectedElementRef: RefObject<HTMLElement | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportPayload: any;
  styleState: DesignerStyleState;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedNodeType: (type: string | null) => void;
  setHighlightedStructureAnchorId: (id: string | null) => void;
  setSelectedElementType: (type: SelectedElementType) => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementText: (text: string) => void;
  setShowTextEditor: (show: boolean) => void;
  setActivePropertiesTab: (tab: PropertiesTab) => void;
}

export function useDesignerStructureNodeSelect({
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
}: UseDesignerStructureNodeSelectParams): { handleStructureNodeSelect: (node: OfficialStructureNode) => void } {
  const handleStructureNodeSelect = useCallback((node: OfficialStructureNode) => {
    setSelectedNodeId(node.id);
    setSelectedNodeType(node.type);
    setHighlightedStructureAnchorId(node.canvasAnchorId || null);

    selectedElementRef.current?.classList.remove('rd-selected-element');
    selectedElementRef.current = null;
    setSelectedElementType(null);
    setSelectedElementId(null);
    setSelectedElementText('');
    setShowTextEditor(false);
    if (node.id === 'title' || node.id === 'title-main' || node.id === 'frag-report-title:main-title' || node.id === 'committee' || INTRODUCTION_PARAGRAPH_NODE_IDS.includes(node.id as IntroductionParagraphNodeId) || SUMMARY_TABLES_NODE_IDS.includes(node.id as any) || OFFICIAL_NOTES_NODE_IDS.includes(node.id as any) || RECOMMENDATIONS_NODE_IDS.includes(node.id as any) || APPENDICES_NODE_IDS.includes(node.id as any) || FINAL_EVALUATION_NODE_IDS.includes(node.id as any) || SIGNATURES_NODE_IDS.includes(node.id as any)) setActivePropertiesTab('content');

    if (!node.canvasAnchorId) return;

    window.requestAnimationFrame(() => {
      const root = previewScopeRef.current;
      const target = root
        ? Array.from(root.querySelectorAll<HTMLElement>('.rd-fragment')).find((element) => element.dataset.fragId === node.canvasAnchorId)
        : null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  }, [
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
  ]);

  return { handleStructureNodeSelect };
}
