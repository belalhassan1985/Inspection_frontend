import React from 'react';
import { getIndentation, getLevel5ArabicLetter } from '../../utils/reportNumbering';

/**
 * FindingList — مكوّن عرض مشترك (Single Source of Truth) لقوائم النتائج داخل القسم الرئيسي.
 *
 * الخطوة 4أ: يغطّي قوائم القسم الرئيسي فقط (sec.positivesList / negativesList /
 * impedimentsList / obstaclesList). لا يشمل قوائم الأقسام الفرعية (sub.*) ولا اليدوية
 * (manualSec.*) ولا مساعد الملاحظات الرسمية — ستُعالَج في خطوات لاحقة.
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 *
 * الحفاظ على الترقيم (حرج):
 *   - رقم العنوان `number` يُمرَّر **محسوباً مسبقاً** من Reports.tsx، حيث يبقى العدّاد
 *     المتغيّر `getLevel4Number(manualLevel4Idx++, ...)` في مكانه المنطقي وداخل نفس الشرط
 *     `(sec.showX || editMode)`، فلا يتغيّر ترتيب الترقيم ولا توقيت زيادة العدّاد.
 *   - المكوّن **لا يزيد أي عدّاد داخلياً**. ترقيم البنود يستخدم `getLevel5ArabicLetter(idx+1)`
 *     وهي دالة خالصة تعتمد على idx فقط (لا أثر جانبي).
 *
 * لاحقاً في الـ Paginator: عنوان القائمة + أول بند = keepWithNext، وكل بند شظية atomic مستقلة.
 */
export type FindingListProps = {
  /** رقم العنوان محسوباً مسبقاً من Reports.tsx. اختياري: بعض القوائم (مثل معاضل الفرعي) بلا رقم. */
  number?: string;
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
  /** حجم خط العنوان والبنود (قسم رئيسي = 13.5px؛ قسم فرعي = 13px). */
  fontSize?: string;
  /** حجم خط حقل التحرير (قسم رئيسي = 13px؛ قسم فرعي = 12.5px). */
  inputFontSize?: string;
};

export const FindingList: React.FC<FindingListProps> = ({
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
  fontSize = '13.5px',
  inputFontSize = '13px',
}) => {
  return (
    <div style={{ marginTop: '8px', marginRight: getIndentation(4, formattingConfig) }}>
      <div style={{ fontWeight: 'bold', fontSize: fontSize, color: color, marginBottom: '6px' }}>
        {number ? (<>{number} {titleText}</>) : (<>{titleText}</>)}
      </div>
      {(items || []).map((text: string, idx: number) => (
        <div key={idx} style={{ marginRight: getIndentation(5, formattingConfig), fontSize: fontSize, marginBottom: '4px', color: color, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editMode ? (
            <>
              <input
                type="text"
                value={text}
                onChange={(e) => onChangeItem(idx, e.target.value)}
                style={{ flex: 1, border: '1px dashed #cbd5e0', padding: '2px 4px', fontSize: inputFontSize, fontFamily: 'inherit', color: color }}
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
                style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
              >
                حذف
              </button>
            </>
          ) : (
            <>
              {getLevel5ArabicLetter(idx + 1, formattingConfig)} {text}
            </>
          )}
        </div>
      ))}
      {editMode && (
        <button
          type="button"
          onClick={onAdd}
          className="btn-outline no-print"
          style={{ marginRight: getIndentation(5, formattingConfig), padding: '3px 6px', fontSize: '11px', marginTop: '4px' }}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
};
