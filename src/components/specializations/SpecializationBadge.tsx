import React from 'react';

interface SpecializationBadgeProps {
  name: string;
  proficiencyLevel?: string;
  isPrimary?: boolean;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const PROFICIENCY_COLORS: Record<string, string> = {
  BASIC: '#6b7280',
  PRACTITIONER: '#3b82f6',
  ADVANCED: '#8b5cf6',
  EXPERT: '#d4af37',
};

const PROFICIENCY_LABELS: Record<string, string> = {
  BASIC: 'أساسي',
  PRACTITIONER: 'ممارس',
  ADVANCED: 'متقدم',
  EXPERT: 'خبير',
};

export const SpecializationBadge: React.FC<SpecializationBadgeProps> = ({
  name,
  proficiencyLevel,
  isPrimary,
  onRemove,
  size = 'md',
}) => {
  const padding = size === 'sm' ? '4px 10px' : '6px 14px';
  const fontSize = size === 'sm' ? '10px' : '12px';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding,
        borderRadius: '8px',
        backgroundColor: isPrimary ? 'rgba(212,175,55,0.12)' : '#f1f5f9',
        border: isPrimary ? '1.5px solid var(--secondary-color)' : '1px solid transparent',
        fontSize,
        fontWeight: 500,
        color: isPrimary ? 'var(--primary-color)' : 'var(--text-primary)',
      }}
    >
      <span>{name}</span>
      {proficiencyLevel && (
        <span
          style={{
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: PROFICIENCY_COLORS[proficiencyLevel] || '#6b7280',
          }}
        >
          {PROFICIENCY_LABELS[proficiencyLevel] || proficiencyLevel}
        </span>
      )}
      {isPrimary && (
        <span style={{ fontSize: '10px' }} title="التخصص الأساسي">⭐</span>
      )}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: '14px',
            lineHeight: 1,
            color: '#94a3b8',
          }}
          title="إزالة"
        >
          ×
        </button>
      )}
    </div>
  );
};
