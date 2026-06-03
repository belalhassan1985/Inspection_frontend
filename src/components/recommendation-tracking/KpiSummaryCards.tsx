import React from 'react';

interface ApiKpis {
  total?: number;
  open?: number;
  closed?: number;
  verified?: number;
  rejected?: number;
  inProgress?: number;
  completed?: number;
  overdue?: number;
  closureRate?: number;
  completionRate?: number;
  avgTimeToCloseDays?: number;
  byRisk?: {
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
  };
}

export interface ApiStatsSummary {
  kpis?: ApiKpis;
}

interface KpiSummaryCardsProps {
  stats: ApiStatsSummary | null;
  loading: boolean;
  onFilterOverdue: () => void;
  onFilterCritical: () => void;
  onFilterHigh: () => void;
  onFilterOpen: () => void;
  onFilterInProgress: () => void;
  onFilterCompleted: () => void;
  onFilterVerified: () => void;
  onFilterClosed: () => void;
  onFilterRejected: () => void;
}

interface MiniCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  onClick?: () => void;
  badge?: string;
}

const MiniCard: React.FC<MiniCardProps> = ({
  title,
  value,
  icon,
  color,
  bgColor,
  borderColor,
  onClick,
  badge,
}) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: bgColor,
      borderRadius: '12px',
      padding: '18px 20px',
      border: `1px solid ${borderColor}`,
      borderRight: `5px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flex: '1 1 180px',
      minWidth: '170px',
      position: 'relative',
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }
    }}
  >
    <div style={{ fontSize: '32px', lineHeight: 1 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1a202c', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
    {badge && (
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          backgroundColor: color,
          color: '#fff',
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: '999px',
        }}
      >
        {badge}
      </div>
    )}
  </div>
);

const SkeletonCards: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: '1 1 180px',
            minWidth: '170px',
            height: '90px',
            backgroundColor: '#f0f4f8',
            borderRadius: '12px',
            animation: 'kpi-pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i + 4}
          style={{
            flex: '1 1 180px',
            minWidth: '170px',
            height: '90px',
            backgroundColor: '#f0f4f8',
            borderRadius: '12px',
            animation: 'kpi-pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
    <style>{`
      @keyframes kpi-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({
  stats,
  loading,
  onFilterOverdue,
  onFilterCritical,
  onFilterHigh,
  onFilterOpen,
  onFilterInProgress,
  onFilterCompleted,
  onFilterVerified,
  onFilterClosed,
  onFilterRejected,
}) => {
  if (loading) {
    return <SkeletonCards />;
  }

  const kpis = stats?.kpis;

  const total          = kpis?.total          ?? 0;
  const open           = kpis?.open           ?? 0;
  const inProgress     = kpis?.inProgress     ?? 0;
  const completed      = kpis?.completed      ?? 0;
  const closed         = kpis?.closed         ?? 0;
  const verified       = kpis?.verified       ?? 0;
  const rejected       = kpis?.rejected       ?? 0;
  const overdue        = kpis?.overdue        ?? 0;
  const completionRate = kpis?.completionRate ?? kpis?.closureRate ?? 0;
  const critical       = kpis?.byRisk?.CRITICAL ?? 0;
  const high           = kpis?.byRisk?.HIGH     ?? 0;

  const closedTotal = closed + verified;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
      {/* الصف الأول */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <MiniCard
          title="إجمالي التوصيات"
          value={total}
          icon="📋"
          color="#0c2340"
          bgColor="rgba(12, 35, 64, 0.04)"
          borderColor="rgba(12, 35, 64, 0.15)"
        />
        <MiniCard
          title="المفتوحة والمحالة"
          value={open}
          icon="📤"
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.05)"
          borderColor="rgba(59, 130, 246, 0.2)"
          onClick={open > 0 ? onFilterOpen : undefined}
          badge={open > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="قيد المعالجة"
          value={inProgress}
          icon="⚙️"
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.05)"
          borderColor="rgba(245, 158, 11, 0.2)"
          onClick={inProgress > 0 ? onFilterInProgress : undefined}
          badge={inProgress > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="منجزة من الجهة"
          value={completed}
          icon="✅"
          color="#8b5cf6"
          bgColor="rgba(139, 92, 246, 0.05)"
          borderColor="rgba(139, 92, 246, 0.2)"
          onClick={completed > 0 ? onFilterCompleted : undefined}
          badge={completed > 0 ? 'انقر للتصفية' : undefined}
        />
      </div>

      {/* الصف الثاني */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <MiniCard
          title="مغلقة"
          value={closed}
          icon="🔒"
          color="#10b981"
          bgColor="rgba(16, 185, 129, 0.05)"
          borderColor="rgba(16, 185, 129, 0.2)"
          onClick={closed > 0 ? onFilterClosed : undefined}
          badge={closed > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="تم التحقق"
          value={verified}
          icon="🔍"
          color="#6366f1"
          bgColor="rgba(99, 102, 241, 0.05)"
          borderColor="rgba(99, 102, 241, 0.2)"
          onClick={verified > 0 ? onFilterVerified : undefined}
          badge={verified > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="مرفوضة"
          value={rejected}
          icon="❌"
          color="#ef4444"
          bgColor="rgba(239, 68, 68, 0.05)"
          borderColor="rgba(239, 68, 68, 0.2)"
          onClick={rejected > 0 ? onFilterRejected : undefined}
          badge={rejected > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="معدل الإنجاز"
          value={`${completionRate}%`}
          icon="🎯"
          color="#0c2340"
          bgColor="rgba(12, 35, 64, 0.04)"
          borderColor="rgba(12, 35, 64, 0.15)"
        />
      </div>

      {/* الصف الثالث */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <MiniCard
          title="مغلقة + تم التحقق"
          value={closedTotal}
          icon="🏁"
          color="#059669"
          bgColor="rgba(5, 150, 105, 0.05)"
          borderColor="rgba(5, 150, 105, 0.2)"
        />
        <MiniCard
          title="متأخرة عن الاستحقاق"
          value={overdue}
          icon="⏰"
          color="#ef4444"
          bgColor="rgba(239, 68, 68, 0.05)"
          borderColor="rgba(239, 68, 68, 0.2)"
          onClick={overdue > 0 ? onFilterOverdue : undefined}
          badge={overdue > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="مستوى خطورة: حرجة"
          value={critical}
          icon="🔴"
          color="#dc2626"
          bgColor="rgba(220, 38, 38, 0.05)"
          borderColor="rgba(220, 38, 38, 0.2)"
          onClick={critical > 0 ? onFilterCritical : undefined}
          badge={critical > 0 ? 'انقر للتصفية' : undefined}
        />
        <MiniCard
          title="مستوى خطورة: عالية"
          value={high}
          icon="🟠"
          color="#d97706"
          bgColor="rgba(217, 119, 6, 0.05)"
          borderColor="rgba(217, 119, 6, 0.2)"
          onClick={high > 0 ? onFilterHigh : undefined}
          badge={high > 0 ? 'انقر للتصفية' : undefined}
        />
      </div>
    </div>
  );
};
