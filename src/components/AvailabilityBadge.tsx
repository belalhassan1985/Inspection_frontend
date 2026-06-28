import React from 'react';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  AVAILABLE: { color: '#10b981', label: 'متوفر' },
  ON_LEAVE: { color: '#f59e0b', label: 'إجازة' },
  ON_MISSION: { color: '#3b82f6', label: 'مأمورية' },
  TRAINING: { color: '#8b5cf6', label: 'دورة تدريبية' },
  MEDICAL: { color: '#ef4444', label: 'إجازة مرضية' },
  UNAVAILABLE: { color: '#6b7280', label: 'غير متوفر' },
};

interface AvailabilityBadgeProps {
  status: string | null | undefined;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ status }) => {
  const key = status || 'AVAILABLE';
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.AVAILABLE;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      backgroundColor: cfg.color + '20',
      color: cfg.color,
      border: '1px solid ' + cfg.color + '40',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};
