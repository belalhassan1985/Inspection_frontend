export const REPORT_BLOCK_TYPES = [
  'header',
  'title',
  'assignment',
  'committee',
  'introTable',
  'section',
  'finalEvaluation',
  'signatures',
] as const;

export type ReportBlockType = (typeof REPORT_BLOCK_TYPES)[number];

export type ReportBlockStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  titleColor?: string;
  align?: 'right' | 'center' | 'left' | 'justify';
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
};

export type ReportBlockLayout = {
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  keepTogether?: boolean;
  keepWithNext?: boolean;
  order?: number;
};

export type ReportBlockSource = {
  kind: 'payload';
  path: string;
};

export type ReportBlock = {
  id: string;
  type: ReportBlockType;
  title: string;
  content: unknown;
  source: ReportBlockSource;
  style: ReportBlockStyle;
  layout: ReportBlockLayout;
  visible: boolean;
  editable: boolean;
  children?: ReportBlock[];
};

export type ReportPresentation = {
  version: number;
  page: {
    size: 'A4';
    orientation: 'portrait';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  blockOrder: string[];
  pageBreaks: {
    id: string;
    blockId: string;
    type: 'before' | 'after';
  }[];
  blockStyles: Record<string, ReportBlockStyle>;
  blockLayout: Record<string, ReportBlockLayout>;
  hiddenBlocks: string[];
};

const defaultStyle: ReportBlockStyle = {
  fontFamily: 'Cairo',
  fontSize: 14,
  color: '#000000',
  align: 'right',
  lineHeight: 1.7,
};

const defaultLayout: ReportBlockLayout = {
  pageBreakBefore: false,
  pageBreakAfter: false,
  keepTogether: false,
  keepWithNext: false,
};

const createBlock = (block: Omit<ReportBlock, 'style' | 'layout' | 'visible' | 'editable'> & Partial<Pick<ReportBlock, 'style' | 'layout' | 'visible' | 'editable'>>): ReportBlock => ({
  ...block,
  style: { ...defaultStyle, ...block.style },
  layout: { ...defaultLayout, ...block.layout },
  visible: block.visible ?? true,
  editable: block.editable ?? true,
});

const stablePart = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

const normalizeIdPart = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

export const createDefaultReportPresentation = (): ReportPresentation => ({
  version: 1,
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 15,
      bottom: 20,
      left: 15,
    },
  },
  blockOrder: [],
  pageBreaks: [],
  blockStyles: {},
  blockLayout: {},
  hiddenBlocks: [],
});

export const buildReportBlocks = (reportPayload: any): ReportBlock[] => {
  if (!reportPayload) return [];

  const blocks: ReportBlock[] = [
    createBlock({
      id: 'report-header',
      type: 'header',
      title: 'رأس التقرير',
      content: {
        startDate: reportPayload.startDate,
        startDateText: reportPayload.startDateText,
        formationNumber: reportPayload.formationNumber,
        ministry: 'وزارة الداخلية',
        authority: 'هيئة تفتيش قوى الامن الداخلي',
      },
      source: { kind: 'payload', path: '$' },
      layout: { keepTogether: true },
    }),
    createBlock({
      id: 'report-title',
      type: 'title',
      title: reportPayload.title || reportPayload.reportTitle || 'عنوان التقرير',
      content: {
        title: reportPayload.title,
        reportTitle: reportPayload.reportTitle,
        campaignName: reportPayload.campaignName,
      },
      source: { kind: 'payload', path: '$.title' },
      style: { fontSize: 18, fontWeight: 'bold', align: 'center' },
      layout: { keepTogether: true, keepWithNext: true },
    }),
    createBlock({
      id: 'report-assignment',
      type: 'assignment',
      title: 'التكليف',
      content: {
        assignment: reportPayload.assignment,
        assignmentText: reportPayload.assignmentText,
        startDate: reportPayload.startDate,
        endDate: reportPayload.endDate,
      },
      source: { kind: 'payload', path: '$.assignment' },
      layout: { keepTogether: true },
    }),
    createBlock({
      id: 'report-committee',
      type: 'committee',
      title: 'التأليف',
      content: {
        committee: reportPayload.committee,
        leader: reportPayload.leader,
        members: reportPayload.members,
      },
      source: { kind: 'payload', path: '$.committee' },
      layout: { keepTogether: true },
    }),
  ];

  if (reportPayload.generalInfo || reportPayload.personnelRows || reportPayload.summaryTables) {
    blocks.push(createBlock({
      id: 'report-intro-tables',
      type: 'introTable',
      title: 'الجداول التمهيدية',
      content: {
        generalInfo: reportPayload.generalInfo,
        personnelRows: reportPayload.personnelRows,
        summaryTables: reportPayload.summaryTables,
      },
      source: { kind: 'payload', path: '$.generalInfo' },
      layout: { keepTogether: true },
    }));
  }

  const sectionBlocks = Array.isArray(reportPayload.sections)
    ? reportPayload.sections.map((section: any, index: number) => {
      const stableId = stablePart(section?.id ?? section?.key ?? section?.title, `section-${index + 1}`);
      return createBlock({
        id: `section-${normalizeIdPart(stableId) || index + 1}`,
        type: 'section',
        title: section?.title || `قسم ${index + 1}`,
        content: section,
        source: { kind: 'payload', path: `$.sections[${index}]` },
        visible: section?.visible !== false,
        layout: {
          keepTogether: false,
          pageBreakAfter: reportPayload.pagination?.pageBreaks?.some((pageBreak: any) => pageBreak?.sectionIndex === index) ?? false,
          order: index,
        },
      });
    })
    : [];

  blocks.push(...sectionBlocks);

  if (reportPayload.finalEvaluation) {
    blocks.push(createBlock({
      id: 'report-final-evaluation',
      type: 'finalEvaluation',
      title: 'التقييم النهائي',
      content: reportPayload.finalEvaluation,
      source: { kind: 'payload', path: '$.finalEvaluation' },
      layout: { keepTogether: true },
    }));
  }

  blocks.push(createBlock({
    id: 'report-signatures',
    type: 'signatures',
    title: 'التوقيعات',
    content: reportPayload.signatures || {},
    source: { kind: 'payload', path: '$.signatures' },
    layout: { keepTogether: true, pageBreakBefore: true },
  }));

  return blocks;
};
