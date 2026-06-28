import React from 'react';
import {
  getIndentation,
  getLevel1Number,
  getLevel2ArabicLetter,
  getLevel3Ordinal,
  type ReportFormattingConfig,
} from '../../utils/reportNumbering';

type OfficialNotesListType = 'positives' | 'negatives' | 'impediments' | 'obstacles';

export type OfficialNotesSectionProps = {
  editMode: boolean;
  number?: string;
  section: any;
  canEditItems?: boolean;
  formattingConfig: ReportFormattingConfig;
  onChangeItem: (listType: OfficialNotesListType, idx: number, value: string) => void;
  onMoveUp: (listType: OfficialNotesListType, idx: number) => void;
  onMoveDown: (listType: OfficialNotesListType, idx: number) => void;
  onRemove: (listType: OfficialNotesListType, idx: number) => void;
  onAdd: (listType: OfficialNotesListType) => void;
};

export const OfficialNotesSection: React.FC<OfficialNotesSectionProps> = ({
  editMode,
  number,
  section,
  canEditItems = true,
  formattingConfig,
  onChangeItem,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAdd,
}) => {
  const renderItems = (items: string[] = [], listType: OfficialNotesListType) => {
    if (editMode && canEditItems) {
      return (
        <div style={{ marginRight: getIndentation(3, formattingConfig), marginTop: '6px' }}>
          {items.map((text: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ minWidth: '52px', fontWeight: 'bold', color: '#0c2340' }}>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
              <input
                type="text"
                value={text}
                onChange={(e) => onChangeItem(listType, idx, e.target.value)}
                style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '4px 6px', fontSize: '13px', fontFamily: 'inherit' }}
              />
              <button
                type="button"
                onClick={() => onMoveUp(listType, idx)}
                disabled={idx === 0}
                className="no-print"
                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                title="نقل للأعلى"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(listType, idx)}
                disabled={idx === items.length - 1}
                className="no-print"
                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                title="نقل للأسفل"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onRemove(listType, idx)}
                className="no-print"
                style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
              >
                حذف
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAdd(listType)}
            className="btn-outline no-print"
            style={{ padding: '4px 10px', fontSize: '12px', marginTop: '4px' }}
          >
            إضافة بند
          </button>
        </div>
      );
    }

    return items.length > 0 ? (
      items.map((text: string, idx: number) => (
        <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', fontSize: '13.5px', textAlign: 'justify' }}>
          {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
        </div>
      ))
    ) : (
      <div style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', fontSize: '13.5px', color: '#718096' }}>
        لا توجد ملاحظات ضمن هذا التصنيف.
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '25px' }}>
      <h3 className="section-num">{number || getLevel1Number(7, formattingConfig)} الملاحظات</h3>
      <div className="section-body">
        <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(1, formattingConfig)} الإيجابيات</div>
        {renderItems(section?.positivesList || [], 'positives')}
        <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(2, formattingConfig)} السلبيات</div>
        {renderItems(section?.negativesList || [], 'negatives')}
        <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(3, formattingConfig)} المعوقات</div>
        {renderItems(section?.impedimentsList || [], 'impediments')}
        <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginRight: getIndentation(2, formattingConfig), marginTop: '12px' }}>{getLevel2ArabicLetter(4, formattingConfig)} المعاضل</div>
        {renderItems(section?.obstaclesList || [], 'obstacles')}
      </div>
    </div>
  );
};
