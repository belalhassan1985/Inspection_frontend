import React from 'react';

/**
 * AssignmentSection — مكوّن عرض مشترك (Single Source of Truth) لقسم "التكليف".
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد).
 *
 * الترقيم: `number` (getLevel1Number(1)) يُمرَّر محسوباً مسبقاً من Reports.tsx؛ المكوّن لا يحسب
 * ولا يزيد أي عدّاد.
 *
 * ملاحظة الأنماط: يحتفظ بـ className="section-num"/"section-body" (لتوافق قواعد الطباعة في
 * /reports) ويضيف أنماطاً سطرية مطابقة لتعريف هذين الصنفين، حتى يظهر بشكله الصحيح أيضاً داخل
 * /reports/designer حيث لا يكون <style> الخاص بـ Reports موجوداً. القيم مطابقة 100% فلا يتغيّر
 * شكل /reports.
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

export type AssignmentSectionProps = {
  editMode: boolean;
  number: string;
  assignmentText: string;
  onAssignmentChange: (value: string) => void;
};

export const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  editMode,
  number,
  assignmentText,
  onAssignmentChange,
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 className="section-num" style={SECTION_NUM_STYLE}>{number} التكلـــــيف</h3>
      <div className="section-body" style={SECTION_BODY_STYLE}>
        {editMode ? (
          <textarea
            value={assignmentText}
            onChange={(e) => onAssignmentChange(e.target.value)}
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
          assignmentText
        )}
      </div>
    </div>
  );
};
