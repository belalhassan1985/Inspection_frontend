import React from 'react';
import type { Fragment } from '../../utils/reportFragments';
import { DetailedTablesView } from '../reportView/DetailedTablesView';
import { NarrativeText } from '../reportView/NarrativeText';
import { SignaturesBlock } from '../reportView/SignaturesBlock';
import { FindingList } from '../reportView/FindingList';
import { ManualFindingList } from '../reportView/ManualFindingList';
import { ReportHeader } from '../reportView/ReportHeader';
import { ReportTitle } from '../reportView/ReportTitle';
import { AssignmentSection } from '../reportView/AssignmentSection';
import { CommitteeSection } from '../reportView/CommitteeSection';
import { PurposeSection } from '../reportView/PurposeSection';
import { VisitDateSection } from '../reportView/VisitDateSection';
import { SummaryTablesSection } from '../reportView/SummaryTablesSection';
import { OfficialNotesSection } from '../reportView/OfficialNotesSection';
import { RecommendationsSection } from '../reportView/RecommendationsSection';
import { AppendicesSection } from '../reportView/AppendicesSection';
import { FinalEvaluationSection } from '../reportView/FinalEvaluationSection';
import { formatArabicTableValue, getIndentation, getLevel4Number, toEasternArabicDigits } from '../../utils/reportNumbering';
import { getNumberingLevelFromText } from './designerStyleOverrides';

/**
 * FragmentRenderer — يعرض شظية واحدة عبر مكوّنات العرض المشتركة (Single Source of Truth).
 *
 * يُستخدم في موضعين بنفس الكود: داخل BlockMeasurer (للقياس) وداخل A4PageCanvas (للعرض)،
 * فيتطابق ما يُقاس مع ما يُعرض. قراءة فقط: editMode=false وكل الـ callbacks فارغة.
 */

const noop = () => {};

const nlAttr = (text?: string | number | null): { 'data-numbering-level': string } | undefined => {
  if (text === undefined || text === null) return undefined;
  const level = getNumberingLevelFromText(String(text));
  return level ? { 'data-numbering-level': String(level) } : undefined;
};

const SECTION_NUM_STYLE: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0c2340',
  marginTop: '30px',
  marginBottom: '10px',
};

const SECTION_BODY_STYLE: React.CSSProperties = {
  marginRight: '15px',
  marginBottom: '20px',
  textAlign: 'justify',
};

const SUMMARY_TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  maxWidth: '623px',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
  fontSize: '13px',
  lineHeight: '1.7',
  border: '1px solid #000',
  margin: '0',
};

const SUMMARY_ROW_KEEP_TOGETHER_STYLE: React.CSSProperties = {
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
  overflow: 'visible',
};

const SUMMARY_HEADER_CELLS = [
  { label: 'ت', width: '5%' },
  { label: 'المنصب', width: '22%' },
  { label: 'الرتبة', width: '10%' },
  { label: 'الاسم الكامل', width: '17%' },
  { label: 'الرقم الإحصائي', width: '10%' },
  { label: 'تاريخ إشغال المنصب', width: '16%' },
  { label: 'نوع الإشغال', width: '10%' },
  { label: 'التحصيل الدراسي', width: '10%' },
];

const SummaryTableTitle: React.FC<{ number: string }> = ({ number }) => (
  <div style={{ marginTop: SECTION_NUM_STYLE.marginTop, marginBottom: '0' }}>
    <h3 className="section-num rd-subheading-title" style={{ ...SECTION_NUM_STYLE, marginTop: 0 }}>
      <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>جدول المدراء والآمرين وشاغلي المناصب الأساسية</span>
    </h3>
  </div>
);

const SummaryTableHeader: React.FC = () => (
  <div className="section-body" style={{ ...SECTION_BODY_STYLE, marginTop: '15px', marginBottom: '0' }}>
    <table className="military-table" style={SUMMARY_TABLE_STYLE}>
      <thead>
        <tr style={{ backgroundColor: '#f2f2f2' }}>
          {SUMMARY_HEADER_CELLS.map((cell) => (
            <th key={cell.label} style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: cell.width, fontWeight: 'bold' }}>
              {cell.label}
            </th>
          ))}
        </tr>
      </thead>
    </table>
  </div>
);

const SummaryTableRow: React.FC<{ position?: any; index?: number; isEmpty?: boolean }> = ({ position, index = 0, isEmpty }) => {
  if (isEmpty) {
    return (
      <div className="section-body" style={{ ...SECTION_BODY_STYLE, ...SUMMARY_ROW_KEEP_TOGETHER_STYLE, marginBottom: '0' }}>
        <table className="military-table" style={{ ...SUMMARY_TABLE_STYLE, ...SUMMARY_ROW_KEEP_TOGETHER_STYLE }}>
          <tbody style={SUMMARY_ROW_KEEP_TOGETHER_STYLE}>
            <tr style={SUMMARY_ROW_KEEP_TOGETHER_STYLE}>
              <td colSpan={8} style={{ padding: '8px 10px', textAlign: 'center', color: '#718096', border: '1px solid #000' }}>
                لا توجد مناصب مسجلة في الهيكل الإداري حالياً.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const joinedDate = (() => {
    if (!position?.joinedDate) return '—';
    const d = new Date(position.joinedDate);
    if (isNaN(d.getTime())) return position.joinedDate;
    return d.toLocaleDateString('ar-EG');
  })();

  return (
    <div className="section-body" style={{ ...SECTION_BODY_STYLE, ...SUMMARY_ROW_KEEP_TOGETHER_STYLE, marginBottom: '0' }}>
      <table className="military-table" style={{ ...SUMMARY_TABLE_STYLE, ...SUMMARY_ROW_KEEP_TOGETHER_STYLE }}>
        <tbody style={SUMMARY_ROW_KEEP_TOGETHER_STYLE}>
          <tr style={SUMMARY_ROW_KEEP_TOGETHER_STYLE}>
            <td style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: '5%' }}>{formatArabicTableValue(index + 1)}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', fontWeight: 'bold', width: '22%' }}>{position?.positionName}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: '10%' }}>{position?.rank || '—'}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', width: '17%' }}>{position?.positionHolder || '—'}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: '10%' }}>{position?.statisticalNumber ? formatArabicTableValue(position.statisticalNumber) : '—'}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: '16%' }}>{joinedDate}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: '10%' }}>{position?.positionStatus || '—'}</td>
            <td style={{ padding: '8px 10px', border: '1px solid #000', textAlign: 'center', width: '10%' }}>{position?.education || '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const DetailedTableTitle: React.FC<{ table: any; formattingConfig: any }> = ({ table, formattingConfig }) => (
  <div style={{ marginTop: '15px', marginRight: getIndentation(4, formattingConfig) }}>
    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0c2340', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span>📊 {table.title}</span>
      <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#718096', marginRight: 'auto' }}>({table.entityName})</span>
    </div>
  </div>
);

const DetailedTableHeader: React.FC<{ table: any; formattingConfig: any }> = ({ table, formattingConfig }) => (
  <div className="rd-table-frame" style={{ marginRight: getIndentation(4, formattingConfig), width: 'auto', maxWidth: '100%' }}>
    <table className="military-table" style={{ margin: '0', width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #000' }}>
      <thead>
        <tr style={{ backgroundColor: '#f2f2f2' }}>
          {(table.schema || []).map((col: any, colIdx: number) => (
            <th key={col.key || colIdx} style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
    </table>
  </div>
);

const DetailedTableRow: React.FC<{ table: any; row?: any; isEmpty?: boolean; formattingConfig: any }> = ({ table, row, isEmpty, formattingConfig }) => (
  <div className="rd-table-frame" style={{ marginRight: getIndentation(4, formattingConfig), width: 'auto', maxWidth: '100%' }}>
    <table className="military-table" style={{ margin: '0', width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #000' }}>
      <tbody>
        {isEmpty ? (
          <tr>
            <td colSpan={(table.schema || []).length} style={{ padding: '10px', color: '#a0aec0', textAlign: 'center', border: '1px solid #000' }}>لا توجد سجلات.</td>
          </tr>
        ) : (
          <tr>
            {(table.schema || []).map((col: any, cIdx: number) => {
              const cellVal = row?.[col.key] !== undefined ? row[col.key] : '';
              const isPercentage = col.role === 'percentage';
              const displayVal = formatArabicTableValue(cellVal, { percentage: isPercentage });

              let textColor = '#000000';
              if (col.role === 'deficit' && Number(cellVal) > 0) textColor = '#c53030';
              if (col.role === 'increase' && Number(cellVal) > 0) textColor = '#2b6cb0';

              const isBold = col.role === 'label' || col.role === 'percentage' || col.role === 'deficit' || col.role === 'increase';
              const fontWeight = isBold ? 'bold' : 'normal';

              return (
                <td key={col.key || cIdx} style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontSize: '12px', color: textColor, fontWeight }}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const InspectionDetailItem: React.FC<{ number?: number; text: string; formattingConfig: any; variant?: 'detail' }> = ({
  number,
  text,
  formattingConfig,
  variant,
}) => {
  if (variant === 'detail') {
    return (
      <div className="rd-paragraph-text" style={{ marginRight: getIndentation(5, formattingConfig), fontSize: '13px', marginBottom: '4px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {text}
      </div>
    );
  }

  return (
    <div className="rd-paragraph-text" style={{ marginRight: getIndentation(4, formattingConfig), fontSize: '13.5px', lineHeight: '2', display: 'flex', gap: '6px', marginBottom: '4px', textAlign: 'justify' }}>
      {number !== undefined && (
        <span className="rd-numbering" {...nlAttr(`(${toEasternArabicDigits(number)})`)} style={{ fontWeight: 'bold', minWidth: '28px', color: '#0c2340' }}>({toEasternArabicDigits(number)})</span>
      )}
      <span>{text}</span>
    </div>
  );
};

const InspectionDetailsTitle: React.FC<{ number: string; titleText: string; formattingConfig: any }> = ({
  number,
  titleText,
  formattingConfig,
}) => (
  <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
    <div className="rd-subheading-title" style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568', marginBottom: '6px' }}>
      <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>{titleText}</span>
    </div>
  </div>
);

const FindingListTitleFragment: React.FC<{ number?: string; titleText: string; color: string; fontSize?: string; formattingConfig: any }> = ({
  number,
  titleText,
  color,
  fontSize = '13.5px',
  formattingConfig,
}) => (
  <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
    <div className="rd-subheading-title" style={{ fontWeight: 'bold', fontSize, color, marginBottom: '6px' }}>
      {number ? (<><span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>{titleText}</span></>) : (<>{titleText}</>)}
    </div>
  </div>
);

const FindingListItemFragment: React.FC<{ number?: string; text: string; color: string; fontSize?: string; formattingConfig: any }> = ({
  number,
  text,
  color,
  fontSize = '13.5px',
  formattingConfig,
}) => (
  <div className="rd-paragraph-text" style={{ marginRight: getIndentation(5, formattingConfig), fontSize, marginBottom: '4px', color, display: 'flex', alignItems: 'center', gap: '8px' }}>
    {number && <span className="rd-numbering" {...nlAttr(number)}>{number}</span>} <span>{text}</span>
  </div>
);

const ManualFindingListTitleFragment: React.FC<{ number: string; titleText: string; color: string }> = ({
  number,
  titleText,
  color,
}) => (
  <div style={{ marginBottom: '5px' }}>
    <div className="rd-subheading-title" style={{ fontWeight: 'bold', color, marginBottom: '5px' }}>
      <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>{titleText}</span>
    </div>
  </div>
);

const ManualFindingListItemFragment: React.FC<{ number: string; text: string; color: string; formattingConfig: any }> = ({
  number,
  text,
  color,
  formattingConfig,
}) => (
  <div className="rd-paragraph-text" style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', color }}>
    <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>{text}</span>
  </div>
);

const OfficialNotesTitleFragment: React.FC<{ number: string }> = ({ number }) => (
  <div style={{ marginBottom: '0' }}>
    <h3 className="section-num rd-subheading-title"><span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>الملاحظات</span></h3>
  </div>
);

const NotesCategoryTitleFragment: React.FC<{ number: string; titleText: string; formattingConfig: any }> = ({
  number,
  titleText,
  formattingConfig,
}) => (
  <div className="rd-subheading-title" style={{ fontWeight: 'bold', fontSize: '13.5px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>
    <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>{titleText}</span>
  </div>
);

const NoteItemFragment: React.FC<{ number?: string; text: string; isEmpty?: boolean; formattingConfig: any }> = ({
  number,
  text,
  isEmpty,
  formattingConfig,
}) => (
  <div className="rd-paragraph-text" style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', fontSize: '13.5px', textAlign: 'justify', lineHeight: '1.7', color: isEmpty ? '#718096' : undefined }}>
    {number && <span className="rd-numbering" {...nlAttr(number)}>{number} </span>}{text}
  </div>
);

const RecommendationsTitleFragment: React.FC<{ number: string }> = ({ number }) => (
  <div style={{ marginBottom: '0' }}>
    <h3 className="section-num rd-subheading-title"><span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>التوصيات</span></h3>
  </div>
);

const RecommendationAuthorityTitleFragment: React.FC<{ number: string; authority: string; formattingConfig: any }> = ({
  number,
  authority,
  formattingConfig,
}) => (
  <div className="rd-subheading-title" style={{ marginBottom: '8px', marginRight: getIndentation(2, formattingConfig), fontWeight: 'bold', color: '#0c2340' }}>
    <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>{authority}</span>
  </div>
);

const RecommendationItemFragment: React.FC<{ number?: string; recommendation?: any; text?: string; isEmpty?: boolean; isSectionEmpty?: boolean; formattingConfig: any }> = ({
  number,
  recommendation,
  text,
  isEmpty,
  isSectionEmpty,
  formattingConfig,
}) => {
  if (isSectionEmpty) {
    return (
      <div style={{ marginRight: getIndentation(2, formattingConfig), fontSize: '13.5px', color: '#718096' }}>
        {text}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ marginRight: getIndentation(3, formattingConfig), fontSize: '13.5px', color: '#718096', fontStyle: 'italic', marginBottom: '10px' }}>
        {text}
      </div>
    );
  }

  return (
    <div style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '10px' }}>
      <div className="rd-paragraph-text" style={{ marginBottom: '4px', fontSize: '13.5px', fontWeight: '500' }}>
        {number && <span className="rd-numbering" {...nlAttr(number)}>{number}</span>} <span>{recommendation?.text}</span>
      </div>
      {recommendation?.children && recommendation.children.length > 0 && (
        <div style={{ marginRight: getIndentation(4, formattingConfig), display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {recommendation.children.map((child: { id?: string | number; text: string }, childIdx: number) => {
            const childNumber = toEasternArabicDigits(getLevel4Number(childIdx + 1, formattingConfig));

            return (
              <div key={child.id || childIdx} style={{ fontSize: '13px', color: '#4a5568' }}>
                {childNumber && (
                  <>
                    <span
                      className="rd-recommendation-child-numbering"
                      data-numbering-level="4"
                      data-recommendation-child-index={childIdx}
                    >
                      {childNumber}
                    </span>{' '}
                  </>
                )}
                <span>{child.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AppendicesTitleFragment: React.FC<{ number: string }> = ({ number }) => (
  <div style={{ marginBottom: '25px' }}>
    <div style={{ pageBreakBefore: 'always' }}></div>
    <h3 className="section-num rd-subheading-title"><span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>ملاحق التقرير التفتيشي</span></h3>
  </div>
);

const AppendixTitleFragment: React.FC<{ number: string; symbol: string }> = ({ number, symbol }) => (
  <div className="rd-subheading-title" style={{ fontWeight: 'bold', color: '#0c2340', borderBottom: '1px dashed #cbd5e0', paddingBottom: '3px', marginBottom: '8px' }}>
    <span className="rd-numbering" {...nlAttr(number)}>{number}</span> <span>ملحق ({symbol})</span>
  </div>
);

const AppendixParagraphFragment: React.FC<{ text: string }> = ({ text }) => (
  <div className="rd-paragraph-text" style={{ whiteSpace: 'pre-line', fontSize: '13px', marginBottom: '12px' }}>{text}</div>
);

const VerticalSpacer: React.FC<{ heightMm: number }> = ({ heightMm }) => {
  const heightPx = heightMm * 3.7795275591;
  return (
    <div
      className="rd-vertical-spacer"
      style={{
        height: `${heightPx}px`,
        minHeight: '4px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  );
};

export const FragmentRenderer: React.FC<{ fragment: Fragment }> = ({ fragment }) => {
  const { kind, data } = fragment;

  switch (kind) {
    case 'reportHeader':
      return (
        <ReportHeader
          editMode={false}
          startDateText={data.startDateText}
          startDate={data.startDate}
          formationNumber={data.formationNumber}
          onFieldChange={noop}
        />
      );

    case 'reportTitle':
      return <ReportTitle editMode={false} title={data.title} onTitleChange={noop} />;

    case 'assignment':
      return (
        <AssignmentSection
          editMode={false}
          number={data.number}
          assignmentText={data.assignmentText}
          onAssignmentChange={noop}
        />
      );

    case 'committee':
      return (
        <CommitteeSection
          editMode={false}
          number={data.number}
          committeeMembers={data.committeeMembers}
          onMemberChange={noop}
          onAddMember={noop}
          onRemoveMember={noop}
        />
      );

    case 'purpose':
      return (
        <PurposeSection
          editMode={false}
          number={data.number}
          purposeText={data.purposeText}
          onPurposeChange={noop}
        />
      );

    case 'visitDate':
      return (
        <VisitDateSection
          editMode={false}
          number={data.number}
          durationText={data.durationText}
          onDurationChange={noop}
        />
      );

    case 'summaryTables':
      return (
        <SummaryTablesSection
          editMode={false}
          number={data.number}
          positions={data.positions}
          onPositionFieldChange={noop}
          onAddRow={noop}
          onRemoveRow={noop}
        />
      );

    case 'summaryTableTitle':
      return <SummaryTableTitle number={data.number} />;

    case 'summaryTableHeader':
      return <SummaryTableHeader />;

    case 'summaryTableRow':
      return <SummaryTableRow position={data.position} index={data.index} isEmpty={data.isEmpty} />;

    case 'officialNotes':
      return (
        <OfficialNotesSection
          editMode={false}
          number={data.number}
          section={data.section}
          canEditItems={false}
          formattingConfig={data.formattingConfig}
          onChangeItem={noop}
          onMoveUp={noop}
          onMoveDown={noop}
          onRemove={noop}
          onAdd={noop}
        />
      );

    case 'recommendations':
      return (
        <RecommendationsSection
          editMode={false}
          number={data.number}
          recommendations={data.recommendations}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'appendices':
      return (
        <AppendicesSection
          editMode={false}
          number={data.number}
          appendices={data.appendices}
          formattingConfig={data.formattingConfig}
          onAppendixFieldChange={noop}
          onAddAppendix={noop}
          onRemoveAppendix={noop}
          onMoveAppendixUp={noop}
          onMoveAppendixDown={noop}
        />
      );

    case 'appendicesTitle':
      return <AppendicesTitleFragment number={data.number} />;

    case 'appendixTitle':
      return <AppendixTitleFragment number={data.number} symbol={data.symbol} />;

    case 'appendixParagraph':
      return <AppendixParagraphFragment text={data.text} />;

    case 'finalEvaluation':
      return (
        <FinalEvaluationSection
          number={data.number}
          finalEvaluation={data.finalEvaluation}
          formattingConfig={data.formattingConfig}
        />
      );

      case 'sectionTitle':
      return (
        <div style={{ marginTop: '25px' }}>
          <div className="rd-subheading-title" style={{ fontWeight: 'bold', fontSize: '15px', color: '#0c2340', borderBottom: '1.5px solid #0c2340', paddingBottom: '3px', marginBottom: '10px' }}>
            <span className="rd-numbering" {...nlAttr(data.number)}>{data.number}</span> <span>{data.title}</span>
          </div>
        </div>
      );

      case 'subsectionTitle':
      return (
        <div style={{ marginTop: '18px' }}>
          <div className="rd-subheading-title" style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#1a202c', marginBottom: '10px', paddingRight: '8px' }}>
            <span className="rd-numbering" {...nlAttr(data.number)}>{data.number}</span> <span>{data.title}</span>
          </div>
        </div>
      );

    case 'narrative':
      return <NarrativeText text={data.text} variant={data.variant} formattingConfig={data.formattingConfig} />;

    case 'inspectionDetailItem':
      return (
        <InspectionDetailItem
          number={data.number}
          text={data.text}
          formattingConfig={data.formattingConfig}
          variant={data.variant}
        />
      );

    case 'inspectionDetailsTitle':
      return (
        <InspectionDetailsTitle
          number={data.number}
          titleText={data.titleText}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'detailedTables':
      return (
        <DetailedTablesView
          tables={data.tables}
          editMode={false}
          formattingConfig={data.formattingConfig}
          onAddRow={noop}
          onCellChange={noop}
          onRemoveRow={noop}
        />
      );

    case 'detailedTableTitle':
      return <DetailedTableTitle table={data.table} formattingConfig={data.formattingConfig} />;

    case 'detailedTableHeader':
      return <DetailedTableHeader table={data.table} formattingConfig={data.formattingConfig} />;

    case 'detailedTableRow':
      return (
        <DetailedTableRow
          table={data.table}
          row={data.row}
          isEmpty={data.isEmpty}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'findingList':
      return (
        <FindingList
          number={data.number}
          titleText={data.titleText}
          color={data.color}
          items={data.items}
          editMode={false}
          formattingConfig={data.formattingConfig}
          addLabel=""
          onChangeItem={noop}
          onMoveUp={noop}
          onMoveDown={noop}
          onRemove={noop}
          onAdd={noop}
          fontSize={data.fontSize}
          inputFontSize={data.inputFontSize}
        />
      );

    case 'findingListTitle':
      return (
        <FindingListTitleFragment
          number={data.number}
          titleText={data.titleText}
          color={data.color}
          fontSize={data.fontSize}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'findingListItem':
      return (
        <FindingListItemFragment
          number={data.number}
          text={data.text}
          color={data.color}
          fontSize={data.fontSize}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'manualFindingList':
      return (
        <ManualFindingList
          number={data.number}
          titleText={data.titleText}
          color={data.color}
          items={data.items}
          editMode={false}
          formattingConfig={data.formattingConfig}
          addLabel=""
          onChangeItem={noop}
          onMoveUp={noop}
          onMoveDown={noop}
          onRemove={noop}
          onAdd={noop}
        />
      );

    case 'manualFindingListTitle':
      return (
        <ManualFindingListTitleFragment
          number={data.number}
          titleText={data.titleText}
          color={data.color}
        />
      );

    case 'manualFindingListItem':
      return (
        <ManualFindingListItemFragment
          number={data.number}
          text={data.text}
          color={data.color}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'officialNotesTitle':
      return <OfficialNotesTitleFragment number={data.number} />;

    case 'notesCategoryTitle':
      return (
        <NotesCategoryTitleFragment
          number={data.number}
          titleText={data.titleText}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'noteItem':
      return (
        <NoteItemFragment
          number={data.number}
          text={data.text}
          isEmpty={data.isEmpty}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'recommendationsTitle':
      return <RecommendationsTitleFragment number={data.number} />;

    case 'recommendationAuthorityTitle':
      return (
        <RecommendationAuthorityTitleFragment
          number={data.number}
          authority={data.authority}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'recommendationItem':
      return (
        <RecommendationItemFragment
          number={data.number}
          recommendation={data.recommendation}
          text={data.text}
          isEmpty={data.isEmpty}
          isSectionEmpty={data.isSectionEmpty}
          formattingConfig={data.formattingConfig}
        />
      );

    case 'signatures':
      return <SignaturesBlock signatures={data.signatures} editMode={false} onSignatureFieldChange={noop} />;

    case 'vertical_spacer':
      return <VerticalSpacer heightMm={data.heightMm ?? 10} />;

    default:
      // fallback: لا يُسقَط أي عنصر — يُعرض كصندوق واضح بارتفاع مقاس فعلي.
      return (
        <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px', color: '#64748b', fontSize: '13px', backgroundColor: '#f8fafc' }}>
          عنصر غير مدعوم بعد: {String(kind)}
        </div>
      );
  }
};
