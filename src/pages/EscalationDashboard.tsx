import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface EscalationLevels {
  level0: number;
  level1: number;
  level2: number;
  level3: number;
}

interface EscalationDrivers {
  response: number;
  resolution: number;
  closure: number;
}

interface EscalationSummary {
  levels: EscalationLevels;
  drivers: EscalationDrivers;
}

interface RecStats {
  kpis?: {
    total?: number;
    open?: number;
    closed?: number;
    overdue?: number;
    closureRate?: number;
  };
}

interface EntityStat {
  entityId?: string;
  entityName: string;
  openCount: number;
  overdueCount: number;
}

const levelConfig = [
  { key: 'level0' as const, label: 'المستوى ٠ — بدون تصعيد', color: '#16a34a', bg: '#f0fdf4', textColor: '#166534' },
  { key: 'level1' as const, label: 'المستوى ١ — تصعيد ابتدائي', color: '#d97706', bg: '#fffbeb', textColor: '#92400e' },
  { key: 'level2' as const, label: 'المستوى ٢ — تصعيد متوسط', color: '#ea580c', bg: '#fff7ed', textColor: '#9a3412' },
  { key: 'level3' as const, label: 'المستوى ٣ — تصعيد عالٍ', color: '#dc2626', bg: '#fef2f2', textColor: '#991b1b' },
];

const driverConfig = [
  { key: 'response' as const, label: 'الاستجابة', color: '#3b82f6', bg: '#eff6ff', textColor: '#1e40af' },
  { key: 'resolution' as const, label: 'المعالجة', color: '#8b5cf6', bg: '#f5f3ff', textColor: '#6d28d9' },
  { key: 'closure' as const, label: 'الإغلاق', color: '#0c2340', bg: '#f8fafc', textColor: '#0c2340' },
];

export const EscalationDashboard: React.FC = () => {
  const [escalation, setEscalation] = useState<EscalationSummary | null>(null);
  const [recStats, setRecStats] = useState<RecStats | null>(null);
  const [byEntity, setByEntity] = useState<EntityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const errMap: Record<string, boolean> = {};

      const [escRes, statsRes, entityRes] = await Promise.all([
        apiFetch('/analytics/escalation-summary').catch(() => {
          errMap.escalation = true;
          return null;
        }),
        apiFetch('/recommendations/tracking/stats/summary').catch(() => {
          errMap.stats = true;
          return null;
        }),
        apiFetch('/recommendations/tracking/stats/by-entity').catch(() => {
          errMap.entity = true;
          return [];
        }),
      ]);

      setErrors(errMap);
      setEscalation(escRes as EscalationSummary | null);
      setRecStats(statsRes as RecStats | null);
      setByEntity(Array.isArray(entityRes) ? (entityRes as EntityStat[]) : []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '30px', fontFamily: 'Cairo, sans-serif',
        direction: 'rtl', textAlign: 'center', color: '#718096',
      }}>
        جاري تحميل البيانات...
      </div>
    );
  }

  const totalLevels = escalation
    ? Object.values(escalation.levels).reduce((s, v) => s + v, 0)
    : 0;
  const totalDrivers = escalation
    ? Object.values(escalation.drivers).reduce((s, v) => s + v, 0)
    : 0;

  const renderCard = (
    label: string, value: string | number | null,
    color: string, error: boolean,
  ) => (
    <div key={label} style={{
      backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px',
      border: '1px solid #e2e8f0', textAlign: 'center',
      borderTop: `4px solid ${color}`,
      minHeight: '100px', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
    }}>
      {error ? (
        <div style={{ fontSize: '14px', color: '#a0aec0' }}>غير متاح حالياً</div>
      ) : (
        <>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color, lineHeight: 1.2 }}>
            {value ?? <span style={{ fontSize: '13px', color: '#a0aec0' }}>غير متاح حالياً</span>}
          </div>
          <div style={{ fontSize: '13px', color: '#718096', marginTop: '5px', fontWeight: 500 }}>
            {label}
          </div>
        </>
      )}
    </div>
  );

  const avgOverdue = recStats?.kpis?.overdue && recStats?.kpis?.total
    ? ((recStats.kpis.overdue / recStats.kpis.total) * 100).toFixed(1)
    : null;

  return (
    <div style={{
      padding: '30px', fontFamily: 'Cairo, sans-serif',
      direction: 'rtl', textAlign: 'right',
    }}>
      <h1 style={{
        color: '#0c2340', fontSize: '22px', fontWeight: 'bold',
        margin: '0 0 4px 0',
      }}>
        لوحة متابعة التصعيد الإداري
      </h1>
      <p style={{ color: '#718096', fontSize: '13px', margin: '0 0 24px 0' }}>
        مراقبة التوصيات المتأخرة ومستويات التصعيد التلقائي
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px', marginBottom: '24px',
      }}>
        {renderCard('إجمالي التوصيات', recStats?.kpis?.total ?? null, '#0c2340', !!errors.stats)}
        {renderCard('الحالات المفتوحة', recStats?.kpis?.open ?? null, '#3b82f6', !!errors.stats)}
        {renderCard('التوصيات المتأخرة', recStats?.kpis?.overdue ?? null, '#dc2626', !!errors.stats)}
        {renderCard('نسبة التأخير', avgOverdue != null ? `${avgOverdue}%` : null, '#ea580c', !!errors.stats)}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px', marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          padding: '20px', border: '1px solid #e2e8f0',
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 'bold', color: '#0c2340',
            margin: '0 0 14px 0', paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
          }}>
            مستويات التصعيد
          </h3>
          {escalation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {levelConfig.map(({ key, label, color, bg, textColor }) => {
                const count = escalation.levels[key];
                const pct = totalLevels > 0
                  ? ((count / totalLevels) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={key} style={{
                    padding: '10px 12px', backgroundColor: bg,
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color }}>
                        {count}
                      </span>
                    </div>
                    <div style={{
                      height: '6px', backgroundColor: '#e2e8f0',
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        backgroundColor: color, borderRadius: '3px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {pct}% من الإجمالي
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#a0aec0', fontSize: '13px' }}>غير متاح حالياً</div>
          )}
        </div>

        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          padding: '20px', border: '1px solid #e2e8f0',
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 'bold', color: '#0c2340',
            margin: '0 0 14px 0', paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
          }}>
            مسببات خرق اتفاقية مستوى الخدمة
          </h3>
          {escalation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {driverConfig.map(({ key, label, color, bg, textColor }) => {
                const count = escalation.drivers[key];
                const pct = totalDrivers > 0
                  ? ((count / totalDrivers) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={key} style={{
                    padding: '10px 12px', backgroundColor: bg,
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color }}>
                        {count}
                      </span>
                    </div>
                    <div style={{
                      height: '6px', backgroundColor: '#e2e8f0',
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        backgroundColor: color, borderRadius: '3px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {pct}% من الإجمالي
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#a0aec0', fontSize: '13px' }}>غير متاح حالياً</div>
          )}
        </div>

        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          padding: '20px', border: '1px solid #e2e8f0',
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 'bold', color: '#0c2340',
            margin: '0 0 14px 0', paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
          }}>
            الجهات الأكثر تأخراً
          </h3>
          {byEntity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {byEntity.slice(0, 10).map((entity, idx) => (
                <div key={entity.entityId || idx} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 12px',
                  backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                  borderRadius: '6px',
                }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 500, color: '#1a202c',
                    flex: 1,
                  }}>
                    {entity.entityName}
                  </span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#3b82f6' }}>
                      مفتوحة: {entity.openCount}
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: entity.overdueCount > 0 ? '#dc2626' : '#16a34a',
                    }}>
                      متأخرة: {entity.overdueCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#a0aec0', fontSize: '13px' }}>غير متاح حالياً</div>
          )}
        </div>
      </div>
    </div>
  );
};
