import React from 'react';

/**
 * VisitDateSection — مكوّن عرض مشترك (Single Source of Truth) لقسم "تاريخ التفتيش".
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد).
 * الترقيم: `number` (getLevel1Number(4)) يُمرَّر محسوباً مسبقاً؛ المكوّن لا يزيد أي عدّاد.
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

export type VisitDateSectionProps = {
  editMode: boolean;
  number: string;
  durationText: string;
  onDurationChange: (value: string) => void;
};

export const VisitDateSection: React.FC<VisitDateSectionProps> = ({
  editMode,
  number,
  durationText,
  onDurationChange,
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 className="section-num" style={SECTION_NUM_STYLE}>{number} تاريخ التفتيش</h3>
      <div className="section-body" style={SECTION_BODY_STYLE}>
        {editMode ? (
          <input
            type="text"
            value={durationText}
            onChange={(e) => onDurationChange(e.target.value)}
            style={{
              width: '100%',
              border: '1px dashed #cbd5e0',
              borderRadius: '4px',
              padding: '5px',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        ) : (
          durationText
        )}
      </div>
    </div>
  );
};
