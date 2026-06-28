// ── Shared designer types, constants, and helpers ──
// Used by ReportDesigner.tsx, PropertiesPanel.tsx, and StructureTree.tsx

// ── Types ──

export type FontFamilyChoice = 'Cairo' | 'Arial' | 'Times New Roman';
export type FontWeightChoice = 'normal' | 'bold';
export type TitleTextAlignChoice = 'right' | 'center' | 'left';
export type CommitteeMemberDraft = { rank: string; name: string; role: string };
export type PageMarginChoice = 'narrow' | 'normal' | 'wide';
export type TableBorderWidthChoice = 0 | 1 | 2 | 3;
export type TableCellPaddingChoice = 'compact' | 'normal' | 'comfortable';
export type SelectedElementType = 'page' | 'mainTitle' | 'numbering' | 'paragraph' | 'subheading' | 'table' | 'tableCell' | 'spacer' | null;
export type PropertiesTab = 'content' | 'style' | 'layout' | 'actions';
export type DraftSaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';
export type DesignerMode = 'edit';
export type InspectorStatusBadge = 'Editable Later' | 'Protected' | 'Reserved' | 'Has Anchor' | 'Missing Anchor';

export type DesignerStyleState = {
  pageMargin: PageMarginChoice;
  showPageBorder: boolean;
  showContentBounds: boolean;
  showSafeArea: boolean;
  mainTitleFontFamily: FontFamilyChoice;
  mainTitleFontSize: number;
  mainTitleColor: string;
  mainTitleWeight: FontWeightChoice;
  numberingFontSize: number;
  numberingColor: string;
  numberingWeight: FontWeightChoice;
  numberingLevel1Color: string;
  numberingLevel1FontSize: number;
  numberingLevel1Weight: FontWeightChoice;
  numberingLevel2Color: string;
  numberingLevel2FontSize: number;
  numberingLevel2Weight: FontWeightChoice;
  numberingLevel3Color: string;
  numberingLevel3FontSize: number;
  numberingLevel3Weight: FontWeightChoice;
  numberingLevel4Color: string;
  numberingLevel4FontSize: number;
  numberingLevel4Weight: FontWeightChoice;
  paragraphFontSize: number;
  paragraphColor: string;
  paragraphLineHeight: number;
  tableBorderWidth: TableBorderWidthChoice;
  tableBorderColor: string;
  tableHeaderBackgroundColor: string;
  tableHeaderTextColor: string;
  tableCellPadding: TableCellPaddingChoice;
  tableFontSize: number;
  tableFontWeight: FontWeightChoice;
};

export type ElementStyleOverride = Partial<DesignerStyleState> & {
  titleTextAlign?: TitleTextAlignChoice;
  titleSpacingBefore?: number;
  titleSpacingAfter?: number;
  paragraphFontWeight?: FontWeightChoice;
  paragraphSpacingBefore?: number;
  paragraphSpacingAfter?: number;
  itemSpacing?: number;
  signatureGap?: number;
  nameFontSize?: number;
  nameColor?: string;
  nameFontWeight?: FontWeightChoice;
  roleFontSize?: number;
  roleColor?: string;
  roleFontWeight?: FontWeightChoice;
};

export type DesignerSpacer = {
  id: string;
  afterFragmentIndex: number;
  heightMm: number;
  afterSectionIndex: number;
};

export type IntroductionParagraphNodeId = 'assignment' | 'purpose' | 'visit-date';
export type OfficialNotesListType = 'positives' | 'negatives' | 'impediments' | 'obstacles';
export type OfficialNotesOverrideData = Record<OfficialNotesListType, string[]>;
export type RecommendationDraftGroup = { id?: string | number; authority: string; recs: RecommendationDraftItem[] };
export type RecommendationDraftItem = { id?: string | number; text: string; children: RecommendationDraftChild[] };
export type RecommendationDraftChild = { id?: string | number; text: string };
export type AppendixDraft = { id?: string | number; symbol: string; text: string };
export type SignatureDraft = { rank: string; name: string; role: string };
export type PaginationRule = { pageBreakBefore?: boolean };

// ── Phase 47A: Unified Selectable Fragment Model ──
// A designer-friendly model that maps every selectable report fragment
// to its capabilities (style, reorder, page break, hide, delete).

export type SelectableFragmentKind =
  | 'mainTitle'
  | 'introParagraph'
  | 'introHeading'
  | 'committee'
  | 'summaryTableTitle'
  | 'sectionTitle'
  | 'sectionNarrative'
  | 'subsectionTitle'
  | 'subsectionNarrative'
  | 'findingItem'
  | 'listItem'
  | 'officialNotesTitle'
  | 'notesCategoryTitle'
  | 'noteItem'
  | 'recommendationsTitle'
  | 'recommendationAuthorityTitle'
  | 'recommendationItem'
  | 'appendicesTitle'
  | 'appendixItem'
  | 'finalEvaluation'
  | 'signatures';

export type SelectableFragment = {
  fragmentId: string;
  labelArabic: string;
  kind: SelectableFragmentKind;
  canStyle: boolean;
  canReorder: boolean;
  canPageBreakBefore: boolean;
  canHide: boolean;
  canDelete: boolean;
};

// ── Constants ──

export const TITLE_ELEMENT_ID = 'frag-report-title:main-title';
export const INTRODUCTION_PARAGRAPH_NODE_IDS = ['assignment', 'purpose', 'visit-date'] as const;
export const COMMITTEE_CONTENT_ID = 'frag-committee:committee-members';
export const COMMITTEE_STYLE_ID = 'frag-committee:committee-style';
export const SUMMARY_TABLES_CONTENT_ID = 'frag-summary-tables:summary-titles';
export const SUMMARY_TABLES_STYLE_ID = 'frag-summary-tables:summary-style';
export const SUMMARY_TABLES_NODE_IDS = ['tables', 'commanders-table', 'official-positions'] as const;
export const OFFICIAL_NOTES_CONTENT_ID = 'frag-official-notes:notes-content';
export const OFFICIAL_NOTES_STYLE_ID = 'frag-official-notes:notes-style';
export const OFFICIAL_NOTES_NODE_IDS = ['manual-notes', 'official-notes'] as const;
export const OFFICIAL_NOTES_LIST_TYPES: OfficialNotesListType[] = ['positives', 'negatives', 'impediments', 'obstacles'];
export const OFFICIAL_NOTES_LIST_LABELS: Record<OfficialNotesListType, string> = {
  positives: 'الإيجابيات',
  negatives: 'السلبيات',
  impediments: 'المعوقات',
  obstacles: 'المعاضل',
};
export const RECOMMENDATIONS_CONTENT_ID = 'frag-recommendations:recommendations-content';
export const RECOMMENDATIONS_STYLE_ID = 'frag-recommendations:recommendations-style';
export const RECOMMENDATIONS_NODE_IDS = ['recommendations', 'recommendations-main'] as const;
export const APPENDICES_CONTENT_ID = 'frag-appendices:appendices-content';
export const APPENDICES_STYLE_ID = 'frag-appendices:appendices-style';
export const APPENDICES_NODE_IDS = ['appendices', 'appendices-main'] as const;
export const FINAL_EVALUATION_CONTENT_ID = 'frag-final-evaluation:evaluation-content';
export const FINAL_EVALUATION_STYLE_ID = 'frag-final-evaluation:evaluation-style';
export const FINAL_EVALUATION_NODE_IDS = ['protected-evaluation', 'final-evaluation'] as const;
export const SIGNATURES_CONTENT_ID = 'frag-signatures:signatures-content';
export const SIGNATURES_STYLE_ID = 'frag-signatures:signatures-style';
export const SIGNATURES_NODE_IDS = ['signatures', 'signatures-main'] as const;
export const SECTIONS_NODE_IDS = ['sections', 'inspection-details', 'main-sections', 'subsections'] as const;

export const SELECTED_ELEMENT_LABELS: Record<Exclude<SelectedElementType, null>, string> = {
  page: 'Page Bounds',
  mainTitle: 'Main Title',
  numbering: 'Numbering',
  paragraph: 'Paragraph Text',
  subheading: 'Subheading',
  table: 'Table',
  tableCell: 'Table Cell',
  spacer: 'Vertical Spacer',
};

export const FONT_STACKS: Record<FontFamilyChoice, string> = {
  Cairo: "'Cairo', 'Times New Roman', Arial, sans-serif",
  Arial: "Arial, 'Times New Roman', sans-serif",
  'Times New Roman': "'Times New Roman', Arial, sans-serif",
};

export const CONTENT_BOUNDS_INSET_MM: Record<PageMarginChoice, string> = {
  narrow: '12mm 12mm 12mm 12mm',
  normal: '20mm 15mm 20mm 15mm',
  wide: '28mm 24mm 28mm 24mm',
};

export const TABLE_CELL_PADDING_PX: Record<TableCellPaddingChoice, string> = {
  compact: '4px 6px',
  normal: '8px 10px',
  comfortable: '12px 14px',
};

export const DEFAULT_STYLE_STATE: DesignerStyleState = {
  pageMargin: 'normal',
  showPageBorder: false,
  showContentBounds: false,
  showSafeArea: false,
  mainTitleFontFamily: 'Cairo',
  mainTitleFontSize: 20,
  mainTitleColor: '#0f172a',
  mainTitleWeight: 'bold',
  numberingFontSize: 16,
  numberingColor: '#0c2340',
  numberingWeight: 'bold',
  numberingLevel1Color: '',
  numberingLevel1FontSize: 0,
  numberingLevel1Weight: 'normal',
  numberingLevel2Color: '',
  numberingLevel2FontSize: 0,
  numberingLevel2Weight: 'normal',
  numberingLevel3Color: '',
  numberingLevel3FontSize: 0,
  numberingLevel3Weight: 'normal',
  numberingLevel4Color: '',
  numberingLevel4FontSize: 0,
  numberingLevel4Weight: 'normal',
  paragraphFontSize: 13.5,
  paragraphColor: '#2d3748',
  paragraphLineHeight: 1.8,
  tableBorderWidth: 1,
  tableBorderColor: '#000000',
  tableHeaderBackgroundColor: '#f2f2f2',
  tableHeaderTextColor: '#000000',
  tableCellPadding: 'normal',
  tableFontSize: 13,
  tableFontWeight: 'normal',
};

// ── Helper functions ──

export const toCssPropertyName = (key: string) => key.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase());

export const isHexColor = (v: string): boolean => /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);

const KNOWN_RANK_PREFIXES = [
  'فريق أول',
  'فريق',
  'لواء',
  'عميد',
  'عقيد',
  'مقدم',
  'رائد',
  'نقيب',
  'ملازم أول',
  'ملازم',
  'رئيس مهندسين',
  'مهندس',
];

const cleanCommitteeMemberText = (member: string) => member.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const splitRankAndName = (value: string) => {
  const clean = cleanCommitteeMemberText(value);
  const rank = KNOWN_RANK_PREFIXES.find((prefix) => clean === prefix || clean.startsWith(`${prefix} `));
  if (!rank) return { rank: '', name: clean };
  return { rank, name: clean.slice(rank.length).trim() };
};

export const parseCommitteeMemberDraft = (member: string): CommitteeMemberDraft => {
  const normalized = member.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim();
  const parts = normalized.split(/\s{2,}/).map((part) => cleanCommitteeMemberText(part)).filter(Boolean);

  if (parts.length >= 3) {
    return { rank: parts[0], name: parts[1], role: parts.slice(2).join(' ') };
  }

  if (parts.length === 2) {
    const person = splitRankAndName(parts[0]);
    return { rank: person.rank, name: person.name, role: parts[1] };
  }

  const roleCandidates = ['رئيس اللجنة', 'رئيـس اللجنة', 'معاون اللجنة', 'معـاون اللجنة', 'عضو اللجنة', 'عضو', 'عضواً'];
  const clean = cleanCommitteeMemberText(normalized);
  const role = roleCandidates.find((candidate) => clean.endsWith(candidate));
  if (role) {
    const person = splitRankAndName(clean.slice(0, clean.length - role.length).trim());
    return { rank: person.rank, name: person.name, role };
  }

  const person = splitRankAndName(clean);
  return { rank: person.rank, name: person.name, role: '' };
};

export const readCommitteeOverride = (raw: string | undefined): CommitteeMemberDraft[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((member) => ({
      rank: String(member?.rank || ''),
      name: String(member?.name || ''),
      role: String(member?.role || ''),
    }));
  } catch {
    return null;
  }
};

export const readOfficialNotesOverride = (raw: string | undefined): OfficialNotesOverrideData | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const result: any = {};
    for (const key of OFFICIAL_NOTES_LIST_TYPES) {
      result[key] = Array.isArray(parsed[key]) ? parsed[key].map(String) : undefined;
    }
    return result as OfficialNotesOverrideData;
  } catch {
    return null;
  }
};

export const readRecommendationsOverride = (raw: string | undefined): RecommendationDraftGroup[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((group: any) => ({
      id: group?.id,
      authority: String(group?.authority ?? ''),
      recs: Array.isArray(group?.recs) ? group.recs.map((rec: any) => ({
        id: rec?.id,
        text: String(rec?.text ?? ''),
        children: Array.isArray(rec?.children) ? rec.children.map((ch: any) => ({ id: ch?.id, text: String(ch?.text ?? '') })) : [],
      })) : [],
    }));
  } catch {
    return null;
  }
};

export const serializeRecommendationsOverride = (groups: RecommendationDraftGroup[]): string => {
  return JSON.stringify(groups);
};

export const readAppendicesOverride = (raw: string | undefined): AppendixDraft[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item: any) => ({
      id: item?.id,
      symbol: String(item?.symbol ?? ''),
      text: String(item?.text ?? ''),
    }));
  } catch {
    return null;
  }
};

export const readSignaturesOverride = (raw: string | undefined): SignatureDraft[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item: any) => ({
      rank: String(item?.rank ?? ''),
      name: String(item?.name ?? ''),
      role: String(item?.role ?? ''),
    }));
  } catch {
    return null;
  }
};

export const getSectionIndexFromFragmentIndex = (fragIndex: number, frags: { id: string }[]): number => {
  if (fragIndex < 0 || fragIndex >= frags.length) return -1;
  const id = frags[fragIndex].id;
  // Try old positional pattern
  const match = id.match(/^sec-(\d+)-/);
  if (match) return parseInt(match[1], 10);
  // Phase 46B: stable IDs — count preceding section/{*} title fragments
  let sectionCount = 0;
  for (let i = 0; i <= fragIndex; i++) {
    if (frags[i].id.startsWith('section/')) sectionCount++;
  }
  return sectionCount - 1;
};
