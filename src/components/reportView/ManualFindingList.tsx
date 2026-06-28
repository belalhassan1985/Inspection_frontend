import React from 'react';
import { getIndentation, getLevel3Ordinal } from '../../utils/reportNumbering';

/**
 * ManualFindingList — مكوّن عرض مشترك (Single Source of Truth) لقوائم القسم اليدوي (manualSec.*).
 *
 * الخطوة 4ج: مكوّن شقيق مستقل عن FindingList (الخاص بـ sec/sub)، لأن بنية القسم اليدوي
 * مختلفة جوهرياً: ترقيم بـ getLevel2ArabicLetter للعناوين و getLevel3Ordinal للبنود،
 * غلاف وإزاحات مختلفة، وعرض رقم البند بجانب الحقل في وضع التحرير.
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 *
 * الحفاظ على الترقيم (حرج):
 *   - رقم العنوان `number` يُمرَّر **محسوباً مسبقاً** من Reports.tsx، حيث يبقى العدّاد المتغيّر
 *     `getLevel2ArabicLetter(level2Idx++, ...)` في مكانه المنطقي وداخل نفس شرط الإظهار،
 *     فلا يتغيّر ترتيب الترقيم ولا توقيت زيادة العدّاد.
 *   - المكوّن **لا يزيد أي عدّاد داخلياً**. ترقيم البنود يستخدم getLevel3Ordinal(idx+1) وهي
 *     دالة خالصة تعتمد على idx فقط (لا أثر جانبي)، وتُعرض في وضعَي التحرير والقراءة.
 *
 * لاحقاً في الـ Paginator: عنوان القائمة + أول بند = keepWithNext، وكل بند شظية atomic مستقلة.
 */
export type ManualFindingListProps = {
  number: string;
  titleText: string;
  color: string;
  items: string[];
  editMode: boolean;
  formattingConfig: any;
  addLabel: string;
  onChangeItem: (idx: number, value: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
};

export const ManualFindingList: React.FC<ManualFindingListProps> = ({
  number,
  titleText,
  color,
  items,
  editMode,
  formattingConfig,
  addLabel,
  onChangeItem,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAdd,
}) => {
  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ fontWeight: 'bold', color: color, marginBottom: '5px' }}>
        {number} {titleText}
      </div>
      {items?.map((text: string, idx: number) => (
        <div key={idx} style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '6px', color: color }}>
          {editMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>{getLevel3Ordinal(idx + 1, formattingConfig)}</span>
              <input
                type="text"
                value={text}
                onChange={(e) => onChangeItem(idx, e.target.value)}
                style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '3px', fontSize: '13.5px', color: color, fontFamily: 'inherit' }}
              />
              <button
                type="button"
                onClick={() => onMoveUp(idx)}
                disabled={idx === 0}
                className="no-print"
                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                title="نقل للأعلى"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(idx)}
                disabled={idx === (items || []).length - 1}
                className="no-print"
                style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', marginLeft: '4px' }}
                title="نقل للأسفل"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="no-print"
                style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
              >
                حذف
              </button>
            </div>
          ) : (
            <>
              {getLevel3Ordinal(idx + 1, formattingConfig)} {text}
            </>
          )}
        </div>
      ))}
      {editMode && (
        <button
          type="button"
          onClick={onAdd}
          className="btn-outline no-print"
          style={{ marginRight: getIndentation(3, formattingConfig), padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
};
