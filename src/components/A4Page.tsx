import React from 'react';

interface A4PageProps {
  children: React.ReactNode;
  pageNumber?: number;
  showBorders?: boolean;
  className?: string;
}

/**
 * A4Page Component
 * 
 * مكون لعرض محتوى التقرير في صفحات A4 قياسية مع حدود واضحة
 * - الأبعاد: 210mm × 297mm (A4 Portrait)
 * - الهوامش: 20mm أعلى/أسفل، 15mm يمين/يسار
 * - يعرض حدود الصفحة في المعاينة ويخفيها عند الطباعة
 */
export const A4Page: React.FC<A4PageProps> = ({ 
  children, 
  pageNumber, 
  showBorders = true,
  className = ''
}) => {
  return (
    <div 
      className={`a4-page ${className}`} 
      data-page={pageNumber}
      style={{
        width: '210mm',
        height: '297mm',
        padding: '20mm 15mm',
        margin: '0 auto 20px',
        backgroundColor: '#ffffff',
        boxShadow: showBorders ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
        position: 'relative',
        pageBreakAfter: 'always',
        overflow: 'hidden',
      }}
    >
      <div className="a4-content" style={{ height: '100%' }}>
        {children}
      </div>
      
      {showBorders && pageNumber && (
        <div 
          className="page-number no-print"
          style={{
            position: 'absolute',
            bottom: '8mm',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: '#718096',
            fontFamily: 'Cairo, sans-serif',
          }}
        >
          صفحة {pageNumber}
        </div>
      )}
    </div>
  );
};
