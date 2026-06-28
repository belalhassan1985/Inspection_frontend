import React from 'react';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ON_DUTY: { color: '#10b981', label: 'في الخدمة' },
  OFF_DUTY: { color: '#9ca3af', label: 'خارج الخدمة' },
  LEAVE: { color: '#f59e0b', label: 'إجازة' },
  MISSION: { color: '#3b82f6', label: 'مأمورية' },
  SICK: { color: '#ef4444', label: 'مرضي' },
};

interface DutyStatusBadgeProps {
  status: string;
}

export const DutyStatusBadge: React.FC<DutyStatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OFF_DUTY;
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
