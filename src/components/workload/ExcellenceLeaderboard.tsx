import React from 'react';

interface LeaderboardEntry {
  inspectorId: string;
  fullName: string;
  department: string;
  [key: string]: any;
}

interface ExcellenceLeaderboardProps {
  title: string;
  icon: string;
  data: LeaderboardEntry[];
  valueKey: string;
  valueLabel: string;
  valueColor?: string;
}

export const ExcellenceLeaderboard: React.FC<ExcellenceLeaderboardProps> = ({
  title, icon, data, valueKey, valueLabel, valueColor = 'var(--secondary-color)',
}) => {
  return (
    <div className="card" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)' }}>{title}</h3>
      </div>
      {data.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', fontSize: '12px' }}>
          لا توجد بيانات
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.map((item, idx) => (
            <div
              key={item.inspectorId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: idx === 0 ? 'rgba(212, 175, 55, 0.08)' : idx < 3 ? '#f8fafc' : '#ffffff',
                borderRadius: '6px',
                borderRight: idx === 0 ? '3px solid #d4af37' : idx === 1 ? '3px solid #94a3b8' : idx === 2 ? '3px solid #d97706' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: idx === 0 ? '#d4af37' : idx < 3 ? 'var(--text-secondary)' : 'var(--text-light)',
                  minWidth: '20px',
                }}>
                  {idx + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--primary-color)' }}>{item.fullName}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>{item.department}</div>
                </div>
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: valueColor,
                backgroundColor: valueColor + '15',
                padding: '2px 10px',
                borderRadius: '10px',
              }}>
                {item[valueKey]} {valueLabel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
