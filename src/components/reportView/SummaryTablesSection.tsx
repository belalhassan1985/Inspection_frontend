import React from 'react';
import { formatArabicTableValue } from '../../utils/reportNumbering';

/**
 * SummaryTablesSection — مكوّن عرض مشترك (Single Source of Truth) لقسم
 * "جدول المدراء والآمرين وشاغلي المناصب الأساسية".
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد).
 * الترقيم: `number` (getLevel1Number(5)) يُمرَّر محسوباً مسبقاً؛ المكوّن لا يزيد أي عدّاد.
 *
 * أنماط: يحتفظ بـ className="section-num"/"section-body"/"military-table" مع أنماط سطرية مطابقة
 * (هامش الجدول 15px 0 25px 0 من تعريف .military-table) لتظهر صحيحة في /designer أيضاً.
 */
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

export type SummaryTablesSectionProps = {
  editMode: boolean;
  number: string;
  positions: any[];
  onPositionFieldChange: (index: number, field: string, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
};

export const SummaryTablesSection: React.FC<SummaryTablesSectionProps> = ({
  editMode,
  number,
  positions,
  onPositionFieldChange,
  onAddRow,
  onRemoveRow,
}) => {
  return (
    <div style={{ marginBottom: '25px' }}>
      <h3 className="section-num" style={SECTION_NUM_STYLE}>{number} جدول المدراء والآمرين وشاغلي المناصب الأساسية</h3>
      <div className="section-body" style={SECTION_BODY_STYLE}>
        <table className="military-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #000', margin: '15px 0 25px 0' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '5%', fontWeight: 'bold' }}>ت</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '22%', fontWeight: 'bold' }}>المنصب</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>الرتبة</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '17%', fontWeight: 'bold' }}>الاسم الكامل</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>الرقم الإحصائي</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '16%', fontWeight: 'bold' }}>تاريخ إشغال المنصب</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>نوع الإشغال</th>
              <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>التحصيل الدراسي</th>
              {editMode && <th className="no-print" style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', width: '5%', fontWeight: 'bold' }}>إجراء</th>}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos: any, index: number) => (
              <tr key={pos.id}>
                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{editMode ? index + 1 : formatArabicTableValue(index + 1)}</td>
                {editMode ? (
                  <>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <input
                        type="text"
                        value={pos.positionName}
                        onChange={(e) => onPositionFieldChange(index, 'positionName', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', fontWeight: 'bold' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <input
                        type="text"
                        value={pos.rank || ''}
                        onChange={(e) => onPositionFieldChange(index, 'rank', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <input
                        type="text"
                        value={pos.positionHolder || ''}
                        onChange={(e) => onPositionFieldChange(index, 'positionHolder', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <input
                        type="text"
                        value={pos.statisticalNumber || ''}
                        onChange={(e) => onPositionFieldChange(index, 'statisticalNumber', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <input
                        type="text"
                        value={pos.joinedDate || ''}
                        onChange={(e) => onPositionFieldChange(index, 'joinedDate', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <select
                        value={pos.positionStatus || 'اصالة'}
                        onChange={(e) => onPositionFieldChange(index, 'positionStatus', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center', backgroundColor: 'transparent' }}
                      >
                        <option value="اصالة">أصالة</option>
                        <option value="وكالة">وكالة</option>
                        <option value="تكليف">تكليف</option>
                      </select>
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000' }}>
                      <input
                        type="text"
                        value={pos.education || ''}
                        onChange={(e) => onPositionFieldChange(index, 'education', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '4px', fontFamily: 'inherit', textAlign: 'center' }}
                      />
                    </td>
                    <td className="no-print" style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onRemoveRow(index)}
                        style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}
                      >
                        حذف
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: 'bold' }}>{pos.positionName}</td>
                    <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.rank || '—'}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{pos.positionHolder || '—'}</td>
                    <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.statisticalNumber ? formatArabicTableValue(pos.statisticalNumber) : '—'}</td>
                    <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>
                      {(() => {
                        if (!pos.joinedDate) return '—';
                        const d = new Date(pos.joinedDate);
                        if (isNaN(d.getTime())) return pos.joinedDate;
                        return d.toLocaleDateString('ar-EG');
                      })()}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.positionStatus || '—'}</td>
                    <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>{pos.education || '—'}</td>
                  </>
                )}
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={editMode ? 9 : 8} style={{ padding: '10px', textAlign: 'center', color: '#718096' }}>
                  لا توجد مناصب مسجلة في الهيكل الإداري حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {editMode && (
          <div className="no-print" style={{ marginTop: '10px' }}>
            <button
              type="button"
              onClick={onAddRow}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              ➕ إضافة منصب جديد للجدول
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
