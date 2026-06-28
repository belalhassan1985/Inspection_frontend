import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface KpiData {
  totalCampaigns: number | null;
  activeCampaigns: number | null;
  totalGroups: number | null;
  activeInspectors: number | null;
  openRecommendations: number | null;
  overdueRecommendations: number | null;
  overallCompliance: number | null;
  closureRate: number | null;
}

interface BestWorstEntity {
  entityName: string;
  score: number;
  leaderName?: string;
  leaderRank?: string;
}

interface RiskEntities {
  red: { entityName: string; averageScore: number }[];
  yellow: { entityName: string; averageScore: number }[];
  green: { entityName: string; averageScore: number }[];
}

interface ExecSummary {
  kpis?: {
    overallCompliance?: number;
    activeCampaigns?: number;
    commandDeficitRate?: number;
    pendingInspections?: number;
    totalRecommendations?: number;
    humanIntegrationRate?: number;
    vehicleReadinessRate?: number;
  };
  recommendations?: {
    open?: number;
    closed?: number;
    topAuthorities?: { authorityName: string; count: number }[];
  };
  performanceLeaders?: {
    best?: BestWorstEntity;
    worst?: BestWorstEntity;
  };
  riskEntities?: RiskEntities;
  sectorPerformance?: { entityName: string; averageScore: number }[];
  recentIntegrityLogs?: any[];
}

interface RecStats {
  kpis?: {
    total?: number;
    open?: number;
    closed?: number;
    overdue?: number;
    closureRate?: number;
    completionRate?: number;
    byRisk?: Record<string, number>;
  };
}

export const ExecutiveDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [execSummary, setExecSummary] = useState<ExecSummary | null>(null);
  const [recStats, setRecStats] = useState<RecStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const errMap: Record<string, boolean> = {};

      const [campaignsRes, groupsRes, inspectorsRes, execRes, recRes] =
        await Promise.all([
          apiFetch('/campaigns').catch(() => {
            errMap.campaigns = true;
            return [];
          }),
          apiFetch('/inspection-groups').catch(() => {
            errMap.groups = true;
            return [];
          }),
          apiFetch('/inspectors-directory').catch(() => {
            errMap.inspectors = true;
            return [];
          }),
          apiFetch('/dashboard/executive/summary').catch(() => {
            errMap.execSummary = true;
            return null;
          }),
          apiFetch('/recommendations/tracking/stats/summary').catch(() => {
            errMap.recStats = true;
            return null;
          }),
        ]);

      setErrors(errMap);

      const execData = execRes as ExecSummary | null;
      const recData = recRes as RecStats | null;

      setKpis({
        totalCampaigns: Array.isArray(campaignsRes) ? campaignsRes.length : null,
        activeCampaigns: execData?.kpis?.activeCampaigns ?? null,
        totalGroups: Array.isArray(groupsRes) ? groupsRes.length : null,
        activeInspectors: Array.isArray(inspectorsRes)
          ? inspectorsRes.filter((i: any) => i.isActive).length
          : null,
        openRecommendations:
          execData?.recommendations?.open ?? recData?.kpis?.open ?? null,
        overdueRecommendations: recData?.kpis?.overdue ?? null,
        overallCompliance: execData?.kpis?.overallCompliance ?? null,
        closureRate: recData?.kpis?.closureRate ?? null,
      });

      setExecSummary(execData);
      setRecStats(recData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const unavailable = (
    <span style={{ fontSize: '13px', color: '#a0aec0' }}>غير متاح حالياً</span>
  );

  const renderKpiCard = (
    label: string,
    value: number | string | null,
    color: string,
    icon: string,
    error: boolean,
  ) => (
    <div
      key={label}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        borderTop: `4px solid ${color}`,
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
      {error ? (
        <div style={{ fontSize: '14px', color: '#a0aec0' }}>غير متاح حالياً</div>
      ) : (
        <>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color,
              lineHeight: 1.2,
            }}
          >
            {value ?? unavailable}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#718096',
              marginTop: '5px',
              fontWeight: 500,
            }}
          >
            {label}
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          padding: '30px',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl',
          textAlign: 'center',
          color: '#718096',
        }}
      >
        جاري تحميل البيانات...
      </div>
    );
  }

  const byRisk = recStats?.kpis?.byRisk;
  const totalRisk = byRisk
    ? Object.values(byRisk).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div
      style={{
        padding: '30px',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h1
            style={{
              color: '#0c2340',
              fontSize: '22px',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
            }}
          >
            لوحة القيادة التنفيذية
          </h1>
          <p style={{ color: '#718096', fontSize: '13px', margin: 0 }}>
            وزارة الداخلية العراقية - مركز التحليلات والذكاء الرقابي
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {renderKpiCard(
          'إجمالي الحملات التفتيشية',
          kpis?.totalCampaigns ?? null,
          '#0c2340',
          '📋',
          !!errors.campaigns,
        )}
        {renderKpiCard(
          'الحملات النشطة',
          kpis?.activeCampaigns ?? null,
          '#10b981',
          '🟢',
          !!errors.execSummary,
        )}
        {renderKpiCard(
          'عدد اللجان التفتيشية',
          kpis?.totalGroups ?? null,
          '#3b82f6',
          '👥',
          !!errors.groups,
        )}
        {renderKpiCard(
          'المفتشين النشطين',
          kpis?.activeInspectors ?? null,
          '#8b5cf6',
          '🛡️',
          !!errors.inspectors,
        )}
        {renderKpiCard(
          'التوصيات المفتوحة',
          kpis?.openRecommendations ?? null,
          '#f59e0b',
          '📝',
          !!errors.execSummary,
        )}
        {renderKpiCard(
          'التوصيات المتأخرة',
          kpis?.overdueRecommendations ?? null,
          '#ef4444',
          '⚠️',
          !!errors.recStats,
        )}
        {renderKpiCard(
          'نسبة الامتثال الكلي',
          kpis?.overallCompliance != null
            ? `${kpis.overallCompliance}%`
            : null,
          '#0c2340',
          '📊',
          !!errors.execSummary,
        )}
        {renderKpiCard(
          'معدل إغلاق التوصيات',
          kpis?.closureRate != null ? `${kpis.closureRate}%` : null,
          '#0f766e',
          '✅',
          !!errors.recStats,
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {errors.execSummary ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              color: '#a0aec0',
              fontSize: '14px',
            }}
          >
            بيانات الأداء غير متاحة حالياً
          </div>
        ) : (
          <>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#0c2340',
                  margin: '0 0 14px 0',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                أداء الجهات
              </h3>
              {execSummary?.performanceLeaders?.best ? (
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#10b981',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    أفضل جهة أداءً
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a202c',
                    }}
                  >
                    {execSummary.performanceLeaders.best.entityName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    درجة الامتثال: {execSummary.performanceLeaders.best.score}%
                    {execSummary.performanceLeaders.best.leaderName
                      ? ` | ${execSummary.performanceLeaders.best.leaderRank ?? ''} ${execSummary.performanceLeaders.best.leaderName}`
                      : ''}
                  </div>
                </div>
              ) : null}
              {execSummary?.performanceLeaders?.worst ? (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#ef4444',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    أسوأ جهة أداءً
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a202c',
                    }}
                  >
                    {execSummary.performanceLeaders.worst.entityName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    درجة الامتثال: {execSummary.performanceLeaders.worst.score}%
                    {execSummary.performanceLeaders.worst.leaderName
                      ? ` | ${execSummary.performanceLeaders.worst.leaderRank ?? ''} ${execSummary.performanceLeaders.worst.leaderName}`
                      : ''}
                  </div>
                </div>
              ) : null}
              {!execSummary?.performanceLeaders?.best &&
                !execSummary?.performanceLeaders?.worst && (
                  <div style={{ color: '#a0aec0', fontSize: '13px' }}>
                    غير متاح حالياً
                  </div>
                )}
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#0c2340',
                  margin: '0 0 14px 0',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                توزيع الجهات حسب مستوى الامتثال
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#991b1b',
                    }}
                  >
                    الجهات الحمراء (أقل من ٥٠%)
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#dc2626',
                    }}
                  >
                    {execSummary?.riskEntities?.red?.length ?? 0}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#92400e',
                    }}
                  >
                    الجهات الصفراء (من ٥٠% إلى أقل من ٨٠%)
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#d97706',
                    }}
                  >
                    {execSummary?.riskEntities?.yellow?.length ?? 0}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#166534',
                    }}
                  >
                    الجهات الخضراء (٨٠% فأكثر)
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#16a34a',
                    }}
                  >
                    {execSummary?.riskEntities?.green?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#0c2340',
                  margin: '0 0 14px 0',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                توزيع التوصيات حسب مستوى الخطورة
              </h3>
              {byRisk && totalRisk > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {[
                    {
                      key: 'CRITICAL',
                      label: 'حرجة',
                      color: '#dc2626',
                      bg: '#fef2f2',
                      textColor: '#991b1b',
                    },
                    {
                      key: 'HIGH',
                      label: 'عالية',
                      color: '#ea580c',
                      bg: '#fff7ed',
                      textColor: '#9a3412',
                    },
                    {
                      key: 'MEDIUM',
                      label: 'متوسطة',
                      color: '#d97706',
                      bg: '#fffbeb',
                      textColor: '#92400e',
                    },
                    {
                      key: 'LOW',
                      label: 'منخفضة',
                      color: '#16a34a',
                      bg: '#f0fdf4',
                      textColor: '#166534',
                    },
                  ].map(({ key, label, color, bg, textColor }) => {
                    const count = byRisk[key] ?? 0;
                    const pct =
                      totalRisk > 0
                        ? ((count / totalRisk) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: bg,
                          borderRadius: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: textColor,
                          }}
                        >
                          {label} ({pct}%)
                        </span>
                        <span
                          style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: '#a0aec0', fontSize: '13px' }}>
                  غير متاح حالياً
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {execSummary?.recentIntegrityLogs &&
        execSummary.recentIntegrityLogs.length > 0 && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#0c2340',
                margin: '0 0 14px 0',
                paddingBottom: '8px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              آخر النشاطات الرقابية
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        color: '#475569',
                        fontWeight: 600,
                        borderBottom: '2px solid #e2e8f0',
                      }}
                    >
                      المستخدم
                    </th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        color: '#475569',
                        fontWeight: 600,
                        borderBottom: '2px solid #e2e8f0',
                      }}
                    >
                      الإجراء
                    </th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        color: '#475569',
                        fontWeight: 600,
                        borderBottom: '2px solid #e2e8f0',
                      }}
                    >
                      التاريخ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {execSummary.recentIntegrityLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#1a202c',
                        }}
                      >
                        {log.username}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {log.actionType}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#718096',
                        }}
                      >
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleDateString(
                              'ar-IQ',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
};
