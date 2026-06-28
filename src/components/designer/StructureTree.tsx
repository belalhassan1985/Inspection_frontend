import React from 'react';
import { resolveStructureFlowTargetId } from '../../utils/designerFlowTargets';

// ── Types ──

export type OfficialNodeType =
  | 'Header'
  | 'Title'
  | 'Introduction'
  | 'Table'
  | 'Section'
  | 'Manual Notes'
  | 'Recommendations'
  | 'Protected Evaluation'
  | 'Appendices'
  | 'Signatures'
  | 'Footer';

export type OfficialInspectorType =
  | 'Header Inspector'
  | 'Title Inspector'
  | 'Paragraph Inspector'
  | 'Table Inspector'
  | 'Section Inspector'
  | 'Manual Notes Inspector'
  | 'Recommendations Inspector'
  | 'Evaluation Inspector'
  | 'Appendices Inspector'
  | 'Signatures Inspector'
  | 'Footer Inspector';

export type OfficialNodeBadge = 'Protected' | 'Reserved';

export type OfficialStructureNode = {
  id: string;
  label: string;
  type: OfficialNodeType;
  officialSequence?: string;
  inspectorType: OfficialInspectorType;
  canvasAnchorId?: string;
  badge?: OfficialNodeBadge;
  note?: string;
  children?: OfficialStructureNode[];
};

// ── Static data ──

export const officialStructureTree: OfficialStructureNode[] = [
  {
    id: 'header',
    label: 'رأس التقرير',
    type: 'Header',
    officialSequence: 'قبل العنوان',
    inspectorType: 'Header Inspector',
    canvasAnchorId: 'frag-report-header',
    children: [{ id: 'header-main', label: 'رأس التقرير', type: 'Header', officialSequence: 'قبل العنوان', inspectorType: 'Header Inspector', canvasAnchorId: 'frag-report-header' }],
  },
  {
    id: 'title',
    label: 'العنوان',
    type: 'Title',
    officialSequence: 'العنوان الرئيسي',
    inspectorType: 'Title Inspector',
    canvasAnchorId: 'frag-report-title',
    children: [{ id: 'frag-report-title:main-title', label: 'العنوان الرئيسي', type: 'Title', officialSequence: 'العنوان الرئيسي', inspectorType: 'Title Inspector', canvasAnchorId: 'frag-report-title' }],
  },
  {
    id: 'introduction',
    label: 'المقدمة',
    type: 'Introduction',
    officialSequence: '1-4. المقدمة الرسمية',
    inspectorType: 'Paragraph Inspector',
    canvasAnchorId: 'frag-assignment',
    children: [
      { id: 'assignment', label: 'التكليف', type: 'Introduction', officialSequence: '1. التكليف', inspectorType: 'Paragraph Inspector', canvasAnchorId: 'frag-assignment' },
      { id: 'committee', label: 'التأليف', type: 'Introduction', officialSequence: '2. التأليف', inspectorType: 'Paragraph Inspector', canvasAnchorId: 'frag-committee', note: 'التأليف يعرض أعضاء اللجنة كبيانات منظمة، ويتم تحريره فقط عبر Committee Inspector داخل المصمم.' },
      { id: 'purpose', label: 'الغاية', type: 'Introduction', officialSequence: '3. الغاية', inspectorType: 'Paragraph Inspector', canvasAnchorId: 'frag-purpose' },
      { id: 'visit-date', label: 'تاريخ التفتيش', type: 'Introduction', officialSequence: '4. تاريخ التفتيش', inspectorType: 'Paragraph Inspector', canvasAnchorId: 'frag-visit-date' },
    ],
  },
  {
    id: 'tables',
    label: 'الجداول',
    type: 'Table',
    officialSequence: '5-6. الجداول الرسمية',
    inspectorType: 'Table Inspector',
    canvasAnchorId: 'frag-summary-tables-title',
    children: [
      { id: 'commanders-table', label: 'جدول المدراء والآمرين', type: 'Table', officialSequence: '5. جدول المدراء والآمرين', inspectorType: 'Table Inspector', canvasAnchorId: 'frag-summary-tables-title' },
      {
        id: 'official-positions',
        label: 'المواقف الرسمية ونسب التكامل الفعلي',
        type: 'Table',
        officialSequence: '6. المواقف الرسمية ونسب التكامل الفعلي',
        inspectorType: 'Table Inspector',
        badge: 'Protected',
        note: 'قسم رسمي محمي من الحذف أو تغيير التسلسل. التنسيق قابل للتعديل عند توفر بياناته.',
      },
    ],
  },
  {
    id: 'sections',
    label: 'تفاصيل التفتيش',
    type: 'Section',
    officialSequence: '7. تفاصيل التفتيش',
    inspectorType: 'Section Inspector',
    canvasAnchorId: 'frag-inspection-details-title',
    children: [
      {
        id: 'inspection-details',
        label: 'تفاصيل التفتيش',
        type: 'Section',
        officialSequence: '7. تفاصيل التفتيش',
        inspectorType: 'Section Inspector',
        canvasAnchorId: 'frag-inspection-details-title',
        children: [
          { id: 'main-sections', label: 'الأقسام الرئيسية', type: 'Section', officialSequence: '7. تفاصيل التفتيش / الأقسام الرئيسية', inspectorType: 'Section Inspector', canvasAnchorId: 'frag-inspection-details-title' },
          { id: 'subsections', label: 'الأقسام الفرعية', type: 'Section', officialSequence: '7. تفاصيل التفتيش / الأقسام الفرعية', inspectorType: 'Section Inspector', canvasAnchorId: 'frag-inspection-details-title' },
        ],
      },
    ],
  },
  {
    id: 'manual-notes',
    label: 'الملاحظات الرسمية',
    type: 'Manual Notes',
    officialSequence: '8. الملاحظات الرسمية',
    inspectorType: 'Manual Notes Inspector',
    canvasAnchorId: 'frag-official-notes-title',
    children: [{ id: 'official-notes', label: 'الملاحظات الرسمية', type: 'Manual Notes', officialSequence: '8. الملاحظات الرسمية', inspectorType: 'Manual Notes Inspector', canvasAnchorId: 'frag-official-notes-title' }],
  },
  {
    id: 'recommendations',
    label: 'التوصيات',
    type: 'Recommendations',
    officialSequence: '9. التوصيات',
    inspectorType: 'Recommendations Inspector',
    canvasAnchorId: 'frag-recommendations-title',
    children: [{ id: 'recommendations-main', label: 'التوصيات', type: 'Recommendations', officialSequence: '9. التوصيات', inspectorType: 'Recommendations Inspector', canvasAnchorId: 'frag-recommendations-title' }],
  },
  {
    id: 'protected-evaluation',
    label: 'التقييم النهائي',
    type: 'Protected Evaluation',
    officialSequence: '10. التقييم النهائي',
    inspectorType: 'Evaluation Inspector',
    canvasAnchorId: 'frag-final-evaluation',
    badge: 'Protected',
    note: 'محمي من الحذف أو تغيير التسلسل، لكنه قابل لتعديل المحتوى والتنسيق.',
    children: [{ id: 'final-evaluation', label: 'التقييم النهائي', type: 'Protected Evaluation', officialSequence: '10. التقييم النهائي', inspectorType: 'Evaluation Inspector', canvasAnchorId: 'frag-final-evaluation', badge: 'Protected', note: 'محمي من الحذف أو تغيير التسلسل، لكنه قابل لتعديل المحتوى والتنسيق.' }],
  },
  {
    id: 'appendices',
    label: 'الملاحق',
    type: 'Appendices',
    officialSequence: '11. الملاحق',
    inspectorType: 'Appendices Inspector',
    canvasAnchorId: 'frag-appendices-title',
    children: [{ id: 'appendices-main', label: 'الملاحق', type: 'Appendices', officialSequence: '11. الملاحق', inspectorType: 'Appendices Inspector', canvasAnchorId: 'frag-appendices-title' }],
  },
  {
    id: 'signatures',
    label: 'التوقيعات',
    type: 'Signatures',
    officialSequence: 'بعد الملاحق. التوقيعات',
    inspectorType: 'Signatures Inspector',
    canvasAnchorId: 'frag-signatures',
    children: [{ id: 'signatures-main', label: 'التوقيعات', type: 'Signatures', officialSequence: 'بعد الملاحق. التوقيعات', inspectorType: 'Signatures Inspector', canvasAnchorId: 'frag-signatures' }],
  },
  {
    id: 'footer',
    label: 'تذييل الصفحة',
    type: 'Footer',
    officialSequence: 'بيانات الصفحة الرسمية',
    inspectorType: 'Footer Inspector',
    badge: 'Reserved',
    note: 'محجوز للاستخدام لاحقاً.',
    children: [{ id: 'footer-reserved', label: 'تذييل الصفحة (محجوز)', type: 'Footer', officialSequence: 'بيانات الصفحة الرسمية', inspectorType: 'Footer Inspector', badge: 'Reserved', note: 'محجوز للاستخدام لاحقاً.' }],
  },
];

// ── Helpers ──

export const findStructureNodeById = (nodes: OfficialStructureNode[], nodeId: string | null): OfficialStructureNode | null => {
  if (!nodeId) return null;
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const childMatch = findStructureNodeById(node.children || [], nodeId);
    if (childMatch) return childMatch;
  }
  return null;
};

const normalizeStructureText = (value: string) => value.toLowerCase().trim();

const structureNodeMatches = (node: OfficialStructureNode, query: string): boolean => {
  if (!query) return true;
  if (normalizeStructureText(node.label).includes(query)) return true;
  return (node.children || []).some((child) => structureNodeMatches(child, query));
};

// ── Shared styles (passed from parent for consistency) ──

interface StructureTreeSharedStyles {
  shellPanelStyle: React.CSSProperties;
  shellPanelHeaderStyle: React.CSSProperties;
  shellPanelTitleStyle: React.CSSProperties;
  shellPanelHintStyle: React.CSSProperties;
  panelControlStyle: React.CSSProperties;
  panelButtonStyle: React.CSSProperties;
}

// ── Component ──

export interface StructureTreeProps extends StructureTreeSharedStyles {
  structureSearch: string;
  setStructureSearch: (v: string) => void;
  expandedStructureNodes: Record<string, boolean>;
  setExpandedStructureNodes: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  selectedNodeId: string | null;
  activeViewportNodeId?: string | null;
  manualPageBreaks: string[];
  onSelectNode: (node: OfficialStructureNode) => void;
  onTogglePageBreak: (nodeId: string) => void;
  onAddSpacer: () => void;
}

export const StructureTree: React.FC<StructureTreeProps> = ({
  structureSearch,
  setStructureSearch,
  expandedStructureNodes,
  setExpandedStructureNodes,
  selectedNodeId,
  activeViewportNodeId,
  manualPageBreaks,
  onSelectNode,
  onTogglePageBreak,
  onAddSpacer,
  shellPanelStyle,
  shellPanelHeaderStyle,
  shellPanelTitleStyle,
  shellPanelHintStyle,
  panelControlStyle,
  panelButtonStyle,
}) => {
  const toggleStructureNode = (nodeId: string) => {
    setExpandedStructureNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const setAllStructureNodes = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    const visit = (nodes: OfficialStructureNode[]) => {
      nodes.forEach((node) => {
        if (node.children?.length) {
          next[node.id] = expanded;
          visit(node.children);
        }
      });
    };
    visit(officialStructureTree);
    setExpandedStructureNodes(() => next);
  };

  const renderStructureNode = (node: OfficialStructureNode, depth = 0): React.ReactNode => {
    const query = normalizeStructureText(structureSearch);
    if (!structureNodeMatches(node, query)) return null;

    const children = node.children || [];
    const hasChildren = children.length > 0;
    const expanded = query ? true : !!expandedStructureNodes[node.id];
    const selected = selectedNodeId === node.id;
    const viewportActive = activeViewportNodeId === node.id && !selected;
    const protectedNode = node.badge === 'Protected' || node.badge === 'Reserved';
    const flowTargetId = resolveStructureFlowTargetId(node.id, node.canvasAnchorId);
    const hasPageBreak = flowTargetId ? manualPageBreaks.includes(flowTargetId) : false;

    return (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => onSelectNode(node)}
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '18px minmax(0, 1fr) auto',
            gap: '6px',
            alignItems: 'center',
            border: '1px solid',
            borderColor: selected ? '#7c3aed' : viewportActive ? '#cbd5e1' : 'transparent',
            borderRightWidth: viewportActive ? '3px' : '1px',
            borderRightColor: viewportActive ? '#6366f1' : undefined,
            borderRadius: '6px',
            backgroundColor: selected ? '#f5f3ff' : viewportActive ? '#f1f5f9' : protectedNode ? '#fffbeb' : '#ffffff',
            color: protectedNode ? '#92400e' : '#334155',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: depth === 0 ? '12.5px' : '12px',
            fontWeight: depth === 0 ? 800 : selected ? 800 : 600,
            lineHeight: 1.5,
            padding: '6px 8px',
            paddingRight: `${8 + depth * 14}px`,
            textAlign: 'right',
          }}
        >
          <span
            onClick={(event) => {
              event.stopPropagation();
              if (hasChildren) toggleStructureNode(node.id);
            }}
            style={{ color: '#64748b', textAlign: 'center', cursor: hasChildren ? 'pointer' : 'default' }}
          >
            {hasChildren ? (expanded ? '-' : '+') : ''}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</span>
          <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {hasPageBreak && (
              <span
                style={{
                  border: '1px solid #6366f1',
                  borderRadius: '4px',
                  color: '#312e81',
                  backgroundColor: '#e0e7ff',
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                فاصل صفحة
              </span>
            )}
            {node.badge && (
              <span
                style={{
                  border: '1px solid #f59e0b',
                  borderRadius: '999px',
                  color: '#92400e',
                  backgroundColor: '#fef3c7',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                {node.badge === 'Protected' ? 'محمي' : 'محجوز'}
              </span>
            )}
          </span>
        </button>
        {selected && !protectedNode && flowTargetId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', paddingRight: `${8 + depth * 14}px`, alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onTogglePageBreak(flowTargetId)}
              style={{
                border: hasPageBreak ? '1px solid #dc2626' : '1px solid #6366f1',
                borderRadius: '4px',
                backgroundColor: hasPageBreak ? '#fee2e2' : '#e0e7ff',
                color: hasPageBreak ? '#991b1b' : '#312e81',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {hasPageBreak ? 'إزالة فاصل الصفحة' : 'إضافة فاصل صفحة قبل هذا القسم'}
            </button>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {hasPageBreak ? 'يزيل فاصل الصفحة قبل هذا القسم' : 'يبدأ هذا القسم في صفحة جديدة'}
            </span>
          </div>
        )}
        {hasChildren && expanded && (
          <div style={{ display: 'grid', gap: '4px', marginTop: '4px' }}>
            {children.map((child) => renderStructureNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside style={shellPanelStyle} aria-label="هيكل التقرير">
      <div style={shellPanelHeaderStyle}>
        <h3 style={shellPanelTitleStyle}>هيكل التقرير</h3>
        <p style={shellPanelHintStyle}>تسلسل التقرير الرسمي، وعند اختيار أي فقرة يتم الانتقال إلى موقعها داخل الصفحة.</p>
      </div>
      <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'grid', gap: '8px' }}>
        <input
          type="search"
          value={structureSearch}
          onChange={(event) => setStructureSearch(event.target.value)}
          placeholder="البحث في هيكل التقرير"
          style={{ ...panelControlStyle, fontSize: '12px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button type="button" onClick={() => setAllStructureNodes(true)} style={{ ...panelButtonStyle, padding: '6px 8px', fontSize: '11px' }}>
            توسيع الكل
          </button>
          <button type="button" onClick={() => setAllStructureNodes(false)} style={{ ...panelButtonStyle, padding: '6px 8px', fontSize: '11px' }}>
            طي الكل
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '6px', padding: '12px' }}>
        {officialStructureTree.map((node) => renderStructureNode(node))}
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={onAddSpacer}
          style={{
            ...panelButtonStyle,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 800,
            width: '100%',
            border: '1px dashed #7c3aed',
            color: '#7c3aed',
            backgroundColor: '#f5f3ff',
          }}
        >
          إضافة مسافة
        </button>
      </div>
    </aside>
  );
};
