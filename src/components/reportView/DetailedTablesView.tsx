import React from 'react';
import { getIndentation, formatArabicTableValue } from '../../utils/reportNumbering';

/**
 * DetailedTablesView — مكوّن عرض مشترك (Single Source of Truth) للجداول التفصيلية.
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 * يُستهلك من:
 *   - Reports.tsx (عرض الشاشة + التحرير عبر editMode والـ callbacks)
 *   - مصمّم التقارير لاحقاً (قراءة فقط: editMode=false وcallbacks فارغة)
 *
 * هذا يضمن أن قياس المصمّم يقع على نفس المحتوى الحقيقي الذي يراه المستخدم.
 */
export type DetailedTablesViewProps = {
  tables: any[];
  editMode: boolean;
  formattingConfig: any;
  onAddRow: (tableIdx: number) => void;
  onCellChange: (tableIdx: number, rowIdx: number, colKey: string, value: any) => void;
  onRemoveRow: (tableIdx: number, rowIdx: number) => void;
};

export const DetailedTablesView: React.FC<DetailedTablesViewProps> = ({
  tables,
  editMode,
  formattingConfig,
  onAddRow,
  onCellChange,
  onRemoveRow,
}) => {
  if (!tables || tables.length === 0) return null;

  return (
    <div style={{ marginTop: '15px', marginRight: getIndentation(4, formattingConfig) }}>
      {tables.map((table: any, tIdx: number) => (
        <div key={table.detailId || tIdx} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0c2340', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📊 {table.title}</span>
            <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#718096', marginRight: 'auto' }}>({table.entityName})</span>
            {editMode && (
              <button
                type="button"
                onClick={() => onAddRow(tIdx)}
                className="no-print"
                style={{ backgroundColor: '#edf2f7', color: '#2b6cb0', border: '1px solid #cbd5e0', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
              >
                ➕ إضافة صف
              </button>
            )}
          </div>
          <div className="rd-table-frame" style={{ width: '100%', maxWidth: '100%' }}>
            <table className="military-table" style={{ margin: '15px 0 25px 0', width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  {table.schema.map((col: any, colIdx: number) => (
                    <th key={col.key || colIdx} style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>
                      {col.label}
                    </th>
                  ))}
                  {editMode && <th className="no-print" style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', fontSize: '12px', width: '60px' }}>إجراء</th>}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx}>
                    {table.schema.map((col: any, cIdx: number) => {
                      const cellVal = row[col.key] !== undefined ? row[col.key] : '';
                      const isPercentage = col.role === 'percentage';
                      const formattedVal = isPercentage ? `${cellVal}%` : cellVal;
                      const displayVal = formatArabicTableValue(cellVal, { percentage: isPercentage });

                      let textColor = '#000000';
                      if (col.role === 'deficit' && Number(cellVal) > 0) textColor = '#c53030';
                      if (col.role === 'increase' && Number(cellVal) > 0) textColor = '#2b6cb0';

                      const isBold = col.role === 'label' || col.role === 'percentage' || col.role === 'deficit' || col.role === 'increase';
                      const fontWeight = isBold ? 'bold' : 'normal';

                      return (
                        <td key={col.key || cIdx} style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontSize: '12px', color: textColor, fontWeight: fontWeight }}>
                          {editMode ? (
                            col.role === 'deficit' || col.role === 'increase' || col.role === 'percentage' ? (
                              <span>{formattedVal}</span>
                            ) : (
                              <input
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={cellVal}
                                onChange={(e) => onCellChange(tIdx, rIdx, col.key, e.target.value)}
                                style={{ width: '100%', border: 'none', padding: '2px', textAlign: col.type === 'number' ? 'center' : 'right', fontFamily: 'inherit', fontWeight: fontWeight, color: textColor }}
                              />
                            )
                          ) : (
                            displayVal
                          )}
                        </td>
                      );
                    })}
                    {editMode && (
                      <td className="no-print" style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onRemoveRow(tIdx, rIdx)}
                          style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          حذف
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {table.rows.length === 0 && (
                  <tr>
                    <td colSpan={table.schema.length + (editMode ? 1 : 0)} style={{ padding: '10px', color: '#a0aec0', textAlign: 'center' }}>لا توجد سجلات.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
