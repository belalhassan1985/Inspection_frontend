import React from 'react';

/**
 * SubsectionTitle — مكوّن عرض مشترك (Single Source of Truth) لعنوان القسم الفرعي (قراءة فقط).
 *
 * مُستخرَج حرفياً من Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup ونفس الأنماط بالضبط.
 *
 * الحفاظ على الترقيم:
 *   - `number` يُمرَّر **محسوباً مسبقاً** من Reports.tsx كاملاً بصيغة
 *     `sub.numbering || getLevel3Ordinal(subIdx + 1, ...)`. getLevel3Ordinal دالة خالصة تعتمد
 *     على subIdx (لا أثر جانبي)، والمكوّن لا يزيد أي عدّاد داخلياً.
 *
 * لاحقاً في الـ Paginator: شظية العنوان تُوسَم keepWithNext (تُجرّ مع أول شظية بعدها فلا تبقى يتيمة).
 */
export type SubsectionTitleProps = {
  number: string;
  title: string;
};

export const SubsectionTitle: React.FC<SubsectionTitleProps> = ({ number, title }) => {
  return (
    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1a202c', marginBottom: '10px', paddingRight: '8px' }}>
      {number} {title}
    </div>
  );
};
