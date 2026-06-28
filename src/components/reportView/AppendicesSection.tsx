import React from 'react';
import {
  getLevel1Number,
  getLevel2ArabicLetter,
  type ReportFormattingConfig,
} from '../../utils/reportNumbering';

export type AppendicesSectionProps = {
  editMode: boolean;
  number?: string;
  appendices: any[];
  formattingConfig: ReportFormattingConfig;
  onAppendixFieldChange: (index: number, field: string, value: any) => void;
  onAddAppendix: () => void;
  onRemoveAppendix: (index: number) => void;
  onMoveAppendixUp: (index: number) => void;
  onMoveAppendixDown: (index: number) => void;
};

export const AppendicesSection: React.FC<AppendicesSectionProps> = ({
  editMode,
  number,
  appendices,
  formattingConfig,
  onAppendixFieldChange,
  onAddAppendix,
  onRemoveAppendix,
  onMoveAppendixUp,
  onMoveAppendixDown,
}) => {
  if (!(appendices?.some((a: any) => a.visible) || editMode)) return null;

  return (
    <div style={{ marginBottom: '25px' }}>
      <div style={{ pageBreakBefore: 'always' }}></div>
      <h3 className="section-num">{number || getLevel1Number(9, formattingConfig)} ملاحق التقرير التفتيشي</h3>
      <div className="section-body">
        {appendices.map((app: any, idx: number) => {
          if (!app.visible && !editMode) return null;
          return (
            <div key={app.id} style={{ marginBottom: '20px', opacity: app.visible ? 1 : 0.5 }}>
              {editMode ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <button type="button" onClick={() => onMoveAppendixUp(idx)} disabled={idx === 0} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬆️</button>
                  <button type="button" onClick={() => onMoveAppendixDown(idx)} disabled={idx === appendices.length - 1} style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}>⬇️</button>
                  <input
                    type="checkbox"
                    checked={!!app.visible}
                    onChange={(e) => onAppendixFieldChange(idx, 'visible', e.target.checked)}
                    title="إظهار/إخفاء الملحق"
                  />
                  <span>رمز الملحق:</span>
                  <input
                    type="text"
                    value={app.symbol}
                    onChange={(e) => onAppendixFieldChange(idx, 'symbol', e.target.value)}
                    style={{ width: '60px', border: '1px dashed #cbd5e0', padding: '3px', textAlign: 'center', fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveAppendix(idx)}
                    className="no-print"
                    style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    حذف الملحق
                  </button>
                </div>
              ) : (
                <div style={{ fontWeight: 'bold', color: '#0c2340', borderBottom: '1px dashed #cbd5e0', paddingBottom: '3px', marginBottom: '8px' }}>
                  {getLevel2ArabicLetter(idx + 1, formattingConfig)} ملحق ({app.symbol})
                </div>
              )}
              <div>
                {editMode ? (
                  <textarea
                    value={app.text}
                    onChange={(e) => onAppendixFieldChange(idx, 'text', e.target.value)}
                    rows={4}
                    style={{ width: '100%', border: '1px dashed #cbd5e0', padding: '8px', fontFamily: 'inherit', fontSize: '13px' }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-line', fontSize: '13px' }}>{app.text}</div>
                )}
              </div>
            </div>
          );
        })}
        {editMode && (
          <div className="no-print" style={{ marginTop: '10px' }}>
            <button
              type="button"
              onClick={onAddAppendix}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              ➕ إضافة ملحق جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
