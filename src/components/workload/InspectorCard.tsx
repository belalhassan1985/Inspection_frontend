import React from 'react';
import { WorkloadGauge } from './WorkloadGauge';
import { WorkloadBadge } from './WorkloadBadge';

interface InspectorCardProps {
  fullName: string;
  department: string;
  workloadScore: number;
  workloadLevel: string;
  totalParticipation: number;
  leaderCount: number;
  deputyCount: number;
  memberCount: number;
  inspectionCount: number;
  openRecommendationCount: number;
  onClick?: () => void;
}

export const InspectorCard: React.FC<InspectorCardProps> = ({
  fullName, department, workloadScore, workloadLevel,
  totalParticipation, leaderCount, deputyCount,
  inspectionCount, openRecommendationCount, onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: '18px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        borderRight: '4px solid var(--secondary-color)',
      }}
    >
      <WorkloadGauge score={workloadScore} level={workloadLevel} size={70} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--primary-color)', marginBottom: '4px' }}>
          {fullName}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {department}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <WorkloadBadge level={workloadLevel} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>{totalParticipation} حملات</span>
          {leaderCount > 0 && <span>قائد {leaderCount}</span>}
          {deputyCount > 0 && <span>نائب {deputyCount}</span>}
          <span>{inspectionCount} مفتشيات</span>
          <span>{openRecommendationCount} توصيات</span>
        </div>
      </div>
    </div>
  );
};
