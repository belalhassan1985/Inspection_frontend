import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  colorType: 'gold' | 'blue' | 'red' | 'orange' | 'green';
  subtitle: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  colorType,
  subtitle,
  onClick,
}) => {
  const colorMap = {
    gold: {
      border: '5px solid #d4af37',
      bg: 'rgba(212, 175, 55, 0.05)',
      text: '#d4af37',
    },
    blue: {
      border: '5px solid #3b82f6',
      bg: 'rgba(59, 130, 246, 0.05)',
      text: '#3b82f6',
    },
    red: {
      border: '5px solid #ef4444',
      bg: 'rgba(239, 68, 68, 0.05)',
      text: '#ef4444',
    },
    orange: {
      border: '5px solid #f59e0b',
      bg: 'rgba(245, 158, 11, 0.05)',
      text: '#f59e0b',
    },
    green: {
      border: '5px solid #10b981',
      bg: 'rgba(16, 185, 129, 0.05)',
      text: '#10b981',
    },
  };

  const currentStyles = colorMap[colorType];

  return (
    <div
      onClick={onClick}
      className="card flex align-center gap-15 hover-card"
      style={{
        borderRight: currentStyles.border,
        backgroundColor: currentStyles.bg,
        cursor: onClick ? 'pointer' : 'default',
        padding: '20px',
        flex: '1 1 200px',
        minWidth: '220px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ fontSize: '36px', opacity: 0.9 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
          {value}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};
