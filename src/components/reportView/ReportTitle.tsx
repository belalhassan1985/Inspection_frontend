import React from 'react';

/**
 * ReportTitle — مكوّن عرض مشترك (Single Source of Truth) لعنوان التقرير الرسمي.
 *
 * مُستخرَج حرفياً من القالب التعليمي في Reports.tsx (تعديل سلوكي-محايد).
 */
export type ReportTitleProps = {
  editMode: boolean;
  title: string;
  onTitleChange: (value: string) => void;
};

export const ReportTitle: React.FC<ReportTitleProps> = ({ editMode, title, onTitleChange }) => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '35px' }}>
      {editMode ? (
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            width: '100%',
            textAlign: 'center',
            border: '1px dashed #cbd5e0',
            borderRadius: '4px',
            padding: '5px',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0', textDecoration: 'underline', textUnderlineOffset: '8px' }}>
          {title}
        </h1>
      )}
    </div>
  );
};
