import React from 'react';

interface LeaderInfo {
  entityName: string;
  score: number;
  leaderRank: string;
  leaderName: string;
}

interface PerformanceLeadersProps {
  best: LeaderInfo | null;
  worst: LeaderInfo | null;
}

export const PerformanceLeaders: React.FC<PerformanceLeadersProps> = ({ best, worst }) => {
  if (!best) {
    return (
      <div className="card" style={{ padding: '20px', height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-light)' }}>
        <span style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</span>
        <span>لا توجد تقييمات معتمدة متوفرة لعرض التميز والقصور الرقابي.</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '20px', height: '100%' }}>
      <h3 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)', fontSize: '16px' }}>🏆 التميز والقصور الرقابي (المستوى القيادي)</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        أفضل وأسوأ الجهات أداءً بناءً على درجات آخر تفتيش رسمي معتمد.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Best Performing Entity */}
        <div
          style={{
            borderRight: '5px solid #10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.03)',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            borderRightWidth: '5px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>🌟 أفضل أداء تفتيشي</span>
            <span style={{ backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', fontSize: '14px' }}>
              {best.score}%
            </span>
          </div>
          <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)', fontSize: '15px' }}>{best.entityName}</h4>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            👤 القائد المسؤول: <strong>{best.leaderRank} / {best.leaderName}</strong>
          </div>
        </div>

        {/* Worst Performing Entity */}
        {worst ? (
          <div
            style={{
              borderRight: '5px solid #ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.03)',
              borderRadius: '8px',
              padding: '15px',
              border: '1px solid rgba(239, 68, 68, 0.1)',
              borderRightWidth: '5px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>⚠️ أدنى أداء تفتيشي</span>
              <span style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', fontSize: '14px' }}>
                {worst.score}%
              </span>
            </div>
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)', fontSize: '15px' }}>{worst.entityName}</h4>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              👤 القائد المسؤول: <strong>{worst.leaderRank} / {worst.leaderName}</strong>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '15px',
              border: '1px dashed var(--border-color)',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--text-light)',
            }}
          >
            لا توجد كيانات أخرى كافية للمقارنة وتحديد الجهة الأقل أداءً.
          </div>
        )}
      </div>
    </div>
  );
};
