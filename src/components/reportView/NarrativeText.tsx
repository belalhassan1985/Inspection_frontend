import React from 'react';
import { getIndentation } from '../../utils/reportNumbering';

/**
 * NarrativeText — مكوّن عرض مشترك (Single Source of Truth) لفقرة السرد النصية.
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 * يغطّي صيغتي العرض (القراءة فقط) الموجودتين في التقرير:
 *   - variant="section"     : سرد القسم الرئيسي (يستخدم getIndentation + formattingConfig)
 *   - variant="subsection"  : سرد القسم الفرعي
 *
 * هذا هو *نصّ السرد الحقيقي الذي يراه المستخدم* في مخرجات التقرير، وهو ما سيقيسه
 * الـ Paginator لاحقاً (BlockMeasurer / FragmentRenderer / A4PageCanvas) فيتطابق
 * القياس مع العرض. ملاحظة: حقول التحرير (textarea) تبقى ضمن منطق التحرير في Reports.tsx
 * لأنها ليست جزءاً من تدفّق المستند المطبوع.
 */
export type NarrativeTextProps = {
  text: string;
  variant: 'section' | 'subsection';
  formattingConfig?: any;
};

export const NarrativeText: React.FC<NarrativeTextProps> = ({ text, variant, formattingConfig }) => {
  if (!text) return null;

  if (variant === 'section') {
    return (
      <div style={{ marginRight: getIndentation(3, formattingConfig), marginBottom: '15px', fontSize: '13.5px', whiteSpace: 'pre-line', textAlign: 'justify' }}>
        {text}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '6px', whiteSpace: 'pre-line', color: '#4a5568' }}>{text}</div>
  );
};
