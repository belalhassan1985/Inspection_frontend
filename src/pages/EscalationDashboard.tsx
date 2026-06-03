import React from 'react';

export const EscalationDashboard: React.FC = () => {
  return (
    <div style={{
      padding: '30px',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl',
      textAlign: 'right',
    }}>
      <h1 style={{ color: '#0c2340', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        🚨 لوحة متابعة التصعيد الإداري
      </h1>
      <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
        مراقبة التوصيات المتأخرة ومستويات التصعيد التلقائي
      </p>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '40px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚙️</div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a5568', marginBottom: '10px' }}>
          قيد التطوير والتهيئة الفنية
        </h2>
        <p style={{ color: '#a0aec0', fontSize: '13px' }}>
          سيتم فرز التوصيات حسب مستويات التصعيد (Level 1, 2, 3) وتحليل مسبباتها وتحديد الجهات الأكثر تلكؤاً في هذه الشاشة.
        </p>
      </div>
    </div>
  );
};
