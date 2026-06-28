import React from 'react';

/**
 * PurposeSection — مكوّن عرض مشترك (Single Source of Truth) لقسم "الغاية".
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد).
 * الترقيم: `number` (getLevel1Number(3)) يُمرَّر محسوباً مسبقاً؛ المكوّن لا يزيد أي عدّاد.
 * يحتفظ بـ className="section-num"/"section-body" مع أنماط سطرية مطابقة (لتظهر صحيحة في /designer).
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

export type PurposeSectionProps = {
  editMode: boolean;
  number: string;
  purposeText: string;
  onPurposeChange: (value: string) => void;
};

export const PurposeSection: React.FC<PurposeSectionProps> = ({
  editMode,
  number,
  purposeText,
  onPurposeChange,
}) => {
  return (
    <div style={{ marginBottom: '25px' }}>
      <h3 className="section-num" style={SECTION_NUM_STYLE}>{number} الغــــاية</h3>
      <div className="section-body" style={SECTION_BODY_STYLE}>
        {editMode ? (
          <textarea
            value={purposeText}
            onChange={(e) => onPurposeChange(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              border: '1px dashed #cbd5e0',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        ) : (
          purposeText
        )}
      </div>
    </div>
  );
};
