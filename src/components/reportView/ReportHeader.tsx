import React from 'react';
import ministryLogo from '../../assets/images/ministry-logo.png';

/**
 * ReportHeader — مكوّن عرض مشترك (Single Source of Truth) لرأس التقرير الرسمي.
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد): نفس الـ markup
 * ونفس الأنماط بالضبط. منطق التحرير يبقى مملوكاً لـ Reports.tsx عبر props؛ المصمّم يستهلكه
 * قراءة فقط (editMode=false، callback فارغة).
 */
export type ReportHeaderProps = {
  editMode: boolean;
  startDateText?: string;
  startDate?: string;
  formationNumber?: string;
  onFieldChange: (field: string, value: any) => void;
};

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  editMode,
  startDateText,
  startDate,
  formationNumber,
  onFieldChange,
}) => {
  const dateDisplay = startDateText ?? (startDate ? new Date(startDate).toLocaleDateString('ar-EG') : '');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
      <div style={{ width: '220px', fontSize: '13px' }}>
        <strong>جمهورية العراق</strong><br />
        <strong>وزارة الداخلية</strong><br />
        <strong>هيئة تفتيش قوى الامن الداخلي</strong>
      </div>
      <div style={{ textAlign: 'center' }}>
        <img src={ministryLogo} alt="وزارة الداخلية" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
      </div>
      <div style={{ width: '220px', fontSize: '13px', textAlign: 'left', direction: 'rtl' }}>
        {editMode ? (
          <>
            <div style={{ marginBottom: '5px' }}>
              <strong>التاريخ:</strong>{' '}
              <input
                type="text"
                value={dateDisplay}
                onChange={(e) => onFieldChange('startDateText', e.target.value)}
                style={{ border: '1px dashed #cbd5e0', padding: '2px', width: '130px', fontSize: '12px', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <strong>العدد:</strong>{' '}
              <input
                type="text"
                value={formationNumber ?? ''}
                onChange={(e) => onFieldChange('formationNumber', e.target.value)}
                style={{ border: '1px dashed #cbd5e0', padding: '2px', width: '130px', fontSize: '12px', fontFamily: 'inherit' }}
              />
            </div>
          </>
        ) : (
          <>
            <div><strong>التاريخ:</strong> {dateDisplay}</div>
            <div><strong>العدد:</strong> {formationNumber || '—'}</div>
          </>
        )}
      </div>
    </div>
  );
};
