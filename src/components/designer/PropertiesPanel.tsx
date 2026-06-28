import React from 'react';
import { buildFragments } from '../../utils/reportFragments';
import type { Fragment } from '../../utils/reportFragments';
import { resolveSelectableFragment } from './selectableFragmentModel';
import { findStructureNodeById, officialStructureTree } from './StructureTree';

import type {
  FontFamilyChoice,
  FontWeightChoice,
  TitleTextAlignChoice,
  CommitteeMemberDraft,
  TableBorderWidthChoice,
  TableCellPaddingChoice,
  SelectedElementType,
  ElementStyleOverride,
  PropertiesTab,
  DesignerStyleState,
  DesignerSpacer,
  OfficialNotesListType,
  OfficialNotesOverrideData,
  RecommendationDraftGroup,
  AppendixDraft,
  SignatureDraft,
  SelectableFragment,
} from './types';



import {
TITLE_ELEMENT_ID,
  COMMITTEE_CONTENT_ID,
  COMMITTEE_STYLE_ID,
  SUMMARY_TABLES_CONTENT_ID,
  SUMMARY_TABLES_STYLE_ID,
  SUMMARY_TABLES_NODE_IDS,
  OFFICIAL_NOTES_CONTENT_ID,
  OFFICIAL_NOTES_STYLE_ID,
  OFFICIAL_NOTES_NODE_IDS,
  OFFICIAL_NOTES_LIST_TYPES,
  OFFICIAL_NOTES_LIST_LABELS,
  RECOMMENDATIONS_CONTENT_ID,
  RECOMMENDATIONS_STYLE_ID,
  RECOMMENDATIONS_NODE_IDS,
  APPENDICES_CONTENT_ID,
  APPENDICES_STYLE_ID,
  APPENDICES_NODE_IDS,
  FINAL_EVALUATION_CONTENT_ID,
  FINAL_EVALUATION_STYLE_ID,
  FINAL_EVALUATION_NODE_IDS,
  SIGNATURES_CONTENT_ID,
  SIGNATURES_STYLE_ID,
  SIGNATURES_NODE_IDS,
  SECTIONS_NODE_IDS,
  SELECTED_ELEMENT_LABELS,
  parseCommitteeMemberDraft,
  readCommitteeOverride,
  readOfficialNotesOverride,
  readRecommendationsOverride,
  serializeRecommendationsOverride,
  readAppendicesOverride,
  readSignaturesOverride,
} from './types';

export interface PropertiesPanelProps {
  reportPayload: any;
  fragments: Fragment[];
  styleState: DesignerStyleState;
  elementTextOverrides: Record<string, string>;
  elementStyleOverrides: Record<string, ElementStyleOverride>;
  selectedElementType: SelectedElementType;
  selectedElementId: string | null;
  selectedElementText: string;
  selectedNodeId: string | null;
  selectedNodeType: string | null;
  activePropertiesTab: PropertiesTab;
  copiedStyle: ElementStyleOverride | null;
  designerSpacers: DesignerSpacer[];
  canEditSelectedText: boolean;
  hasSelectedStyleOverride: boolean;
  hasSelectedTextOverride: boolean;
  selectedStyleOverride: ElementStyleOverride;
  setTextOverride: (key: string, value: string) => void;
  setStyleOverride: (key: string, patch: ElementStyleOverride) => void;
  resetTextOverride: (key: string) => void;
  resetStyleOverride: (key: string) => void;
  updateStyle: <K extends keyof DesignerStyleState>(key: K, value: DesignerStyleState[K]) => void;
  getSelectedStyleValue: <K extends keyof DesignerStyleState>(key: K) => DesignerStyleState[K];
  updateSelectedStyle: <K extends keyof DesignerStyleState>(key: K, value: DesignerStyleState[K]) => void;
  updateSelectedText: (value: string) => void;
  resetSelectedText: () => void;
  resetSelectedStyle: () => void;
  resetSelectedAll: () => void;
  resetAllTextEdits: () => void;
  resetAllOverrides: () => void;
  copySelectedStyle: () => void;
  pasteSelectedStyle: () => void;
  setActivePropertiesTab: (tab: PropertiesTab) => void;
  setSelectedElementType: (type: SelectedElementType) => void;
  setSelectedElementId: (id: string | null) => void;
  setDesignerSpacers: React.Dispatch<React.SetStateAction<DesignerSpacer[]>>;
  originalTextRef: React.MutableRefObject<Record<string, string>>;
  manualPageBreaks: string[];
  onTogglePageBreak: (flowTargetId: string) => void;
}

const panelControlStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '34px',
  border: '1px solid #cbd5e1',
  borderRadius: '7px',
  padding: '6px 8px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};
const panelLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 700,
};
const panelGroupStyle: React.CSSProperties = {
  display: 'grid',
  gap: '10px',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: '#f8fafc',
};
const panelButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: '7px',
  padding: '8px 10px',
  backgroundColor: '#ffffff',
  color: '#334155',
  cursor: 'pointer',
  fontWeight: 700,
};

const shellPanelStyle: React.CSSProperties = {
  position: 'sticky',
  top: '24px',
  alignSelf: 'start',
  border: '1px solid #d7dee8',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
};

const shellPanelHeaderStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const shellPanelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 800,
};

const shellPanelHintStyle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.6,
};



export const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
  const {
    reportPayload,
    fragments,
    styleState,
    elementTextOverrides,
    elementStyleOverrides,
    selectedElementType,
    selectedElementId,
    selectedElementText,
    selectedNodeId,
    selectedNodeType,
    activePropertiesTab,
    copiedStyle,
    designerSpacers,
    canEditSelectedText,
    hasSelectedStyleOverride,
hasSelectedTextOverride,
    setTextOverride,
    setStyleOverride,
    resetTextOverride,
    resetStyleOverride,
    getSelectedStyleValue,
    updateSelectedStyle,
    updateSelectedText,
    resetSelectedText,
    resetSelectedStyle,
    resetSelectedAll,
    resetAllTextEdits,
    resetAllOverrides,
    copySelectedStyle,
    pasteSelectedStyle,
    setActivePropertiesTab,
    setSelectedElementType,
    setSelectedElementId,
    setDesignerSpacers,
    originalTextRef,
    manualPageBreaks,
    onTogglePageBreak,
  } = props;

  const selectedStructureNode = findStructureNodeById(officialStructureTree, selectedNodeId);
  const isTitleInspectorActive = selectedStructureNode?.id === 'title' || selectedStructureNode?.id === 'title-main' || selectedStructureNode?.id === TITLE_ELEMENT_ID;
  const baseTitleText = String(reportPayload?.title || '');
  const titleTextValue = elementTextOverrides[TITLE_ELEMENT_ID] ?? baseTitleText;
  const titleStyleOverride = elementStyleOverrides[TITLE_ELEMENT_ID] || {};
  const hasTitleTextOverride = elementTextOverrides[TITLE_ELEMENT_ID] !== undefined;
  const hasTitleStyleOverride = Boolean(elementStyleOverrides[TITLE_ELEMENT_ID]);

const updateTitleText = (value: string) => {
    originalTextRef.current[TITLE_ELEMENT_ID] = originalTextRef.current[TITLE_ELEMENT_ID] ?? baseTitleText;
    setTextOverride(TITLE_ELEMENT_ID, value);
  };

  const updateTitleStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(TITLE_ELEMENT_ID, patch);
  };

  const getTitleStyleValue = <K extends keyof ElementStyleOverride>(key: K): ElementStyleOverride[K] => {
    if (titleStyleOverride[key] !== undefined) return titleStyleOverride[key];
    return styleState[key as keyof DesignerStyleState] as ElementStyleOverride[K];
  };

const resetTitleText = () => {
    resetTextOverride(TITLE_ELEMENT_ID);
  };

  const resetTitleStyle = () => {
    resetStyleOverride(TITLE_ELEMENT_ID);
  };

  const resetTitleAll = () => {
    resetTitleText();
    resetTitleStyle();
  };

  const getIntroductionParagraphConfig = (nodeId: string | null) => {
    if (nodeId === 'assignment') {
      return { nodeId, label: 'التكليف', elementId: 'frag-assignment:paragraph:0', baseText: String(reportPayload?.assignmentText || '') };
    }
    if (nodeId === 'purpose') {
      return { nodeId, label: 'الغاية', elementId: 'frag-purpose:paragraph:0', baseText: String(reportPayload?.purposeText || '') };
    }
    if (nodeId === 'visit-date') {
      return { nodeId, label: 'تاريخ التفتيش', elementId: 'frag-visit-date:paragraph:0', baseText: String(reportPayload?.durationText || '') };
    }
    return null;
  };

  const introductionParagraphConfig = getIntroductionParagraphConfig(selectedStructureNode?.id || null);
  const isIntroductionParagraphInspectorActive = Boolean(introductionParagraphConfig);
  const paragraphElementId = introductionParagraphConfig?.elementId || '';
  const paragraphTextValue = introductionParagraphConfig ? (elementTextOverrides[paragraphElementId] ?? introductionParagraphConfig.baseText) : '';
  const paragraphStyleOverride = paragraphElementId ? elementStyleOverrides[paragraphElementId] || {} : {};
  const hasParagraphTextOverride = paragraphElementId ? elementTextOverrides[paragraphElementId] !== undefined : false;
  const hasParagraphStyleOverride = paragraphElementId ? Boolean(elementStyleOverrides[paragraphElementId]) : false;

const updateIntroductionParagraphText = (value: string) => {
    if (!introductionParagraphConfig) return;
    originalTextRef.current[introductionParagraphConfig.elementId] = originalTextRef.current[introductionParagraphConfig.elementId] ?? introductionParagraphConfig.baseText;
    setTextOverride(introductionParagraphConfig.elementId, value);
  };

  const updateIntroductionParagraphStyle = (patch: ElementStyleOverride) => {
    if (!introductionParagraphConfig) return;
    setStyleOverride(introductionParagraphConfig.elementId, patch);
  };

  const getParagraphStyleValue = <K extends keyof ElementStyleOverride>(key: K): ElementStyleOverride[K] => {
    if (paragraphStyleOverride[key] !== undefined) return paragraphStyleOverride[key];
    return styleState[key as keyof DesignerStyleState] as ElementStyleOverride[K];
  };

  const resetIntroductionParagraphText = () => {
    if (!introductionParagraphConfig) return;
    resetTextOverride(introductionParagraphConfig.elementId);
  };

  const resetIntroductionParagraphStyle = () => {
    if (!introductionParagraphConfig) return;
resetStyleOverride(introductionParagraphConfig.elementId);
  };

  const resetIntroductionParagraphAll = () => {
    resetIntroductionParagraphText();
    resetIntroductionParagraphStyle();
  };

  const isCommitteeInspectorActive = selectedStructureNode?.id === 'committee';
  const baseCommitteeMembers: CommitteeMemberDraft[] = Array.isArray(reportPayload?.committeeMembers)
    ? reportPayload.committeeMembers.map((member: string) => parseCommitteeMemberDraft(member))
    : [];
  const committeeOverrideMembers = readCommitteeOverride(elementTextOverrides[COMMITTEE_CONTENT_ID]);
  const committeeMembers = committeeOverrideMembers || baseCommitteeMembers;
  const committeeStyleOverride = elementStyleOverrides[COMMITTEE_STYLE_ID] || {};
  const hasCommitteeContentOverride = elementTextOverrides[COMMITTEE_CONTENT_ID] !== undefined;
  const hasCommitteeStyleOverride = Boolean(elementStyleOverrides[COMMITTEE_STYLE_ID]);

const writeCommitteeMembers = (members: CommitteeMemberDraft[]) => {
    setTextOverride(COMMITTEE_CONTENT_ID, JSON.stringify(members));
  };

  const updateCommitteeMember = (index: number, key: keyof CommitteeMemberDraft, value: string) => {
    writeCommitteeMembers(committeeMembers.map((member, idx) => (idx === index ? { ...member, [key]: value } : member)));
  };

  const addCommitteeMember = () => {
    writeCommitteeMembers([...committeeMembers, { rank: '', name: '', role: '' }]);
  };

  const removeCommitteeMember = (index: number) => {
    writeCommitteeMembers(committeeMembers.filter((_, idx) => idx !== index));
  };

  const moveCommitteeMember = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= committeeMembers.length) return;
    const next = [...committeeMembers];
    [next[index], next[target]] = [next[target], next[index]];
    writeCommitteeMembers(next);
  };

  const updateCommitteeStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(COMMITTEE_STYLE_ID, patch);
  };

  const resetCommitteeContent = () => {
    resetTextOverride(COMMITTEE_CONTENT_ID);
  };

  const resetCommitteeStyle = () => {
    resetStyleOverride(COMMITTEE_STYLE_ID);
  };

  const resetCommitteeAll = () => {
    resetCommitteeContent();
    resetCommitteeStyle();
  };

  // ── Phase 10F: Summary Tables Inspector ──
  const isSummaryTablesInspectorActive = SUMMARY_TABLES_NODE_IDS.includes(selectedStructureNode?.id as any);
  const summaryTablesContentOverride = elementTextOverrides[SUMMARY_TABLES_CONTENT_ID];
  const summaryTablesStyleOverride = elementStyleOverrides[SUMMARY_TABLES_STYLE_ID] || {};
  const hasSummaryTablesContentOverride = summaryTablesContentOverride !== undefined;
  const hasSummaryTablesStyleOverride = Boolean(elementStyleOverrides[SUMMARY_TABLES_STYLE_ID]);

  const baseSummaryTableTitle = 'جدول المدراء والآمرين وشاغلي المناصب الأساسية';
  const summaryTableTitleValue = (() => {
    if (!summaryTablesContentOverride) return baseSummaryTableTitle;
    try {
      const parsed = JSON.parse(summaryTablesContentOverride);
      return String(parsed?.sectionTitle ?? baseSummaryTableTitle);
    } catch {
      return baseSummaryTableTitle;
    }
  })();

  const updateSummaryTableTitle = (value: string) => {
    setTextOverride(SUMMARY_TABLES_CONTENT_ID, JSON.stringify({ sectionTitle: value }));
  };

  const updateSummaryTablesStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(SUMMARY_TABLES_STYLE_ID, patch);
  };

  const getSummaryTablesStyleValue = <K extends keyof ElementStyleOverride>(key: K): ElementStyleOverride[K] => {
    if (summaryTablesStyleOverride[key] !== undefined) return summaryTablesStyleOverride[key];
    return styleState[key as keyof DesignerStyleState] as ElementStyleOverride[K];
  };

  const resetSummaryTablesContent = () => {
    resetTextOverride(SUMMARY_TABLES_CONTENT_ID);
  };

  const resetSummaryTablesStyle = () => {
    resetStyleOverride(SUMMARY_TABLES_STYLE_ID);
  };

  const resetSummaryTablesAll = () => {
    resetSummaryTablesContent();
    resetSummaryTablesStyle();
  };
  // ── End Phase 10F logic ──

  // ── Phase 10G: Official Notes Inspector ──
  const isOfficialNotesInspectorActive = OFFICIAL_NOTES_NODE_IDS.includes(selectedStructureNode?.id as any);

  const baseOfficialNotesData = (() => {
    const section = Array.isArray(reportPayload?.sections)
      ? reportPayload.sections.find((sec: any) => sec?.id === 'manual-notes' || sec?.isManual)
      : null;
    const result: OfficialNotesOverrideData = { positives: [], negatives: [], impediments: [], obstacles: [] };
    if (section) {
      for (const key of OFFICIAL_NOTES_LIST_TYPES) {
        const list = section[`${key}List`];
        result[key] = Array.isArray(list) ? list.map(String) : [];
      }
    }
    return result;
  })();

  const officialNotesContentOverride = readOfficialNotesOverride(elementTextOverrides[OFFICIAL_NOTES_CONTENT_ID]);
  const officialNotesData: OfficialNotesOverrideData = {
    positives: officialNotesContentOverride?.positives ?? baseOfficialNotesData.positives,
    negatives: officialNotesContentOverride?.negatives ?? baseOfficialNotesData.negatives,
    impediments: officialNotesContentOverride?.impediments ?? baseOfficialNotesData.impediments,
    obstacles: officialNotesContentOverride?.obstacles ?? baseOfficialNotesData.obstacles,
  };
  const officialNotesStyleOverride = elementStyleOverrides[OFFICIAL_NOTES_STYLE_ID] || {};
  const hasOfficialNotesContentOverride = elementTextOverrides[OFFICIAL_NOTES_CONTENT_ID] !== undefined;
  const hasOfficialNotesStyleOverride = Boolean(elementStyleOverrides[OFFICIAL_NOTES_STYLE_ID]);

  const writeOfficialNotesData = (data: OfficialNotesOverrideData) => {
    setTextOverride(OFFICIAL_NOTES_CONTENT_ID, JSON.stringify(data));
  };

  const updateOfficialNoteItem = (listType: OfficialNotesListType, index: number, value: string) => {
    const updated = { ...officialNotesData, [listType]: officialNotesData[listType].map((item, idx) => (idx === index ? value : item)) };
    writeOfficialNotesData(updated);
  };

  const addOfficialNoteItem = (listType: OfficialNotesListType) => {
    const updated = { ...officialNotesData, [listType]: [...officialNotesData[listType], ''] };
    writeOfficialNotesData(updated);
  };

  const removeOfficialNoteItem = (listType: OfficialNotesListType, index: number) => {
    const updated = { ...officialNotesData, [listType]: officialNotesData[listType].filter((_, idx) => idx !== index) };
    writeOfficialNotesData(updated);
  };

  const moveOfficialNoteItemUp = (listType: OfficialNotesListType, index: number) => {
    if (index <= 0) return;
    const list = [...officialNotesData[listType]];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    const updated = { ...officialNotesData, [listType]: list };
    writeOfficialNotesData(updated);
  };

  const moveOfficialNoteItemDown = (listType: OfficialNotesListType, index: number) => {
    const list = [...officialNotesData[listType]];
    if (index >= list.length - 1) return;
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    const updated = { ...officialNotesData, [listType]: list };
    writeOfficialNotesData(updated);
  };

  const updateOfficialNotesStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(OFFICIAL_NOTES_STYLE_ID, patch);
  };

  const getOfficialNotesStyleValue = <K extends keyof ElementStyleOverride>(key: K): ElementStyleOverride[K] => {
    if (officialNotesStyleOverride[key] !== undefined) return officialNotesStyleOverride[key];
    return styleState[key as keyof DesignerStyleState] as ElementStyleOverride[K];
  };

  const resetOfficialNotesContent = () => {
    resetTextOverride(OFFICIAL_NOTES_CONTENT_ID);
  };

  const resetOfficialNotesStyle = () => {
    resetStyleOverride(OFFICIAL_NOTES_STYLE_ID);
  };

  const resetOfficialNotesAll = () => {
    resetOfficialNotesContent();
    resetOfficialNotesStyle();
  };
  // ── End Phase 10G logic ──

  // ── Phase 10H: Recommendations Inspector ──
  const isRecommendationsInspectorActive = RECOMMENDATIONS_NODE_IDS.includes(selectedStructureNode?.id as any);

  const baseRecommendations: RecommendationDraftGroup[] = (() => {
    const raw = Array.isArray(reportPayload?.recommendations) ? reportPayload.recommendations : [];
    return raw.map((group: any) => ({
      id: group?.id,
      authority: String(group?.authority ?? ''),
      recs: Array.isArray(group?.recs) ? group.recs.map((rec: any) => ({
        id: rec?.id,
        text: String(rec?.text ?? ''),
        children: Array.isArray(rec?.children) ? rec.children.map((ch: any) => ({ id: ch?.id, text: String(ch?.text ?? '') })) : [],
      })) : [],
    }));
  })();

  const recommendationsOverride = readRecommendationsOverride(elementTextOverrides[RECOMMENDATIONS_CONTENT_ID]);
  const recommendationsData: RecommendationDraftGroup[] = recommendationsOverride || baseRecommendations;
  const recommendationsStyleOverride = elementStyleOverrides[RECOMMENDATIONS_STYLE_ID] || {};
  const hasRecommendationsContentOverride = elementTextOverrides[RECOMMENDATIONS_CONTENT_ID] !== undefined;
  const hasRecommendationsStyleOverride = Boolean(elementStyleOverrides[RECOMMENDATIONS_STYLE_ID]);

  const writeRecommendationsData = (groups: RecommendationDraftGroup[]) => {
    setTextOverride(RECOMMENDATIONS_CONTENT_ID, serializeRecommendationsOverride(groups));
  };

  const updateRecommendationGroup = (groupIdx: number, patch: Partial<Pick<RecommendationDraftGroup, 'authority'>>) => {
    const next = recommendationsData.map((g, i) => (i === groupIdx ? { ...g, ...patch } : g));
    writeRecommendationsData(next);
  };

  const updateRecommendationItem = (groupIdx: number, recIdx: number, text: string) => {
    const next = recommendationsData.map((g, i) => {
      if (i !== groupIdx) return g;
      const recs = g.recs.map((r, j) => (j === recIdx ? { ...r, text } : r));
      return { ...g, recs };
    });
    writeRecommendationsData(next);
  };

  const addRecommendationItem = (groupIdx: number) => {
    const next = recommendationsData.map((g, i) => {
      if (i !== groupIdx) return g;
      return { ...g, recs: [...g.recs, { text: '', children: [] }] };
    });
    writeRecommendationsData(next);
  };

  const removeRecommendationItem = (groupIdx: number, recIdx: number) => {
    const next = recommendationsData.map((g, i) => {
      if (i !== groupIdx) return g;
      return { ...g, recs: g.recs.filter((_, j) => j !== recIdx) };
    });
    writeRecommendationsData(next);
  };

  const moveRecommendationItem = (groupIdx: number, recIdx: number, direction: -1 | 1) => {
    const target = recIdx + direction;
    const group = recommendationsData[groupIdx];
    if (target < 0 || target >= group.recs.length) return;
    const next = recommendationsData.map((g, i) => {
      if (i !== groupIdx) return g;
      const recs = [...g.recs];
      [recs[recIdx], recs[target]] = [recs[target], recs[recIdx]];
      return { ...g, recs };
    });
    writeRecommendationsData(next);
  };

  const moveRecommendationGroup = (groupIdx: number, direction: -1 | 1) => {
    const target = groupIdx + direction;
    if (target < 0 || target >= recommendationsData.length) return;
    const next = [...recommendationsData];
    [next[groupIdx], next[target]] = [next[target], next[groupIdx]];
    writeRecommendationsData(next);
  };

  const addRecommendationGroup = () => {
    writeRecommendationsData([...recommendationsData, { authority: '', recs: [] }]);
  };

  const removeRecommendationGroup = (groupIdx: number) => {
    writeRecommendationsData(recommendationsData.filter((_, i) => i !== groupIdx));
  };

  const updateRecommendationsStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(RECOMMENDATIONS_STYLE_ID, patch);
  };

  const resetRecommendationsContent = () => {
    resetTextOverride(RECOMMENDATIONS_CONTENT_ID);
  };

  const resetRecommendationsStyle = () => {
    resetStyleOverride(RECOMMENDATIONS_STYLE_ID);
  };

  const resetRecommendationsAll = () => {
    resetRecommendationsContent();
    resetRecommendationsStyle();
  };
  // ── End Phase 10H logic ──

  // ── Phase 10I: Appendices Inspector ──
  const isAppendicesInspectorActive = APPENDICES_NODE_IDS.includes(selectedStructureNode?.id as any);

  const baseAppendices: AppendixDraft[] = (() => {
    const raw = Array.isArray(reportPayload?.appendices) ? reportPayload.appendices : [];
    return raw.filter((a: any) => a?.visible).map((a: any) => ({
      id: a?.id,
      symbol: String(a?.symbol ?? ''),
      text: String(a?.text ?? ''),
    }));
  })();

  const appendicesOverride = readAppendicesOverride(elementTextOverrides[APPENDICES_CONTENT_ID]);
  const appendicesData: AppendixDraft[] = appendicesOverride || baseAppendices;
  const appendicesStyleOverride = elementStyleOverrides[APPENDICES_STYLE_ID] || {};
  const hasAppendicesContentOverride = elementTextOverrides[APPENDICES_CONTENT_ID] !== undefined;
  const hasAppendicesStyleOverride = Boolean(elementStyleOverrides[APPENDICES_STYLE_ID]);

  const writeAppendicesData = (items: AppendixDraft[]) => {
    setTextOverride(APPENDICES_CONTENT_ID, JSON.stringify(items));
  };

  const updateAppendixSymbol = (index: number, symbol: string) => {
    const next = appendicesData.map((a, i) => (i === index ? { ...a, symbol } : a));
    writeAppendicesData(next);
  };

  const updateAppendixText = (index: number, text: string) => {
    const next = appendicesData.map((a, i) => (i === index ? { ...a, text } : a));
    writeAppendicesData(next);
  };

  const addAppendix = () => {
    writeAppendicesData([...appendicesData, { symbol: '', text: '' }]);
  };

  const removeAppendix = (index: number) => {
    writeAppendicesData(appendicesData.filter((_, i) => i !== index));
  };

  const moveAppendixUp = (index: number) => {
    if (index === 0) return;
    const next = [...appendicesData];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    writeAppendicesData(next);
  };

  const moveAppendixDown = (index: number) => {
    if (index >= appendicesData.length - 1) return;
    const next = [...appendicesData];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    writeAppendicesData(next);
  };

  const updateAppendicesStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(APPENDICES_STYLE_ID, patch);
  };

  const resetAppendicesContent = () => {
    resetTextOverride(APPENDICES_CONTENT_ID);
  };

  const resetAppendicesStyle = () => {
    resetStyleOverride(APPENDICES_STYLE_ID);
  };

  const resetAppendicesAll = () => {
    resetAppendicesContent();
    resetAppendicesStyle();
  };
  // ── End Phase 10I logic ──

  // ── Phase 10J: Final Evaluation Inspector ──
  const isFinalEvaluationInspectorActive = FINAL_EVALUATION_NODE_IDS.includes(selectedStructureNode?.id as any);

  const baseFinalEvalText = (() => {
    const fe = reportPayload?.finalEvaluation;
    return fe?.statement ? String(fe.statement) : '';
  })();

  const finalEvalContentOverride = elementTextOverrides[FINAL_EVALUATION_CONTENT_ID];
  const finalEvalTextValue = finalEvalContentOverride ?? baseFinalEvalText;
  const finalEvalStyleOverride = elementStyleOverrides[FINAL_EVALUATION_STYLE_ID] || {};
  const hasFinalEvalContentOverride = finalEvalContentOverride !== undefined;
  const hasFinalEvalStyleOverride = Boolean(elementStyleOverrides[FINAL_EVALUATION_STYLE_ID]);

  const updateFinalEvalText = (value: string) => {
    setTextOverride(FINAL_EVALUATION_CONTENT_ID, value);
  };

  const updateFinalEvalStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(FINAL_EVALUATION_STYLE_ID, patch);
  };

  const getFinalEvalStyleValue = <K extends keyof ElementStyleOverride>(key: K): ElementStyleOverride[K] => {
    if (finalEvalStyleOverride[key] !== undefined) return finalEvalStyleOverride[key];
    return styleState[key as keyof DesignerStyleState] as ElementStyleOverride[K];
  };

  const resetFinalEvalContent = () => {
    resetTextOverride(FINAL_EVALUATION_CONTENT_ID);
  };

  const resetFinalEvalStyle = () => {
    resetStyleOverride(FINAL_EVALUATION_STYLE_ID);
  };

  const resetFinalEvalAll = () => {
    resetFinalEvalContent();
    resetFinalEvalStyle();
  };
  // ── End Phase 10J logic ──

  // ── Phase 10K: Signatures Inspector ──
  const isSignaturesInspectorActive = SIGNATURES_NODE_IDS.includes(selectedStructureNode?.id as any);

  const baseSignatures: SignatureDraft[] = (() => {
    const sig = reportPayload?.signatures;
    if (!sig) return [];
    const result: SignatureDraft[] = [];
    if (sig.leaderRank || sig.leaderName || sig.leaderRole) {
      result.push({ rank: String(sig.leaderRank ?? ''), name: String(sig.leaderName ?? ''), role: String(sig.leaderRole ?? '') });
    }
    if (sig.deputyRank || sig.deputyName || sig.deputyRole) {
      result.push({ rank: String(sig.deputyRank ?? ''), name: String(sig.deputyName ?? ''), role: String(sig.deputyRole ?? '') });
    }
    return result;
  })();

  const signaturesOverride = readSignaturesOverride(elementTextOverrides[SIGNATURES_CONTENT_ID]);
  const signaturesData: SignatureDraft[] = signaturesOverride || baseSignatures;
  const signaturesStyleOverride = elementStyleOverrides[SIGNATURES_STYLE_ID] || {};
  const hasSignaturesContentOverride = elementTextOverrides[SIGNATURES_CONTENT_ID] !== undefined;
  const hasSignaturesStyleOverride = Boolean(elementStyleOverrides[SIGNATURES_STYLE_ID]);

  const writeSignaturesData = (items: SignatureDraft[]) => {
    setTextOverride(SIGNATURES_CONTENT_ID, JSON.stringify(items));
  };

  const updateSignatureItem = (index: number, key: keyof SignatureDraft, value: string) => {
    const next = signaturesData.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    writeSignaturesData(next);
  };

  const addSignatureItem = () => {
    writeSignaturesData([...signaturesData, { rank: '', name: '', role: '' }]);
  };

  const removeSignatureItem = (index: number) => {
    writeSignaturesData(signaturesData.filter((_, i) => i !== index));
  };

  const moveSignatureItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= signaturesData.length) return;
    const next = [...signaturesData];
    [next[index], next[target]] = [next[target], next[index]];
    writeSignaturesData(next);
  };

  const updateSignaturesStyle = (patch: ElementStyleOverride) => {
    setStyleOverride(SIGNATURES_STYLE_ID, patch);
  };

  const resetSignaturesContent = () => {
    resetTextOverride(SIGNATURES_CONTENT_ID);
  };

  const resetSignaturesStyle = () => {
    resetStyleOverride(SIGNATURES_STYLE_ID);
  };

  const resetSignaturesAll = () => {
    resetSignaturesContent();
    resetSignaturesStyle();
  };
  // ── End Phase 10K logic ──
  // ── Phase 24B: Section Inspector ──
  const isSectionInspectorActive = SECTIONS_NODE_IDS.includes(selectedStructureNode?.id as any);

  const visibleSections: Array<{ sec: any; si: number }> = (() => {
    const raw = Array.isArray(reportPayload?.sections) ? reportPayload.sections : [];
    return raw
      .map((sec: any, si: number) => ({ sec, si }))
      .filter(({ sec }: { sec: any }) => sec?.visible !== false && !sec?.isManual);
  })();

  const [sectionCollapsed, setSectionCollapsed] = React.useState<Record<number, boolean>>({});

  // Phase 46B — Stable fragment ID key generators
  const secId = (sec: any) => sec?.id;
  const subId = (sub: any) => sub?.id;
  const contentHash = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash |= 0; }
    return Math.abs(hash).toString(36);
  };

  const getSectionTitleKey = (sec: any) => `section/${secId(sec)}:subheading`;
  const getSectionNarrativeKey = (sec: any) => `section/${secId(sec)}/narrative:paragraph`;
  const getSubsectionTitleKey = (sub: any) => `subsection/${subId(sub)}:subheading`;
  const getFindingKey = (sub: any, text: string) => `subsection/${subId(sub)}/finding/${contentHash(text)}:paragraph`;
  const getSubsectionNarrativeKey = (sub: any) => `subsection/${subId(sub)}/narrative:paragraph`;
  const getSectionListKey = (sec: any, type: string, text: string) => `section/${secId(sec)}/list/${type}/${contentHash(text)}:paragraph`;
  const getSubsectionListKey = (sub: any, type: string, text: string) => `subsection/${subId(sub)}/list/${type}/${contentHash(text)}:paragraph`;

  const getSectionTitleValue = (baseSec: any) =>
    elementTextOverrides[getSectionTitleKey(baseSec)] ?? String(baseSec?.title || '');
  const getSectionNarrativeValue = (baseSec: any) =>
    elementTextOverrides[getSectionNarrativeKey(baseSec)] ?? String(baseSec?.narrativeText || '');
  const getSubsectionTitleValue = (baseSub: any) =>
    elementTextOverrides[getSubsectionTitleKey(baseSub)] ?? String(baseSub?.title || '');
  const getFindingValue = (baseText: string, sub: any) =>
    elementTextOverrides[getFindingKey(sub, baseText)] ?? baseText;
  const getSubsectionNarrativeValue = (baseSub: any) =>
    elementTextOverrides[getSubsectionNarrativeKey(baseSub)] ?? String(baseSub?.narrativeText || '');
  const getSectionListValue = (type: string, baseText: string, sec: any) =>
    elementTextOverrides[getSectionListKey(sec, type, baseText)] ?? baseText;
  const getSubsectionListValue = (type: string, baseText: string, sub: any) =>
    elementTextOverrides[getSubsectionListKey(sub, type, baseText)] ?? baseText;

  const updateSectionTitle = (sec: any, value: string) => setTextOverride(getSectionTitleKey(sec), value);
  const updateSectionNarrative = (sec: any, value: string) => setTextOverride(getSectionNarrativeKey(sec), value);
  const updateSubsectionTitle = (sub: any, value: string) => setTextOverride(getSubsectionTitleKey(sub), value);
  const updateFindingItem = (sub: any, text: string, value: string) => setTextOverride(getFindingKey(sub, text), value);
  const updateSubsectionNarrative = (sub: any, value: string) => setTextOverride(getSubsectionNarrativeKey(sub), value);
  const updateSectionListItem = (sec: any, type: string, text: string, value: string) => setTextOverride(getSectionListKey(sec, type, text), value);
  const updateSubsectionListItem = (sub: any, type: string, text: string, value: string) => setTextOverride(getSubsectionListKey(sub, type, text), value);

  const resetSectionTitle = (sec: any) => resetTextOverride(getSectionTitleKey(sec));
  const resetSectionNarrative = (sec: any) => resetTextOverride(getSectionNarrativeKey(sec));
  const resetSubsectionTitle = (sub: any) => resetTextOverride(getSubsectionTitleKey(sub));
  const resetFindingItem = (sub: any, text: string) => resetTextOverride(getFindingKey(sub, text));
  const resetSubsectionNarrative = (sub: any) => resetTextOverride(getSubsectionNarrativeKey(sub));
  const resetSectionListItem = (sec: any, type: string, text: string) => resetTextOverride(getSectionListKey(sec, type, text));
  const resetSubsectionListItem = (sub: any, type: string, text: string) => resetTextOverride(getSubsectionListKey(sub, type, text));

  const hasSectionOverride = (baseSec: any): boolean => {
    if (elementTextOverrides[getSectionTitleKey(baseSec)] !== undefined) return true;
    if (baseSec?.narrativeText && elementTextOverrides[getSectionNarrativeKey(baseSec)] !== undefined) return true;
    const SECTION_LIST_TYPES_LOCAL = ['positives', 'negatives', 'impediments', 'obstacles'] as const;
    const showFlagFn = (type: string) => `show${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    for (const type of SECTION_LIST_TYPES_LOCAL) {
      if (baseSec?.[showFlagFn(type)] && Array.isArray(baseSec?.[`${type}List`])) {
        for (let k = 0; k < baseSec[`${type}List`].length; k++) {
          if (elementTextOverrides[getSectionListKey(baseSec, type, baseSec[`${type}List`][k])] !== undefined) return true;
        }
      }
    }
    const subs = Array.isArray(baseSec?.subsections) ? baseSec.subsections : [];
    return subs.some((sub: any) => {
      if (elementTextOverrides[getSubsectionTitleKey(sub)] !== undefined) return true;
      if (sub?.narrativeText && elementTextOverrides[getSubsectionNarrativeKey(sub)] !== undefined) return true;
      const findings = Array.isArray(sub?.findings) ? sub.findings : [];
      if (findings.some((text: string) => elementTextOverrides[getFindingKey(sub, text)] !== undefined)) return true;
      for (const type of SECTION_LIST_TYPES_LOCAL) {
        if (sub?.[showFlagFn(type)] && Array.isArray(sub?.[`${type}List`])) {
          for (let k = 0; k < sub[`${type}List`].length; k++) {
            if (elementTextOverrides[getSubsectionListKey(sub, type, sub[`${type}List`][k])] !== undefined) return true;
          }
        }
      }
      return false;
    });
  };

  const resetSectionAll = (baseSec: any) => {
    resetSectionTitle(baseSec);
    if (baseSec?.narrativeText) resetSectionNarrative(baseSec);
    const SECTION_LIST_TYPES_LOCAL = ['positives', 'negatives', 'impediments', 'obstacles'] as const;
    const showFlagFn = (type: string) => `show${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    for (const type of SECTION_LIST_TYPES_LOCAL) {
      if (baseSec?.[showFlagFn(type)] && Array.isArray(baseSec?.[`${type}List`])) {
        for (let k = 0; k < baseSec[`${type}List`].length; k++) {
          resetSectionListItem(baseSec, type, baseSec[`${type}List`][k]);
        }
      }
    }
    const subs = Array.isArray(baseSec?.subsections) ? baseSec.subsections : [];
    subs.forEach((sub: any) => {
      resetSubsectionTitle(sub);
      if (sub?.narrativeText) resetSubsectionNarrative(sub);
      const findings = Array.isArray(sub?.findings) ? sub.findings : [];
      findings.forEach((text: string) => resetFindingItem(sub, text));
      for (const type of SECTION_LIST_TYPES_LOCAL) {
        if (sub?.[showFlagFn(type)] && Array.isArray(sub?.[`${type}List`])) {
          for (let k = 0; k < sub[`${type}List`].length; k++) {
            resetSubsectionListItem(sub, type, sub[`${type}List`][k]);
          }
        }
      }
    });
  };
  // ── End Phase 24B/24H logic ──


  const selectedNodeHasRenderedAnchor = Boolean(
    selectedStructureNode?.canvasAnchorId && fragments.some((fragment) => fragment.id === selectedStructureNode.canvasAnchorId)
  );
  void selectedNodeHasRenderedAnchor;

  const getSectionIndexFromFragmentIndex = (fragIndex: number, frags: Fragment[]): number => {
    if (fragIndex < 0 || fragIndex >= frags.length) return -1;
    const id = frags[fragIndex].id;
    const match = id.match(/^sec-(\d+)-/);
    if (match) return parseInt(match[1], 10);
    let sectionCount = 0;
    for (let i = 0; i <= fragIndex; i++) {
      if (frags[i].id.startsWith('section/')) sectionCount++;
    }
    return sectionCount - 1;
  };


  const renderPropertiesPanel = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#e2e8f0',
          borderRadius: '7px',
          padding: '7px 8px',
          backgroundColor: activePropertiesTab === tab ? '#ede9fe' : '#ffffff',
          color: activePropertiesTab === tab ? '#5b21b6' : '#475569',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 800,
        }}
      >
        {label}
      </button>
    );

    if (!selectedElementType) {
      return (
        <aside
          style={{
            position: 'sticky',
            top: '12px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            padding: '16px',
            minHeight: '220px',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#0f172a' }}>الخصائص</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>
            اختر عنصراً داخل صفحة A4 لتظهر خصائصه هنا. مساحة المعاينة تبقى نظيفة ولا تظهر فوقها أدوات تحرير.
          </p>
        </aside>
      );
    }

    const textContent = canEditSelectedText ? (
      <div style={panelGroupStyle}>
        <div>
          <label style={panelLabelStyle}>تعديل النص</label>
          <textarea
            value={selectedElementText}
            onChange={(e) => updateSelectedText(e.target.value)}
            rows={7}
            style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
          />
        </div>
        <button type="button" onClick={resetSelectedText} disabled={!hasSelectedTextOverride} style={panelButtonStyle}>
          إعادة ضبط النص
        </button>
      </div>
    ) : (
      <div style={{ ...panelGroupStyle, color: '#64748b', fontSize: '13px', lineHeight: 1.7 }}>
        ظ‡ط°ط§ ط§ظ„ط¹ظ†طµط± ظ„ط§ ظٹظ…ظ„ظƒ ظ†طµط§ظ‹ ظ…ط¨ط§ط´ط±ط§ظ‹ ظ‚ط§ط¨ظ„ط§ظ‹ ظ„ظ„طھط­ط±ظٹط± ظپظٹ ظ‡ط°ظ‡ ط§ظ„ظ…ط±ط­ظ„ط©.
      </div>
    );

    const fontControls = (
      <div style={panelGroupStyle}>
        <strong style={{ color: '#334155', fontSize: '13px' }}>الخط</strong>
        {selectedElementType === 'mainTitle' && (
          <div>
            <label style={panelLabelStyle}>نوع الخط</label>
            <select value={getSelectedStyleValue('mainTitleFontFamily')} onChange={(e) => updateSelectedStyle('mainTitleFontFamily', e.target.value as FontFamilyChoice)} style={panelControlStyle}>
              <option value="Cairo">Cairo</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
        )}
        {(selectedElementType === 'mainTitle' || selectedElementType === 'numbering' || selectedElementType === 'paragraph' || selectedElementType === 'subheading') && (
          <>
            <div>
              <label style={panelLabelStyle}>حجم الخط</label>
              <input
                type="number"
                min={9}
                max={32}
                step={0.5}
                value={
                  selectedElementType === 'mainTitle'
                    ? getSelectedStyleValue('mainTitleFontSize')
                    : selectedElementType === 'numbering'
                      ? getSelectedStyleValue('numberingFontSize')
                      : getSelectedStyleValue('paragraphFontSize')
                }
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (selectedElementType === 'mainTitle') updateSelectedStyle('mainTitleFontSize', value);
                  else if (selectedElementType === 'numbering') updateSelectedStyle('numberingFontSize', value);
                  else updateSelectedStyle('paragraphFontSize', value);
                }}
                style={panelControlStyle}
              />
            </div>
            <div>
              <label style={panelLabelStyle}>لون النص</label>
              <input
                type="color"
                value={
                  selectedElementType === 'mainTitle'
                    ? getSelectedStyleValue('mainTitleColor')
                    : selectedElementType === 'numbering'
                      ? getSelectedStyleValue('numberingColor')
                      : getSelectedStyleValue('paragraphColor')
                }
                onChange={(e) => {
                  if (selectedElementType === 'mainTitle') updateSelectedStyle('mainTitleColor', e.target.value);
                  else if (selectedElementType === 'numbering') updateSelectedStyle('numberingColor', e.target.value);
                  else updateSelectedStyle('paragraphColor', e.target.value);
                }}
                style={{ ...panelControlStyle, padding: '3px' }}
              />
            </div>
            <div>
              <label style={panelLabelStyle}>السماكة</label>
              <select
                value={
                  selectedElementType === 'mainTitle'
                    ? getSelectedStyleValue('mainTitleWeight')
                    : selectedElementType === 'numbering'
                      ? getSelectedStyleValue('numberingWeight')
                      : 'normal'
                }
                onChange={(e) => {
                  if (selectedElementType === 'mainTitle') updateSelectedStyle('mainTitleWeight', e.target.value as FontWeightChoice);
                  else if (selectedElementType === 'numbering') updateSelectedStyle('numberingWeight', e.target.value as FontWeightChoice);
                }}
                disabled={selectedElementType === 'paragraph' || selectedElementType === 'subheading'}
                style={panelControlStyle}
              >
                <option value="bold">عريض</option>
                <option value="normal">عادي</option>
              </select>
            </div>
          </>
        )}
        {(selectedElementType === 'table' || selectedElementType === 'tableCell') && (
          <>
            <div>
              <label style={panelLabelStyle}>حجم خط الجدول</label>
              <input type="number" min={9} max={18} step={0.5} value={getSelectedStyleValue('tableFontSize')} onChange={(e) => updateSelectedStyle('tableFontSize', Number(e.target.value))} style={panelControlStyle} />
            </div>
            <div>
              <label style={panelLabelStyle}>السماكة</label>
              <select value={getSelectedStyleValue('tableFontWeight')} onChange={(e) => updateSelectedStyle('tableFontWeight', e.target.value as FontWeightChoice)} style={panelControlStyle}>
                <option value="normal">عادي</option>
                <option value="bold">عريض</option>
              </select>
            </div>
          </>
        )}
      </div>
    );

    const tableControls = (selectedElementType === 'table' || selectedElementType === 'tableCell') && (
      <>
        <div style={panelGroupStyle}>
          <strong style={{ color: '#334155', fontSize: '13px' }}>الحدود</strong>
          <div>
            <label style={panelLabelStyle}>عرض الحدود</label>
            <select value={getSelectedStyleValue('tableBorderWidth')} onChange={(e) => updateSelectedStyle('tableBorderWidth', Number(e.target.value) as TableBorderWidthChoice)} style={panelControlStyle}>
              <option value={0}>0 px</option>
              <option value={1}>1 px</option>
              <option value={2}>2 px</option>
              <option value={3}>3 px</option>
            </select>
          </div>
          <div>
            <label style={panelLabelStyle}>لون الحدود</label>
            <input type="color" value={getSelectedStyleValue('tableBorderColor')} onChange={(e) => updateSelectedStyle('tableBorderColor', e.target.value)} style={{ ...panelControlStyle, padding: '3px' }} />
          </div>
        </div>
        <div style={panelGroupStyle}>
          <strong style={{ color: '#334155', fontSize: '13px' }}>الخلية</strong>
          <div>
            <label style={panelLabelStyle}>تباعد الخلايا</label>
            <select value={getSelectedStyleValue('tableCellPadding')} onChange={(e) => updateSelectedStyle('tableCellPadding', e.target.value as TableCellPaddingChoice)} style={panelControlStyle}>
              <option value="compact">مضغوط</option>
              <option value="normal">عادي</option>
              <option value="comfortable">مريح</option>
            </select>
          </div>
        </div>
        <div style={panelGroupStyle}>
          <strong style={{ color: '#334155', fontSize: '13px' }}>الرأس</strong>
          <div>
            <label style={panelLabelStyle}>خلفية الرأس</label>
            <input type="color" value={getSelectedStyleValue('tableHeaderBackgroundColor')} onChange={(e) => updateSelectedStyle('tableHeaderBackgroundColor', e.target.value)} style={{ ...panelControlStyle, padding: '3px' }} />
          </div>
          <div>
            <label style={panelLabelStyle}>نص الرأس</label>
            <input type="color" value={getSelectedStyleValue('tableHeaderTextColor')} onChange={(e) => updateSelectedStyle('tableHeaderTextColor', e.target.value)} style={{ ...panelControlStyle, padding: '3px' }} />
          </div>
        </div>
      </>
    );

    return (
      <aside
        style={{
          position: 'sticky',
          top: '12px',
          alignSelf: 'start',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          padding: '14px',
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>الخصائص</h3>
          <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
            Selected: <strong style={{ color: '#4c1d95' }}>{SELECTED_ELEMENT_LABELS[selectedElementType]}</strong>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
          {tabButton('content', 'المحتوى')}
          {tabButton('style', 'التنسيق')}
          {tabButton('layout', 'التخطيط')}
          {tabButton('actions', 'الإجراءات')}
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {activePropertiesTab === 'content' && textContent}
          {activePropertiesTab === 'style' && (
            <>
              {fontControls}
              {tableControls}
              {!tableControls && selectedElementType === 'page' && (
                <div style={{ ...panelGroupStyle, color: '#64748b', fontSize: '13px' }}>ط§ط³طھط®ط¯ظ… طھط¨ظˆظٹط¨ Layout ظ„طھط¹ط¯ظٹظ„ ط­ط¯ظˆط¯ ط§ظ„طµظپط­ط© ظˆظ…ظ†ط·ظ‚ط© ط§ظ„ظ…ط­طھظˆظ‰.</div>
              )}
            </>
          )}
          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <strong style={{ color: '#334155', fontSize: '13px' }}>التخطيط</strong>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                <input type="checkbox" checked={getSelectedStyleValue('showPageBorder')} onChange={(e) => updateSelectedStyle('showPageBorder', e.target.checked)} />
                حدود الصفحة
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                <input type="checkbox" checked={getSelectedStyleValue('showContentBounds')} onChange={(e) => updateSelectedStyle('showContentBounds', e.target.checked)} />
                مساحة المحتوى
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                <input type="checkbox" checked={getSelectedStyleValue('showSafeArea')} onChange={(e) => updateSelectedStyle('showSafeArea', e.target.checked)} />
                Safe Area
              </label>
              {(selectedElementType === 'paragraph' || selectedElementType === 'subheading') && (
                <div>
                  <label style={panelLabelStyle}>ارتفاع السطر</label>
                  <input type="number" min={1.2} max={2.4} step={0.1} value={getSelectedStyleValue('paragraphLineHeight')} onChange={(e) => updateSelectedStyle('paragraphLineHeight', Number(e.target.value))} style={panelControlStyle} />
                </div>
              )}
            </div>
          )}
          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={copySelectedStyle} style={panelButtonStyle}>نسخ التنسيق</button>
              <button type="button" onClick={pasteSelectedStyle} disabled={!copiedStyle} style={panelButtonStyle}>لصق التنسيق</button>
              <button type="button" onClick={resetSelectedStyle} disabled={!hasSelectedStyleOverride} style={panelButtonStyle}>إعادة ضبط التنسيق</button>
              {canEditSelectedText && <button type="button" onClick={resetSelectedText} disabled={!hasSelectedTextOverride} style={panelButtonStyle}>إعادة ضبط النص</button>}
              <button type="button" onClick={resetSelectedAll} disabled={!hasSelectedStyleOverride && !hasSelectedTextOverride} style={panelButtonStyle}>إعادة ضبط العنصر</button>
              <button type="button" onClick={resetAllTextEdits} disabled={Object.keys(elementTextOverrides).length === 0} style={panelButtonStyle}>إعادة ضبط كل النصوص</button>
              <button type="button" onClick={resetAllOverrides} disabled={Object.keys(elementStyleOverrides).length === 0 && Object.keys(elementTextOverrides).length === 0} style={panelButtonStyle}>إعادة ضبط الكل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };

  // Phase 9F keeps the real inspector parked behind a professional placeholder shell.
  // Keep the renderer available for the next phase without mounting it here.
  void renderPropertiesPanel;

  const renderTitleInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const titleAlign = (getTitleStyleValue('titleTextAlign') || 'center') as TitleTextAlignChoice;
    const titleSpacingBefore = Number(getTitleStyleValue('titleSpacingBefore') ?? 0);
    const titleSpacingAfter = Number(getTitleStyleValue('titleSpacingAfter') ?? 10);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص العنوان">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص العنوان</h3>
          <p style={shellPanelHintStyle}>تحرير العنوان الرئيسي فقط. تحفظ التعديلات داخل المسودة والمعاينة.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>نص العنوان الرئيسي</label>
                <textarea
                  value={titleTextValue}
                  onChange={(event) => updateTitleText(event.target.value)}
                  rows={5}
                  style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                />
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                يتم تحديث معاينة A4 فقط دون تغيير بيانات التقرير الأصلية.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input
                  type="number"
                  min={14}
                  max={40}
                  step={1}
                  value={Number(getTitleStyleValue('mainTitleFontSize') ?? styleState.mainTitleFontSize)}
                  onChange={(event) => updateTitleStyle({ mainTitleFontSize: Number(event.target.value) })}
                  style={panelControlStyle}
                />
              </div>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input
                  type="color"
                  value={String(getTitleStyleValue('mainTitleColor') ?? styleState.mainTitleColor)}
                  onChange={(event) => updateTitleStyle({ mainTitleColor: event.target.value })}
                  style={{ ...panelControlStyle, padding: '3px' }}
                />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select
                  value={String(getTitleStyleValue('mainTitleWeight') ?? styleState.mainTitleWeight)}
                  onChange={(event) => updateTitleStyle({ mainTitleWeight: event.target.value as FontWeightChoice })}
                  style={panelControlStyle}
                >
                  <option value="bold">عريض</option>
                  <option value="normal">عادي</option>
                </select>
              </div>
              <div>
                <label style={panelLabelStyle}>محاذاة النص</label>
                <select
                  value={titleAlign}
                  onChange={(event) => updateTitleStyle({ titleTextAlign: event.target.value as TitleTextAlignChoice })}
                  style={panelControlStyle}
                >
                  <option value="right">يمين</option>
                  <option value="center">وسط</option>
                  <option value="left">يسار</option>
                </select>
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  step={2}
                  value={titleSpacingBefore}
                  onChange={(event) => updateTitleStyle({ titleSpacingBefore: Number(event.target.value) })}
                  style={panelControlStyle}
                />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  step={2}
                  value={titleSpacingAfter}
                  onChange={(event) => updateTitleStyle({ titleSpacingAfter: Number(event.target.value) })}
                  style={panelControlStyle}
                />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetTitleText} disabled={!hasTitleTextOverride} style={panelButtonStyle}>إعادة ضبط نص العنوان</button>
              <button type="button" onClick={resetTitleStyle} disabled={!hasTitleStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق العنوان</button>
              <button type="button" onClick={resetTitleAll} disabled={!hasTitleTextOverride && !hasTitleStyleOverride} style={panelButtonStyle}>إعادة ضبط العنوان بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  const renderIntroductionParagraphInspector = () => {
    if (!introductionParagraphConfig) return null;

    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const paragraphFontSize = Number(getParagraphStyleValue('paragraphFontSize') ?? styleState.paragraphFontSize);
    const paragraphColor = String(getParagraphStyleValue('paragraphColor') ?? styleState.paragraphColor);
    const paragraphWeight = (getParagraphStyleValue('paragraphFontWeight') || 'normal') as FontWeightChoice;
    const paragraphLineHeight = Number(getParagraphStyleValue('paragraphLineHeight') ?? styleState.paragraphLineHeight);
    const paragraphSpacingBefore = Number(getParagraphStyleValue('paragraphSpacingBefore') ?? 0);
    const paragraphSpacingAfter = Number(getParagraphStyleValue('paragraphSpacingAfter') ?? 20);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص الفقرة">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص الفقرة</h3>
          <p style={shellPanelHintStyle}>{introductionParagraphConfig.label} فقط. التعديلات تبقى داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>{introductionParagraphConfig.label}</label>
                <textarea
                  value={paragraphTextValue}
                  onChange={(event) => updateIntroductionParagraphText(event.target.value)}
                  rows={6}
                  style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                />
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                تعديل للمعاينة فقط. تبقى بيانات التقرير الرسمية بدون تغيير.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input type="number" min={10} max={24} step={0.5} value={paragraphFontSize} onChange={(event) => updateIntroductionParagraphStyle({ paragraphFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input type="color" value={paragraphColor} onChange={(event) => updateIntroductionParagraphStyle({ paragraphColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select value={paragraphWeight} onChange={(event) => updateIntroductionParagraphStyle({ paragraphFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div>
                <label style={panelLabelStyle}>ارتفاع السطر</label>
                <input type="number" min={1.2} max={2.6} step={0.1} value={paragraphLineHeight} onChange={(event) => updateIntroductionParagraphStyle({ paragraphLineHeight: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={paragraphSpacingBefore} onChange={(event) => updateIntroductionParagraphStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={paragraphSpacingAfter} onChange={(event) => updateIntroductionParagraphStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetIntroductionParagraphText} disabled={!hasParagraphTextOverride} style={panelButtonStyle}>إعادة ضبط النص</button>
              <button type="button" onClick={resetIntroductionParagraphStyle} disabled={!hasParagraphStyleOverride} style={panelButtonStyle}>إعادة ضبط التنسيق</button>
              <button type="button" onClick={resetIntroductionParagraphAll} disabled={!hasParagraphTextOverride && !hasParagraphStyleOverride} style={panelButtonStyle}>إعادة ضبط الكل</button>
            </div>
          )}
      </div>
      </aside>
    );
  };
  const renderIntroHeadingInspector = () => {
    const getLabel = () => {
      if (selectedElementId === 'frag-assignment:numbering:0') return '١. التكليف';
      if (selectedElementId === 'frag-committee:numbering:0') return '٢. التأليف';
      if (selectedElementId === 'frag-purpose:numbering:0') return '٣. الغاية';
      if (selectedElementId === 'frag-visit-date:numbering:0') return '٤. تاريخ التفتيش';
      return selectedElementId || 'Heading';
    };
    const hasStyleOverride = Boolean(selectedElementId && elementStyleOverrides[selectedElementId]);
    const iTabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );
    return (
      <aside style={shellPanelStyle} aria-label="خصائص الترقيم">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص الترقيم</h3>
          <p style={shellPanelHintStyle}>{getLabel()} — تعديلات الترقيم والعنوان فقط.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {iTabButton('style', 'التنسيق')}
            {iTabButton('actions', 'الإجراءات')}
          </div>
          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input
                  type="color"
                  value={String(getSelectedStyleValue('numberingColor') ?? styleState.numberingColor)}
                  onChange={(event) => updateSelectedStyle('numberingColor', event.target.value)}
                  style={{ ...panelControlStyle, padding: '3px' }}
                />
              </div>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input
                  type="number"
                  min={10}
                  max={28}
                  step={0.5}
                  value={Number(getSelectedStyleValue('numberingFontSize') ?? styleState.numberingFontSize)}
                  onChange={(event) => updateSelectedStyle('numberingFontSize', Number(event.target.value))}
                  style={panelControlStyle}
                />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select
                  value={String(getSelectedStyleValue('numberingWeight') ?? styleState.numberingWeight)}
                  onChange={(event) => updateSelectedStyle('numberingWeight', event.target.value as FontWeightChoice)}
                  style={panelControlStyle}
                >
                  <option value="bold">عريض</option>
                  <option value="normal">عادي</option>
                </select>
              </div>
            </div>
          )}
          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button
                type="button"
                onClick={() => { if (selectedElementId) resetStyleOverride(selectedElementId); }}
                disabled={!hasStyleOverride}
                style={panelButtonStyle}
              >
                إعادة ضبط التنسيق
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  const renderCommitteeInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const committeeFontSize = Number(committeeStyleOverride.tableFontSize ?? 15);
    const committeeColor = String(committeeStyleOverride.paragraphColor ?? styleState.paragraphColor);
    const committeeWeight = (committeeStyleOverride.tableFontWeight || 'normal') as FontWeightChoice;

    return (
      <aside style={shellPanelStyle} aria-label="خصائص التأليف">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص التأليف</h3>
          <p style={shellPanelHintStyle}>تحرير التأليف فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {committeeMembers.map((member, index) => (
                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                    <strong style={{ color: '#334155', fontSize: '12px' }}>عضو اللجنة {index + 1}</strong>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => moveCommitteeMember(index, -1)} disabled={index === 0} style={{ ...panelButtonStyle, padding: '5px 7px', fontSize: '11px' }}>تحريك للأعلى</button>
                      <button type="button" onClick={() => moveCommitteeMember(index, 1)} disabled={index === committeeMembers.length - 1} style={{ ...panelButtonStyle, padding: '5px 7px', fontSize: '11px' }}>تحريك للأسفل</button>
                      <button type="button" onClick={() => removeCommitteeMember(index)} style={{ ...panelButtonStyle, padding: '5px 7px', fontSize: '11px', color: '#991b1b', borderColor: '#fecaca' }}>حذف</button>
                    </div>
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الرتبة</label>
                    <input value={member.rank} onChange={(event) => updateCommitteeMember(index, 'rank', event.target.value)} style={panelControlStyle} />
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الاسم</label>
                    <input value={member.name} onChange={(event) => updateCommitteeMember(index, 'name', event.target.value)} style={panelControlStyle} />
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الصفة</label>
                    <input value={member.role} onChange={(event) => updateCommitteeMember(index, 'role', event.target.value)} style={panelControlStyle} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCommitteeMember} style={panelButtonStyle}>إضافة عضو</button>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input type="number" min={10} max={24} step={0.5} value={committeeFontSize} onChange={(event) => updateCommitteeStyle({ tableFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input type="color" value={committeeColor} onChange={(event) => updateCommitteeStyle({ paragraphColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select value={committeeWeight} onChange={(event) => updateCommitteeStyle({ tableFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                يطبق التنسيق على جدول التأليف داخل المصمم فقط.
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetCommitteeContent} disabled={!hasCommitteeContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى التأليف</button>
              <button type="button" onClick={resetCommitteeStyle} disabled={!hasCommitteeStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق التأليف</button>
              <button type="button" onClick={resetCommitteeAll} disabled={!hasCommitteeContentOverride && !hasCommitteeStyleOverride} style={panelButtonStyle}>إعادة ضبط التأليف بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  // ── Phase 10F: Summary Tables Inspector renderer ──
  const renderSummaryTablesInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const stHeaderBg = String(getSummaryTablesStyleValue('tableHeaderBackgroundColor') ?? styleState.tableHeaderBackgroundColor);
    const stHeaderColor = String(getSummaryTablesStyleValue('tableHeaderTextColor') ?? styleState.tableHeaderTextColor);
    const stBorderColor = String(getSummaryTablesStyleValue('tableBorderColor') ?? styleState.tableBorderColor);
    const stBorderWidth = Number(getSummaryTablesStyleValue('tableBorderWidth') ?? styleState.tableBorderWidth);
    const stCellPadding = String(getSummaryTablesStyleValue('tableCellPadding') ?? styleState.tableCellPadding) as TableCellPaddingChoice;
    const stFontSize = Number(getSummaryTablesStyleValue('tableFontSize') ?? styleState.tableFontSize);
    const stFontWeight = (getSummaryTablesStyleValue('tableFontWeight') || styleState.tableFontWeight) as FontWeightChoice;
    const stSpacingBefore = Number(summaryTablesStyleOverride.paragraphSpacingBefore ?? 0);
    const stSpacingAfter = Number(summaryTablesStyleOverride.paragraphSpacingAfter ?? 25);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص جداول الملخص">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص جداول الملخص</h3>
          <p style={shellPanelHintStyle}>تحرير جداول الملخص فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (<>
            <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.7, backgroundColor: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
              بيانات هذا الجدول تُدار من صفحة تنفيذ التفتيش. من هنا يمكنك تعديل عنوان الجدول والتنسيق فقط.
            </div>
            {selectedStructureNode?.id === 'official-positions' ? (
              <div style={panelGroupStyle}>
                <div style={{ color: '#92400e', fontSize: '12px', lineHeight: 1.7, backgroundColor: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  هذا Slot رسمي محمي من الحذف أو تغيير التسلسل. محتواه غير مفعل حالياً في /reports،
                  يمكن تعديل التنسيق والأنماط عبر باقي التبويبات.
                </div>
              </div>
            ) : (
              <div style={panelGroupStyle}>
                <div>
                  <label style={panelLabelStyle}>عنوان الجدول</label>
                  <input
                    type="text"
                    value={summaryTableTitleValue}
                    onChange={(event) => updateSummaryTableTitle(event.target.value)}
                    style={{ ...panelControlStyle, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                  تعديل عنوان قسم جداول الملخص فقط. بيانات الجدول الأصلية لا تتغير.
                </div>
              </div>
            )}
          </>)}
          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>لون خلفية الرأس</label>
                <input type="color" value={stHeaderBg} onChange={(event) => updateSummaryTablesStyle({ tableHeaderBackgroundColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون نص الرأس</label>
                <input type="color" value={stHeaderColor} onChange={(event) => updateSummaryTablesStyle({ tableHeaderTextColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون الحدود</label>
                <input type="color" value={stBorderColor} onChange={(event) => updateSummaryTablesStyle({ tableBorderColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>عرض الحدود</label>
                <input type="number" min={0} max={5} step={1} value={stBorderWidth} onChange={(event) => updateSummaryTablesStyle({ tableBorderWidth: Number(event.target.value) as TableBorderWidthChoice })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>تباعد الخلايا</label>
                <select value={stCellPadding} onChange={(event) => updateSummaryTablesStyle({ tableCellPadding: event.target.value as TableCellPaddingChoice })} style={panelControlStyle}>
                  <option value="compact">مضغوط</option>
                  <option value="normal">عادي</option>
                  <option value="comfortable">مريح</option>
                </select>
              </div>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input type="number" min={8} max={24} step={0.5} value={stFontSize} onChange={(event) => updateSummaryTablesStyle({ tableFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select value={stFontWeight} onChange={(event) => updateSummaryTablesStyle({ tableFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                الأنماط تطبق فقط على جداول الملخص داخل المصمم.
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={stSpacingBefore} onChange={(event) => updateSummaryTablesStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={stSpacingAfter} onChange={(event) => updateSummaryTablesStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetSummaryTablesContent} disabled={!hasSummaryTablesContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى الجداول</button>
              <button type="button" onClick={resetSummaryTablesStyle} disabled={!hasSummaryTablesStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق الجداول</button>
              <button type="button" onClick={resetSummaryTablesAll} disabled={!hasSummaryTablesContentOverride && !hasSummaryTablesStyleOverride} style={panelButtonStyle}>إعادة ضبط الجداول بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  // ── End Phase 10F renderer ──

  // ── Phase 10G: Official Notes Inspector renderer ──
  const renderOfficialNotesInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const notesFontSize = Number(getOfficialNotesStyleValue('paragraphFontSize') ?? styleState.paragraphFontSize);
    const notesColor = String(getOfficialNotesStyleValue('paragraphColor') ?? styleState.paragraphColor);
    const notesWeight = (getOfficialNotesStyleValue('paragraphFontWeight') || 'normal') as FontWeightChoice;
    const notesLineHeight = Number(getOfficialNotesStyleValue('paragraphLineHeight') ?? styleState.paragraphLineHeight);
    const notesAlign = (officialNotesStyleOverride.titleTextAlign || 'right') as TitleTextAlignChoice;
    const notesSpacingBefore = Number(officialNotesStyleOverride.paragraphSpacingBefore ?? 0);
    const notesSpacingAfter = Number(officialNotesStyleOverride.paragraphSpacingAfter ?? 20);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص الملاحظات الرسمية">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص الملاحظات الرسمية</h3>
          <p style={shellPanelHintStyle}>تحرير الملاحظات الرسمية فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {OFFICIAL_NOTES_LIST_TYPES.map((listType) => (
                <div key={listType} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff', display: 'grid', gap: '8px' }}>
                  <strong style={{ color: '#334155', fontSize: '13px', fontWeight: 900 }}>{OFFICIAL_NOTES_LIST_LABELS[listType]}</strong>
                  {officialNotesData[listType].length === 0 && (
                    <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>لا توجد ملاحظات ضمن هذا التصنيف.</div>
                  )}
                  {officialNotesData[listType].map((item, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '6px', alignItems: 'start' }}>
                      <textarea
                        value={item}
                        onChange={(event) => updateOfficialNoteItem(listType, index, event.target.value)}
                        rows={2}
                        style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        title="نقل للأعلى"
                        disabled={index === 0}
                        onClick={() => moveOfficialNoteItemUp(listType, index)}
                        style={{ ...panelButtonStyle, padding: '5px 6px', fontSize: '12px', lineHeight: 1 }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title="نقل للأسفل"
                        disabled={index === officialNotesData[listType].length - 1}
                        onClick={() => moveOfficialNoteItemDown(listType, index)}
                        style={{ ...panelButtonStyle, padding: '5px 6px', fontSize: '12px', lineHeight: 1 }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOfficialNoteItem(listType, index)}
                        style={{ ...panelButtonStyle, padding: '5px 8px', fontSize: '11px', color: '#991b1b', borderColor: '#fecaca' }}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOfficialNoteItem(listType)}
                    style={{ ...panelButtonStyle, fontSize: '11px', padding: '6px 10px' }}
                  >
                    إضافة بند
                  </button>
                </div>
              ))}
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                تعديل نصوص الملاحظات فقط. البيانات الأصلية في payload لا تتغير.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input type="number" min={10} max={24} step={0.5} value={notesFontSize} onChange={(event) => updateOfficialNotesStyle({ paragraphFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input type="color" value={notesColor} onChange={(event) => updateOfficialNotesStyle({ paragraphColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select value={notesWeight} onChange={(event) => updateOfficialNotesStyle({ paragraphFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div>
                <label style={panelLabelStyle}>ارتفاع السطر</label>
                <input type="number" min={1.0} max={3.0} step={0.1} value={notesLineHeight} onChange={(event) => updateOfficialNotesStyle({ paragraphLineHeight: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>محاذاة النص</label>
                <select value={notesAlign} onChange={(event) => updateOfficialNotesStyle({ titleTextAlign: event.target.value as TitleTextAlignChoice })} style={panelControlStyle}>
                  <option value="right">يمين</option>
                  <option value="center">وسط</option>
                  <option value="left">يسار</option>
                  <option value="justify">ضبط</option>
                </select>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                الأنماط تطبق فقط على قسم الملاحظات الرسمية داخل المصمم.
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={notesSpacingBefore} onChange={(event) => updateOfficialNotesStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={notesSpacingAfter} onChange={(event) => updateOfficialNotesStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetOfficialNotesContent} disabled={!hasOfficialNotesContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى الملاحظات</button>
              <button type="button" onClick={resetOfficialNotesStyle} disabled={!hasOfficialNotesStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق الملاحظات</button>
              <button type="button" onClick={resetOfficialNotesAll} disabled={!hasOfficialNotesContentOverride && !hasOfficialNotesStyleOverride} style={panelButtonStyle}>إعادة ضبط الملاحظات بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  // ── End Phase 10G renderer ──

  // ── Phase 10H: Recommendations Inspector renderer ──
  const renderRecommendationsInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const recNumberingFontSize = Number(recommendationsStyleOverride.numberingFontSize ?? styleState.numberingFontSize);
    const recNumberingColor = String(recommendationsStyleOverride.numberingColor ?? styleState.numberingColor);
    const recTextFontSize = Number(recommendationsStyleOverride.paragraphFontSize ?? styleState.paragraphFontSize ?? 13.5);
    const recTextColor = String(recommendationsStyleOverride.paragraphColor ?? styleState.paragraphColor);
    const recFontWeight = (recommendationsStyleOverride.paragraphFontWeight || 'normal') as FontWeightChoice;
    const recLineHeight = Number(recommendationsStyleOverride.paragraphLineHeight ?? styleState.paragraphLineHeight);
    const recSpacingBefore = Number(recommendationsStyleOverride.paragraphSpacingBefore ?? 0);
    const recSpacingAfter = Number(recommendationsStyleOverride.paragraphSpacingAfter ?? 20);
    const recItemSpacing = Number((recommendationsStyleOverride as any).itemSpacing ?? 10);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص التوصيات">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص التوصيات</h3>
          <p style={shellPanelHintStyle}>تحرير التوصيات فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {recommendationsData.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '12px' }}>لا توجد مجموعات توصيات.</div>
              )}
              {recommendationsData.map((group, groupIdx) => (
                <div key={groupIdx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#334155', fontSize: '12px' }}>جهة التوصية {groupIdx + 1}</strong>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => moveRecommendationGroup(groupIdx, -1)}
                        disabled={groupIdx === 0}
                        aria-label="تحريك جهة التوصية للأعلى"
                        title="تحريك جهة التوصية للأعلى"
                        style={{ ...panelButtonStyle, padding: '4px 6px', fontSize: '10px' }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRecommendationGroup(groupIdx, 1)}
                        disabled={groupIdx === recommendationsData.length - 1}
                        aria-label="تحريك جهة التوصية للأسفل"
                        title="تحريك جهة التوصية للأسفل"
                        style={{ ...panelButtonStyle, padding: '4px 6px', fontSize: '10px' }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecommendationGroup(groupIdx)}
                        style={{ ...panelButtonStyle, padding: '4px 8px', fontSize: '11px', color: '#991b1b', borderColor: '#fecaca' }}
                      >
                        حذف المجموعة
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الجهة</label>
                    <input
                      type="text"
                      value={group.authority}
                      onChange={(event) => updateRecommendationGroup(groupIdx, { authority: event.target.value })}
                      style={panelControlStyle}
                    />
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'grid', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#475569', fontSize: '12px', fontWeight: 800 }}>التوصيات ({group.recs.length})</span>
                    </div>
                    {group.recs.length === 0 && (
                      <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>لا توجد توصيات تحت هذه الجهة.</div>
                    )}
                    {group.recs.map((rec, recIdx) => {
                      return (
                      <div key={recIdx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '4px', alignItems: 'start' }}>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <textarea
                            value={rec.text}
                            onChange={(event) => updateRecommendationItem(groupIdx, recIdx, event.target.value)}
                            rows={2}
                            style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, fontSize: '12px' }}
                          />
                        </div>
                        <button type="button" onClick={() => moveRecommendationItem(groupIdx, recIdx, -1)} disabled={recIdx === 0} style={{ ...panelButtonStyle, padding: '4px 6px', fontSize: '10px' }}>↑</button>
                        <button type="button" onClick={() => moveRecommendationItem(groupIdx, recIdx, 1)} disabled={recIdx === group.recs.length - 1} style={{ ...panelButtonStyle, padding: '4px 6px', fontSize: '10px' }}>↓</button>
                        <button type="button" onClick={() => removeRecommendationItem(groupIdx, recIdx)} style={{ ...panelButtonStyle, padding: '4px 8px', fontSize: '11px', color: '#991b1b', borderColor: '#fecaca' }}>حذف</button>
                      </div>
                      );
                    })}
                    <button type="button" onClick={() => addRecommendationItem(groupIdx)} style={{ ...panelButtonStyle, fontSize: '11px', padding: '6px 10px' }}>إضافة توصية</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRecommendationGroup} style={panelButtonStyle}>إضافة مجموعة توصيات</button>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                تعديل التوصيات فقط. بيانات payload الأصلية لا تتغير.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>حجم خط الرقم</label>
                <input type="number" min={10} max={24} step={0.5} value={recNumberingFontSize} onChange={(event) => updateRecommendationsStyle({ numberingFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون الرقم</label>
                <input type="color" value={recNumberingColor} onChange={(event) => updateRecommendationsStyle({ numberingColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>حجم خط النص</label>
                <input type="number" min={10} max={24} step={0.5} value={recTextFontSize} onChange={(event) => updateRecommendationsStyle({ paragraphFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input type="color" value={recTextColor} onChange={(event) => updateRecommendationsStyle({ paragraphColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select value={recFontWeight} onChange={(event) => updateRecommendationsStyle({ paragraphFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div>
                <label style={panelLabelStyle}>ارتفاع السطر</label>
                <input type="number" min={1.0} max={3.0} step={0.1} value={recLineHeight} onChange={(event) => updateRecommendationsStyle({ paragraphLineHeight: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                الأنماط تطبق فقط على قسم التوصيات داخل المصمم.
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={recSpacingBefore} onChange={(event) => updateRecommendationsStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={recSpacingAfter} onChange={(event) => updateRecommendationsStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بين العناصر</label>
                <input type="number" min={0} max={40} step={2} value={recItemSpacing} onChange={(event) => updateRecommendationsStyle({ itemSpacing: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetRecommendationsContent} disabled={!hasRecommendationsContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى التوصيات</button>
              <button type="button" onClick={resetRecommendationsStyle} disabled={!hasRecommendationsStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق التوصيات</button>
              <button type="button" onClick={resetRecommendationsAll} disabled={!hasRecommendationsContentOverride && !hasRecommendationsStyleOverride} style={panelButtonStyle}>إعادة ضبط التوصيات بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  // ── End Phase 10H renderer ──

  // ── Phase 10I: Appendices Inspector renderer ──
  const renderAppendicesInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const appxTitleFontSize = Number((appendicesStyleOverride as any).titleFontSize ?? styleState.mainTitleFontSize ?? 18);
    const appxTitleColor = String((appendicesStyleOverride as any).titleColor ?? '#0c2340');
    const appxTitleWeight = ((appendicesStyleOverride as any).titleFontWeight ?? 'bold') as FontWeightChoice;
    const appxItemFontSize = Number(appendicesStyleOverride.paragraphFontSize ?? styleState.paragraphFontSize);
    const appxItemColor = String(appendicesStyleOverride.paragraphColor ?? styleState.paragraphColor);
    const appxItemWeight = (appendicesStyleOverride.paragraphFontWeight || 'normal') as FontWeightChoice;
    const appxSpacingBefore = Number(appendicesStyleOverride.paragraphSpacingBefore ?? 0);
    const appxSpacingAfter = Number(appendicesStyleOverride.paragraphSpacingAfter ?? 25);
    const appxItemSpacing = Number((appendicesStyleOverride as any).itemSpacing ?? 12);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص الملاحق">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص الملاحق</h3>
          <p style={shellPanelHintStyle}>تحرير الملاحق فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {appendicesData.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '12px' }}>لا توجد ملاحق مرئية.</div>
              )}
              {appendicesData.map((appendix, index) => (
                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#334155', fontSize: '12px' }}>ملحق {index + 1}</strong>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => moveAppendixUp(index)} disabled={index === 0} style={{ ...panelButtonStyle, padding: '4px 6px', fontSize: '10px' }}>↑</button>
                      <button type="button" onClick={() => moveAppendixDown(index)} disabled={index === appendicesData.length - 1} style={{ ...panelButtonStyle, padding: '4px 6px', fontSize: '10px' }}>↓</button>
                      <button type="button" onClick={() => removeAppendix(index)} style={{ ...panelButtonStyle, padding: '4px 8px', fontSize: '11px', color: '#991b1b', borderColor: '#fecaca' }}>حذف</button>
                    </div>
                  </div>
                  <div>
                    <label style={panelLabelStyle}>رمز الملحق</label>
                    <input
                      type="text"
                      value={appendix.symbol}
                      onChange={(event) => updateAppendixSymbol(index, event.target.value)}
                      style={panelControlStyle}
                    />
                  </div>
                  <div>
                    <label style={panelLabelStyle}>نص الملحق</label>
                    <textarea
                      value={appendix.text}
                      onChange={(event) => updateAppendixText(index, event.target.value)}
                      rows={4}
                      style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addAppendix} style={panelButtonStyle}>إضافة ملحق جديد</button>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                تعديل الملاحق فقط. بيانات payload الأصلية لا تتغير.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div style={{ color: '#334155', fontSize: '13px', fontWeight: 900, marginBottom: '6px' }}>عناوين الملاحق</div>
              <div>
                <label style={panelLabelStyle}>حجم خط العنوان</label>
                <input type="number" min={10} max={28} step={0.5} value={appxTitleFontSize} onChange={(event) => updateAppendicesStyle({ titleFontSize: Number(event.target.value) } as any)} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون العنوان</label>
                <input type="color" value={appxTitleColor} onChange={(event) => updateAppendicesStyle({ titleColor: event.target.value } as any)} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة خط العنوان</label>
                <select value={appxTitleWeight} onChange={(event) => updateAppendicesStyle({ titleFontWeight: event.target.value as FontWeightChoice } as any)} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '11px', lineHeight: 1.6, marginTop: '4px' }}>
                عناوين الملحق = عنوان القسم (ملاحق التقرير التفتيشي) + عنوان كل ملحق (ملحق أ)
              </div>
              <div style={{ color: '#334155', fontSize: '13px', fontWeight: 900, marginTop: '10px', marginBottom: '6px' }}>نصوص الملاحق</div>
              <div>
                <label style={panelLabelStyle}>حجم خط العنصر</label>
                <input type="number" min={10} max={24} step={0.5} value={appxItemFontSize} onChange={(event) => updateAppendicesStyle({ paragraphFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون العنصر</label>
                <input type="color" value={appxItemColor} onChange={(event) => updateAppendicesStyle({ paragraphColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة خط العنصر</label>
                <select value={appxItemWeight} onChange={(event) => updateAppendicesStyle({ paragraphFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                الأنماط تطبق فقط على قسم الملاحق داخل المصمم.
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={appxSpacingBefore} onChange={(event) => updateAppendicesStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={appxSpacingAfter} onChange={(event) => updateAppendicesStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بين العناصر</label>
                <input type="number" min={0} max={40} step={2} value={appxItemSpacing} onChange={(event) => updateAppendicesStyle({ itemSpacing: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetAppendicesContent} disabled={!hasAppendicesContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى الملاحق</button>
              <button type="button" onClick={resetAppendicesStyle} disabled={!hasAppendicesStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق الملاحق</button>
              <button type="button" onClick={resetAppendicesAll} disabled={!hasAppendicesContentOverride && !hasAppendicesStyleOverride} style={panelButtonStyle}>إعادة ضبط الملاحق بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  // ── End Phase 10I renderer ──

  // ── Phase 10J: Final Evaluation Inspector renderer ──
  const renderFinalEvaluationInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const evalFontSize = Number(getFinalEvalStyleValue('paragraphFontSize') ?? styleState.paragraphFontSize);
    const evalColor = String(getFinalEvalStyleValue('paragraphColor') ?? styleState.paragraphColor);
    const evalWeight = (getFinalEvalStyleValue('paragraphFontWeight') || 'normal') as FontWeightChoice;
    const evalLineHeight = Number(getFinalEvalStyleValue('paragraphLineHeight') ?? styleState.paragraphLineHeight);
    const evalAlign = (finalEvalStyleOverride.titleTextAlign || 'right') as TitleTextAlignChoice;
    const evalSpacingBefore = Number(finalEvalStyleOverride.paragraphSpacingBefore ?? 0);
    const evalSpacingAfter = Number(finalEvalStyleOverride.paragraphSpacingAfter ?? 25);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص التقييم النهائي">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص التقييم النهائي</h3>
          <p style={shellPanelHintStyle}>تحرير التقييم النهائي فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>نص التقييم النهائي</label>
                <textarea
                  value={finalEvalTextValue}
                  onChange={(event) => updateFinalEvalText(event.target.value)}
                  rows={6}
                  style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                />
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                تعديل للمعاينة فقط. التقييم النهائي الرسمي يبقى بدون تغيير.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>حجم الخط</label>
                <input type="number" min={10} max={24} step={0.5} value={evalFontSize} onChange={(event) => updateFinalEvalStyle({ paragraphFontSize: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون النص</label>
                <input type="color" value={evalColor} onChange={(event) => updateFinalEvalStyle({ paragraphColor: event.target.value })} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة الخط</label>
                <select value={evalWeight} onChange={(event) => updateFinalEvalStyle({ paragraphFontWeight: event.target.value as FontWeightChoice })} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div>
                <label style={panelLabelStyle}>ارتفاع السطر</label>
                <input type="number" min={1.0} max={3.0} step={0.1} value={evalLineHeight} onChange={(event) => updateFinalEvalStyle({ paragraphLineHeight: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>محاذاة النص</label>
                <select value={evalAlign} onChange={(event) => updateFinalEvalStyle({ titleTextAlign: event.target.value as TitleTextAlignChoice })} style={panelControlStyle}>
                  <option value="right">يمين</option>
                  <option value="center">وسط</option>
                  <option value="left">يسار</option>
                  <option value="justify">ضبط</option>
                </select>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                الأنماط تطبق فقط على التقييم النهائي داخل المصمم.
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={evalSpacingBefore} onChange={(event) => updateFinalEvalStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={evalSpacingAfter} onChange={(event) => updateFinalEvalStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetFinalEvalContent} disabled={!hasFinalEvalContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى التقييم النهائي</button>
              <button type="button" onClick={resetFinalEvalStyle} disabled={!hasFinalEvalStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق التقييم النهائي</button>
              <button type="button" onClick={resetFinalEvalAll} disabled={!hasFinalEvalContentOverride && !hasFinalEvalStyleOverride} style={panelButtonStyle}>إعادة ضبط التقييم النهائي بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
// ── End Phase 10J renderer ──

  // ── Phase 10K: Signatures Inspector renderer ──
  const renderSignaturesInspector = () => {
    const tabButton = (tab: PropertiesTab, label: string) => (
      <button
        type="button"
        onClick={() => setActivePropertiesTab(tab)}
        style={{
          border: '1px solid',
          borderColor: activePropertiesTab === tab ? '#7c3aed' : '#d8e0ea',
          borderRadius: '6px',
          backgroundColor: activePropertiesTab === tab ? '#eef2ff' : '#ffffff',
          color: activePropertiesTab === tab ? '#3730a3' : '#64748b',
          padding: '8px 6px',
          fontSize: '12px',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );

    const sigNameFontSize = Number((signaturesStyleOverride as any).nameFontSize ?? 14);
    const sigNameColor = String((signaturesStyleOverride as any).nameColor ?? '#0f172a');
    const sigNameWeight = ((signaturesStyleOverride as any).nameFontWeight ?? 'bold') as FontWeightChoice;
    const sigRoleFontSize = Number((signaturesStyleOverride as any).roleFontSize ?? 13);
    const sigRoleColor = String((signaturesStyleOverride as any).roleColor ?? '#334155');
    const sigRoleWeight = ((signaturesStyleOverride as any).roleFontWeight ?? 'bold') as FontWeightChoice;
    const sigSpacingBefore = Number(signaturesStyleOverride.paragraphSpacingBefore ?? 0);
    const sigSpacingAfter = Number(signaturesStyleOverride.paragraphSpacingAfter ?? 0);
    const sigGap = Number((signaturesStyleOverride as any).signatureGap ?? 20);

    return (
      <aside style={shellPanelStyle} aria-label="خصائص التواقيع">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص التواقيع</h3>
          <p style={shellPanelHintStyle}>تحرير التواقيع فقط. التعديلات تحفظ داخل designer draft ولا تغير payload الأصلي.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {tabButton('content', 'المحتوى')}
            {tabButton('style', 'التنسيق')}
            {tabButton('layout', 'التخطيط')}
            {tabButton('actions', 'الإجراءات')}
          </div>

          {activePropertiesTab === 'content' && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {signaturesData.map((sig, index) => (
                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#ffffff', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                    <strong style={{ color: '#334155', fontSize: '12px' }}>الموقّع {index + 1}</strong>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => moveSignatureItem(index, -1)} disabled={index === 0} style={{ ...panelButtonStyle, padding: '5px 7px', fontSize: '11px' }}>↑</button>
                      <button type="button" onClick={() => moveSignatureItem(index, 1)} disabled={index === signaturesData.length - 1} style={{ ...panelButtonStyle, padding: '5px 7px', fontSize: '11px' }}>↓</button>
                      <button type="button" onClick={() => removeSignatureItem(index)} style={{ ...panelButtonStyle, padding: '5px 7px', fontSize: '11px', color: '#991b1b', borderColor: '#fecaca' }}>حذف</button>
                    </div>
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الرتبة</label>
                    <input value={sig.rank} onChange={(event) => updateSignatureItem(index, 'rank', event.target.value)} style={panelControlStyle} />
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الاسم</label>
                    <input value={sig.name} onChange={(event) => updateSignatureItem(index, 'name', event.target.value)} style={panelControlStyle} />
                  </div>
                  <div>
                    <label style={panelLabelStyle}>الصفة</label>
                    <input value={sig.role} onChange={(event) => updateSignatureItem(index, 'role', event.target.value)} style={panelControlStyle} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addSignatureItem} style={panelButtonStyle}>إضافة موقّع</button>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                تعديل التواقيع فقط. بيانات payload الأصلية لا تتغير.
              </div>
            </div>
          )}

          {activePropertiesTab === 'style' && (
            <div style={panelGroupStyle}>
              <div style={{ color: '#334155', fontSize: '13px', fontWeight: 900, marginBottom: '6px' }}>اسم الموقّع</div>
              <div>
                <label style={panelLabelStyle}>حجم خط الاسم</label>
                <input type="number" min={10} max={24} step={0.5} value={sigNameFontSize} onChange={(event) => updateSignaturesStyle({ nameFontSize: Number(event.target.value) } as any)} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون الاسم</label>
                <input type="color" value={sigNameColor} onChange={(event) => updateSignaturesStyle({ nameColor: event.target.value } as any)} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة خط الاسم</label>
                <select value={sigNameWeight} onChange={(event) => updateSignaturesStyle({ nameFontWeight: event.target.value as FontWeightChoice } as any)} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div style={{ color: '#334155', fontSize: '13px', fontWeight: 900, marginTop: '10px', marginBottom: '6px' }}>صفة الموقّع</div>
              <div>
                <label style={panelLabelStyle}>حجم خط الصفة</label>
                <input type="number" min={10} max={24} step={0.5} value={sigRoleFontSize} onChange={(event) => updateSignaturesStyle({ roleFontSize: Number(event.target.value) } as any)} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>لون الصفة</label>
                <input type="color" value={sigRoleColor} onChange={(event) => updateSignaturesStyle({ roleColor: event.target.value } as any)} style={{ ...panelControlStyle, padding: '3px' }} />
              </div>
              <div>
                <label style={panelLabelStyle}>سماكة خط الصفة</label>
                <select value={sigRoleWeight} onChange={(event) => updateSignaturesStyle({ roleFontWeight: event.target.value as FontWeightChoice } as any)} style={panelControlStyle}>
                  <option value="normal">عادي</option>
                  <option value="bold">عريض</option>
                </select>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
                الأنماط تطبق فقط على قسم التواقيع داخل المصمم.
              </div>
            </div>
          )}

          {activePropertiesTab === 'layout' && (
            <div style={panelGroupStyle}>
              <div>
                <label style={panelLabelStyle}>المسافة قبل</label>
                <input type="number" min={0} max={80} step={2} value={sigSpacingBefore} onChange={(event) => updateSignaturesStyle({ paragraphSpacingBefore: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بعد</label>
                <input type="number" min={0} max={80} step={2} value={sigSpacingAfter} onChange={(event) => updateSignaturesStyle({ paragraphSpacingAfter: Number(event.target.value) })} style={panelControlStyle} />
              </div>
              <div>
                <label style={panelLabelStyle}>المسافة بين التواقيع</label>
                <input type="number" min={0} max={60} step={4} value={sigGap} onChange={(event) => updateSignaturesStyle({ signatureGap: Number(event.target.value) } as any)} style={panelControlStyle} />
              </div>
            </div>
          )}

          {activePropertiesTab === 'actions' && (
            <div style={panelGroupStyle}>
              <button type="button" onClick={resetSignaturesContent} disabled={!hasSignaturesContentOverride} style={panelButtonStyle}>إعادة ضبط محتوى التواقيع</button>
              <button type="button" onClick={resetSignaturesStyle} disabled={!hasSignaturesStyleOverride} style={panelButtonStyle}>إعادة ضبط تنسيق التواقيع</button>
              <button type="button" onClick={resetSignaturesAll} disabled={!hasSignaturesContentOverride && !hasSignaturesStyleOverride} style={panelButtonStyle}>إعادة ضبط التواقيع بالكامل</button>
            </div>
          )}
        </div>
      </aside>
    );
  };
  // ── End Phase 10K renderer ──

  // ── Phase 19A-2: Global Numbering Styles (always visible in Properties Panel) ──
  const renderSpacerInspector = () => {
    const spacer = designerSpacers.find((s) => `spacer:${s.id}` === selectedElementId);
    if (!spacer) {
      return (
        <aside style={shellPanelStyle} aria-label="خصائص المسافة">
          <div style={shellPanelHeaderStyle}>
            <h3 style={shellPanelTitleStyle}>خصائص المسافة</h3>
          </div>
          <div style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>Spacer not found. Select a spacer in the canvas.</div>
        </aside>
      );
    }
    const base = reportPayload ? buildFragments(reportPayload) : [];
    const afterLabel = base[spacer.afterFragmentIndex]?.title || `Index ${spacer.afterFragmentIndex}`;
    return (
      <aside style={shellPanelStyle} aria-label="خصائص المسافة">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص المسافة</h3>
          <p style={shellPanelHintStyle}>إعدادات المسافة العمودية</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div>
            <label style={panelLabelStyle}>الارتفاع (ملم)</label>
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={spacer.heightMm}
              onChange={(e) => {
                const v = Math.max(1, Math.min(100, Number(e.target.value) || 10));
                setDesignerSpacers((prev) =>
                  prev.map((s) => (s.id === spacer.id ? { ...s, heightMm: v } : s))
                );
              }}
              style={panelControlStyle}
            />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, marginBottom: '4px' }}>بعد</div>
            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700 }}>{afterLabel}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, marginBottom: '4px' }}>ترتيب الموضع</div>
            <div style={{ color: '#334155', fontSize: '13px', fontWeight: 700 }}>{spacer.afterFragmentIndex}</div>
          </div>
          {designerSpacers.length > 1 && (
            <div>
              <label style={panelLabelStyle}>النقل بعد</label>
              <select
                value={spacer.afterFragmentIndex}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const secIdx = getSectionIndexFromFragmentIndex(v, base);
                  setDesignerSpacers((prev) =>
                    prev.map((s) => (s.id === spacer.id ? { ...s, afterFragmentIndex: v, afterSectionIndex: secIdx } : s))
                  );
                }}
                style={panelControlStyle}
              >
                {base.map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx} - {base[idx]?.title || `Fragment ${idx}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setDesignerSpacers((prev) => prev.filter((s) => s.id !== spacer.id));
              setSelectedElementType(null);
              setSelectedElementId(null);
            }}
            style={{
              ...panelButtonStyle,
              borderColor: '#dc2626',
              color: '#dc2626',
              backgroundColor: '#fee2e2',
              fontWeight: 800,
            }}
          >
            Delete Spacer
          </button>
        </div>
      </aside>
    );
  };

  const renderSectionInspector = () => {
    if (visibleSections.length === 0) {
      return (
        <aside style={shellPanelStyle} aria-label="خصائص الأقسام">
          <div style={shellPanelHeaderStyle}>
            <h3 style={shellPanelTitleStyle}>خصائص الأقسام</h3>
          </div>
          <div style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>No sections found in this report.</div>
        </aside>
      );
    }

    return (
      <aside style={shellPanelStyle} aria-label="خصائص الأقسام">
        <div style={shellPanelHeaderStyle}>
          <h3 style={shellPanelTitleStyle}>خصائص الأقسام</h3>
          <p style={shellPanelHintStyle}>قم بتعديل عناوين الأقسام والنصوص والعناوين الفرعية وبنود findings. تظهر التغييرات في المعاينة وتُضمَّن في PDF المُصدَّر.</p>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '16px' }}>
          {visibleSections.map(({ sec, si }) => {
            const subs: any[] = Array.isArray(sec?.subsections) ? sec.subsections : [];
            const hasOverride = hasSectionOverride(sec);
            const SECTION_LIST_TYPES_LOCAL = ['positives', 'negatives', 'impediments', 'obstacles'] as const;
            const showFlagFn = (type: string) => `show${type.charAt(0).toUpperCase()}${type.slice(1)}`;
            const sectionListLabels: Record<string, string> = { positives: 'الإيجابيات', negatives: 'السلبيات', impediments: 'المعوقات', obstacles: 'المعاضل' };
            const isCollapsed = !!sectionCollapsed[si];
            return (
              <div key={si} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: hasOverride ? '#faf5ff' : '#ffffff' }}>
                {/* Accordion header — always visible */}
                <div
                  onClick={() => setSectionCollapsed((prev) => ({ ...prev, [si]: !prev[si] }))}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>{isCollapsed ? '▶' : '▼'}</span>
                    <label style={{ ...panelLabelStyle, marginBottom: 0, cursor: 'pointer' }}>
                      القسم {si + 1}: {getSectionTitleValue(sec) || `القسم ${si + 1}`}
                    </label>
                    {isCollapsed && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {subs.length > 0 && `${subs.length} subsection${subs.length !== 1 ? 's' : ''}`}
                        {subs.length > 0 && hasOverride ? ' · ' : ''}
                        {hasOverride && 'Edited'}
                      </span>
                    )}
                  </div>
                  {hasOverride && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); resetSectionAll(sec); }} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>
                      إعادة ضبط تعديلات القسم {si + 1}
                    </button>
                  )}
                </div>
                {/* Collapsible body */}
                {!isCollapsed && (
                  <div style={{ padding: '0 12px 12px 12px', display: 'grid', gap: '10px' }}>
                    {/* Section title */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={panelLabelStyle}>عنوان القسم {si + 1}</label>
                        {elementTextOverrides[getSectionTitleKey(sec)] !== undefined && (
                          <button type="button" onClick={() => resetSectionTitle(sec)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>إعادة ضبط</button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={getSectionTitleValue(sec)}
                        onChange={(e) => updateSectionTitle(sec, e.target.value)}
                        style={{ ...panelControlStyle, fontSize: '13px' }}
                      />
                    </div>
                    {/* Section narrative — only show when narrativeText is truthy, matching buildFragments guard */}
                    {Boolean(sec?.narrativeText) && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={panelLabelStyle}>سرد القسم {si + 1}</label>
                          {elementTextOverrides[getSectionNarrativeKey(sec)] !== undefined && (
                            <button type="button" onClick={() => resetSectionNarrative(sec)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>إعادة ضبط</button>
                          )}
                        </div>
                        <textarea
                          value={getSectionNarrativeValue(sec)}
                          onChange={(e) => updateSectionNarrative(sec, e.target.value)}
                          rows={3}
                          style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, fontSize: '13px' }}
                        />
                      </div>
                    )}
                    {/* Section-level finding lists */}
                    {SECTION_LIST_TYPES_LOCAL.map((type) => {
                      const showKey = showFlagFn(type);
                      const list: string[] = (sec?.[showKey] && Array.isArray(sec?.[`${type}List`])) ? sec[`${type}List`] : [];
                      if (list.length === 0) return null;
                      return (
                        <div key={type} style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'grid', gap: '6px' }}>
                          <div style={{ fontWeight: 800, fontSize: '12px', color: '#475569' }}>{sectionListLabels[type]} ({list.length})</div>
                          {list.map((baseText: string, k: number) => (
                            <div key={k}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={panelLabelStyle}>{sectionListLabels[type]} {si + 1}.{k + 1}</label>
                                {elementTextOverrides[getSectionListKey(sec, type, baseText)] !== undefined && (
                                  <button type="button" onClick={() => resetSectionListItem(sec, type, baseText)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>إعادة ضبط</button>
                                )}
                              </div>
                              <textarea
                                value={getSectionListValue(type, baseText, sec)}
                                onChange={(e) => updateSectionListItem(sec, type, baseText, e.target.value)}
                                rows={2}
                                style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, fontSize: '13px' }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {/* Subsections */}
                    {subs.map((sub: any, sj: number) => {
                      const findings: string[] = Array.isArray(sub?.findings) ? sub.findings : [];
                      const subListLabels: Record<string, string> = { positives: 'الإيجابيات', negatives: 'السلبيات', impediments: 'المعوقات', obstacles: 'المعاضل' };
                      return (
                        <div key={sj} style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'grid', gap: '8px' }}>
                          {/* Subsection title */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={panelLabelStyle}>عنوان القسم الفرعي {si + 1}.{sj + 1}</label>
                              {elementTextOverrides[getSubsectionTitleKey(sub)] !== undefined && (
                                <button type="button" onClick={() => resetSubsectionTitle(sub)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>إعادة ضبط</button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={getSubsectionTitleValue(sub)}
                              onChange={(e) => updateSubsectionTitle(sub, e.target.value)}
                              style={{ ...panelControlStyle, fontSize: '13px' }}
                            />
                          </div>
                          {/* Finding items */}
                          {findings.map((findingText: string, k: number) => (
                            <div key={k}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={panelLabelStyle}>الملاحظة {si + 1}.{sj + 1}.{k + 1}</label>
                                {elementTextOverrides[getFindingKey(sub, findingText)] !== undefined && (
                                  <button type="button" onClick={() => resetFindingItem(sub, findingText)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>إعادة ضبط</button>
                                )}
                              </div>
                              <textarea
                                value={getFindingValue(findingText, sub)}
                                onChange={(e) => updateFindingItem(sub, findingText, e.target.value)}
                                rows={2}
                                style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, fontSize: '13px' }}
                              />
                            </div>
                          ))}
                          {/* Subsection narrative */}
                          {Boolean(sub?.narrativeText) && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={panelLabelStyle}>سرد القسم الفرعي {si + 1}.{sj + 1}</label>
                                {elementTextOverrides[getSubsectionNarrativeKey(sub)] !== undefined && (
                                  <button type="button" onClick={() => resetSubsectionNarrative(sub)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '11px' }}>إعادة ضبط</button>
                                )}
                              </div>
                              <textarea
                                value={getSubsectionNarrativeValue(sub)}
                                onChange={(e) => updateSubsectionNarrative(sub, e.target.value)}
                                rows={3}
                                style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, fontSize: '13px' }}
                              />
                            </div>
                          )}
                          {/* Subsection-level finding lists */}
                          {SECTION_LIST_TYPES_LOCAL.map((type) => {
                            const showKey = showFlagFn(type);
                            const list: string[] = (sub?.[showKey] && Array.isArray(sub?.[`${type}List`])) ? sub[`${type}List`] : [];
                            if (list.length === 0) return null;
                            return (
                              <div key={type} style={{ borderTop: '1px dashed #f1f5f9', paddingTop: '6px', display: 'grid', gap: '4px' }}>
                                <div style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{subListLabels[type]} ({list.length})</div>
                                {list.map((baseText: string, k: number) => (
                                  <div key={k}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                      <label style={{ ...panelLabelStyle, fontSize: '11px' }}>{subListLabels[type]} {si + 1}.{sj + 1}.{k + 1}</label>
                                      {elementTextOverrides[getSubsectionListKey(sub, type, baseText)] !== undefined && (
                                        <button type="button" onClick={() => resetSubsectionListItem(sub, type, baseText)} style={{ ...panelButtonStyle, padding: '2px 6px', fontSize: '10px' }}>إعادة ضبط</button>
                                      )}
                                    </div>
                                    <textarea
                                      value={getSubsectionListValue(type, baseText, sub)}
                                      onChange={(e) => updateSubsectionListItem(sub, type, baseText, e.target.value)}
                                      rows={2}
                                      style={{ ...panelControlStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, fontSize: '12px' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    );
  };

  const renderPropertiesPanelPlaceholder = () => {
    const inspector = (() => {
      if (selectedElementType === 'spacer') return renderSpacerInspector();
      if (isTitleInspectorActive) return renderTitleInspector();
      if (selectedElementType === 'numbering') return renderIntroHeadingInspector();
      if (isIntroductionParagraphInspectorActive) return renderIntroductionParagraphInspector();
      if (isCommitteeInspectorActive) return renderCommitteeInspector();
      if (isSummaryTablesInspectorActive) return renderSummaryTablesInspector();
      if (isOfficialNotesInspectorActive) return renderOfficialNotesInspector();
      if (isRecommendationsInspectorActive) return renderRecommendationsInspector();
      if (isAppendicesInspectorActive) return renderAppendicesInspector();
      if (isFinalEvaluationInspectorActive) return renderFinalEvaluationInspector();
      if (isSignaturesInspectorActive) return renderSignaturesInspector();
      if (isSectionInspectorActive) return renderSectionInspector();
      return null;
    })();

    const readOnlyPanel = !inspector ? (
      <aside style={shellPanelStyle} aria-label="الخصائص" data-selected-node-type={selectedNodeType || undefined}>
      <div style={shellPanelHeaderStyle}>
        <h3 style={shellPanelTitleStyle}>الخصائص</h3>
        <p style={shellPanelHintStyle}>اختر عنصراً من صفحة A4 لعرض خصائصه وتعديل النص أو التنسيق.</p>
      </div>
      <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#ffffff', display: 'grid', gap: '10px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, marginBottom: '4px' }}>العنصر المحدد</div>
            <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedStructureNode?.label || 'لم يتم تحديد عنصر'}
            </div>
          </div>
        </div>

        <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.7 }}>
          اختر عنصراً داخل معاينة A4 لتعديل النص أو التنسيق المتاح.
        </div>
      </div>
      </aside>
    ) : null;

    const unifiedShell = renderUnifiedInspectorShell();
    return (
      <div>
        {unifiedShell}
        {inspector ?? readOnlyPanel}
      </div>
    );
  };

  const renderUnifiedInspectorShell = () => {
    if (!selectedElementId) return null;
    const model = resolveSelectableFragment(selectedElementId);
    if (!model) return null;

    const badgeStyle = (active: boolean): React.CSSProperties => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: active ? '#dcfce7' : '#f1f5f9',
      color: active ? '#166534' : '#94a3b8',
    });

    const renderStyleControls = (m: SelectableFragment) => {
      const styleProps = (() => {
        if (m.kind === 'mainTitle') return { colorKey: 'mainTitleColor' as const, fontSizeKey: 'mainTitleFontSize' as const };
        if (m.kind === 'introHeading') return { colorKey: 'numberingColor' as const, fontSizeKey: 'numberingFontSize' as const };
        if (m.kind === 'introParagraph') return { colorKey: 'paragraphColor' as const, fontSizeKey: 'paragraphFontSize' as const };
        return { colorKey: 'paragraphColor' as const, fontSizeKey: 'paragraphFontSize' as const };
      })();

      if (!m.canStyle) {
        return (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#ffffff', display: 'grid', gap: '10px' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900 }}>التنسيق</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>هذا العنصر لا يدعم التنسيق.</div>
          </div>
        );
      }

      return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#ffffff', display: 'grid', gap: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900 }}>التنسيق</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div>
              <label style={panelLabelStyle}>لون النص</label>
              <input
                type="color"
                value={String(getSelectedStyleValue(styleProps.colorKey))}
                onChange={(e) => updateSelectedStyle(styleProps.colorKey, e.target.value)}
                style={{ ...panelControlStyle, padding: '3px' }}
              />
            </div>
            <div>
              <label style={panelLabelStyle}>حجم النص</label>
              <input
                type="number"
                min={9}
                max={32}
                step={0.5}
                value={Number(getSelectedStyleValue(styleProps.fontSizeKey))}
                onChange={(e) => updateSelectedStyle(styleProps.fontSizeKey, Number(e.target.value))}
                style={panelControlStyle}
              />
            </div>
            {m.canPageBreakBefore && (
              <div>
                <label style={{ ...panelLabelStyle, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={manualPageBreaks.includes(selectedElementId!)}
                    onChange={() => onTogglePageBreak(selectedElementId!)}
                    style={{ marginLeft: '6px' }}
                  />
                  بدء هذا العنصر في صفحة جديدة
                </label>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <aside style={{ ...shellPanelStyle, marginBottom: '8px' }} aria-label="الخصائص الموحدة">
        <div style={shellPanelHeaderStyle}>
          <h3 style={{ ...shellPanelTitleStyle, fontSize: '13px' }}>الخصائص الموحدة</h3>
        </div>
        <div style={{ padding: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#ffffff', display: 'grid', gap: '10px' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, marginBottom: '2px' }}>اسم العنصر</div>
              <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 900 }}>{model.labelArabic}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, marginBottom: '2px' }}>نوع العنصر</div>
              <div style={{ color: '#475569', fontSize: '12px' }} dir="ltr">{model.kind}</div>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#ffffff', display: 'grid', gap: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, marginBottom: '2px' }}>الصلاحيات المتاحة لهذا العنصر</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={badgeStyle(model.canStyle)}>{model.canStyle ? 'تنسيق' : '—'}</span>
              <span style={badgeStyle(model.canReorder)}>{model.canReorder ? 'تحريك' : '—'}</span>
              <span style={badgeStyle(model.canPageBreakBefore)}>{model.canPageBreakBefore ? 'فاصل صفحات' : '—'}</span>
              <span style={badgeStyle(model.canHide)}>{model.canHide ? 'إخفاء' : '—'}</span>
              <span style={badgeStyle(model.canDelete)}>{model.canDelete ? 'حذف' : '—'}</span>
            </div>
          </div>

          {renderStyleControls(model)}
        </div>
      </aside>
    );
  };

  return renderPropertiesPanelPlaceholder();
};
