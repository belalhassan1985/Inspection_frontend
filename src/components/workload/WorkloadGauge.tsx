import React from 'react';

const LEVEL_CONFIG: Record<string, { color: string; label: string }> = {
  FREE: { color: '#10b981', label: 'متفرغ' },
  LIGHT: { color: '#3b82f6', label: 'خفيف' },
  NORMAL: { color: '#f59e0b', label: 'عادي' },
  HEAVY: { color: '#f97316', label: 'ثقيل' },
  OVERLOADED: { color: '#ef4444', label: 'محمل فوق الطاقة' },
};

interface WorkloadGaugeProps {
  score: number;
  level: string;
  size?: number;
}

export const WorkloadGauge: React.FC<WorkloadGaugeProps> = ({ score, level, size = 80 }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.NORMAL;
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={cfg.color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: cfg.color }}>{score}</div>
      </div>
    </div>
  );
};

export { LEVEL_CONFIG };
