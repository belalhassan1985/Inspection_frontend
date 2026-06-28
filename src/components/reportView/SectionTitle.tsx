import React from 'react';

/**
 * SectionTitle — مكوّن عرض مشترك (Single Source of Truth) لعنوان القسم الرئيسي (قراءة فقط).
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 *
 * الحفاظ على الترقيم (حرج):
 *   - `number` يُمرَّر **محسوباً مسبقاً** من Reports.tsx كاملاً بصيغة
 *     `sec.numbering || getLevel2ArabicLetter(level2Idx++, ...)`، فيبقى العدّاد المتغيّر
 *     `level2Idx` وقصر الدائرة (||) في مكانهما المنطقي. المكوّن لا يزيد أي عدّاد داخلياً.
 *
 * لاحقاً في الـ Paginator: شظية العنوان تُوسَم keepWithNext (تُجرّ مع أول شظية بعدها فلا تبقى يتيمة).
 */
export type SectionTitleProps = {
  number: string;
  title: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({ number, title }) => {
  return (
    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0c2340', borderBottom: '1.5px solid #0c2340', paddingBottom: '3px', marginBottom: '10px' }}>
      {number} {title}
    </div>
  );
};
