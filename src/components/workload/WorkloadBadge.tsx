import React from 'react';
import { LEVEL_CONFIG } from './WorkloadGauge';

interface WorkloadBadgeProps {
  level: string;
}

export const WorkloadBadge: React.FC<WorkloadBadgeProps> = ({ level }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.NORMAL;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      backgroundColor: cfg.color + '20',
      color: cfg.color,
      border: '1px solid ' + cfg.color + '40',
    }}>
      {cfg.label}
    </span>
  );
};
