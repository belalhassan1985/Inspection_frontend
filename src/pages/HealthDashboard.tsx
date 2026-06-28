import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface HealthMatrix {
  EXCELLENT: number;
  GOOD: number;
  NEEDS_ATTENTION: number;
  AT_RISK: number;
  CRITICAL: number;
}

interface HealthRec {
  id: string;
  recommendationNumber: string;
  score: number;
  status: string;
  progress: number;
}

interface HealthSummary {
  matrix: HealthMatrix;
  recommendations: HealthRec[];
}

interface SlaSummary {
  total?: number;
  normal?: number;
  atRisk?: number;
  overdue?: number;
  avgTotalAge?: number;
  avgOverdueDays?: number;
}

const matrixConfig = [
  { key: 'EXCELLENT' as const, label: 'ممتاز', color: '#16a34a', bg: '#f0fdf4', textColor: '#166534', minScore: 80 },
  { key: 'GOOD' as const, label: 'جيد', color: '#3b82f6', bg: '#eff6ff', textColor: '#1e40af', minScore: 60 },
  { key: 'NEEDS_ATTENTION' as const, label: 'بحاجة للانتباه', color: '#d97706', bg: '#fffbeb', textColor: '#92400e', minScore: 40 },
  { key: 'AT_RISK' as const, label: 'في خطر', color: '#ea580c', bg: '#fff7ed', textColor: '#9a3412', minScore: 20 },
  { key: 'CRITICAL' as const, label: 'حرج', color: '#dc2626', bg: '#fef2f2', textColor: '#991b1b', minScore: 0 },
];

export const HealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [sla, setSla] = useState<SlaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const errMap: Record<string, boolean> = {};

      const [healthRes, slaRes] = await Promise.all([
        apiFetch('/analytics/health-summary').catch(() => {
          errMap.health = true;
          return null;
        }),
        apiFetch('/analytics/sla/summary').catch(() => {
          errMap.sla = true;
          return null;
        }),
      ]);

      setErrors(errMap);
      setHealth(healthRes as HealthSummary | null);
      setSla(slaRes as SlaSummary | null);
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

  const totalRecs = health?.recommendations?.length ?? null;
  const avgScore = health?.recommendations?.length
    ? (health.recommendations.reduce((s, r) => s + r.score, 0) / health.recommendations.length).toFixed(1)
    : null;

  const totalMatrix = health
    ? Object.values(health.matrix).reduce((s, v) => s + v, 0)
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

  const getOverallStatus = () => {
    if (!health) return null;
    const m = health.matrix;
    if (m.CRITICAL > m.EXCELLENT && m.CRITICAL > m.GOOD) return { label: 'حرج', color: '#dc2626' };
    if (m.AT_RISK > m.EXCELLENT && m.AT_RISK > m.GOOD) return { label: 'في خطر', color: '#ea580c' };
    if (m.NEEDS_ATTENTION > m.EXCELLENT) return { label: 'بحاجة للانتباه', color: '#d97706' };
    if (m.EXCELLENT > m.NEEDS_ATTENTION && m.EXCELLENT > m.AT_RISK) return { label: 'ممتاز', color: '#16a34a' };
    return { label: 'جيد', color: '#3b82f6' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div style={{
      padding: '30px', fontFamily: 'Cairo, sans-serif',
      direction: 'rtl', textAlign: 'right',
    }}>
      <h1 style={{
        color: '#0c2340', fontSize: '22px', fontWeight: 'bold',
        margin: '0 0 4px 0',
      }}>
        تحليلات صحة التوصيات الرقابية
      </h1>
      <p style={{ color: '#718096', fontSize: '13px', margin: '0 0 24px 0' }}>
        مؤشر الصحة العام وجودة التحديثات الرقابية
      </p>

      {overallStatus && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          padding: '20px', border: '1px solid #e2e8f0',
          textAlign: 'center', marginBottom: '24px',
          borderTop: `4px solid ${overallStatus.color}`,
        }}>
          <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>
            حالة النظام العامة
          </div>
          <div style={{
            fontSize: '24px', fontWeight: 'bold',
            color: overallStatus.color,
          }}>
            {overallStatus.label}
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px', marginBottom: '24px',
      }}>
        {renderCard('إجمالي التوصيات', totalRecs, '#0c2340', !!errors.health)}
        {renderCard('متوسط درجة الصحة', avgScore != null ? `${avgScore}%` : null, '#10b981', !!errors.health)}
        {renderCard('ضمن المستوى الطبيعي', sla?.normal ?? null, '#16a34a', !!errors.sla)}
        {renderCard('في خطر', sla?.atRisk ?? null, '#ea580c', !!errors.sla)}
        {renderCard('متأخرة', sla?.overdue ?? null, '#dc2626', !!errors.sla)}
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
            مصفوفة الصحة
          </h3>
          {health ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matrixConfig.map(({ key, label, color, bg, textColor }) => {
                const count = health.matrix[key];
                const pct = totalMatrix > 0
                  ? ((count / totalMatrix) * 100).toFixed(1)
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
            مؤشرات اتفاقية مستوى الخدمة
          </h3>
          {sla ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sla.avgTotalAge != null && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 12px', backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>
                    متوسط العمر الكلي (أيام)
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0c2340' }}>
                    {sla.avgTotalAge.toFixed(1)}
                  </span>
                </div>
              )}
              {sla.avgOverdueDays != null && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 12px', backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '13px', color: '#991b1b' }}>
                    متوسط أيام التأخير
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>
                    {sla.avgOverdueDays.toFixed(1)}
                  </span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 12px', backgroundColor: '#f0fdf4',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#166534' }}>
                  ضمن المستوى الطبيعي
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
                  {sla.normal ?? 0}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 12px', backgroundColor: '#fffbeb',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#92400e' }}>
                  في خطر
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#d97706' }}>
                  {sla.atRisk ?? 0}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 12px', backgroundColor: '#fef2f2',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#991b1b' }}>
                  متأخرة
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>
                  {sla.overdue ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: '#a0aec0', fontSize: '13px' }}>غير متاح حالياً</div>
          )}
        </div>
      </div>

      {health?.recommendations && health.recommendations.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          padding: '20px', border: '1px solid #e2e8f0',
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 'bold', color: '#0c2340',
            margin: '0 0 14px 0', paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
          }}>
            آخر التوصيات
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '13px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{
                    padding: '8px 12px', textAlign: 'right',
                    color: '#475569', fontWeight: 600,
                    borderBottom: '2px solid #e2e8f0',
                  }}>رقم التوصية</th>
                  <th style={{
                    padding: '8px 12px', textAlign: 'right',
                    color: '#475569', fontWeight: 600,
                    borderBottom: '2px solid #e2e8f0',
                  }}>درجة الصحة</th>
                  <th style={{
                    padding: '8px 12px', textAlign: 'right',
                    color: '#475569', fontWeight: 600,
                    borderBottom: '2px solid #e2e8f0',
                  }}>الحالة</th>
                  <th style={{
                    padding: '8px 12px', textAlign: 'right',
                    color: '#475569', fontWeight: 600,
                    borderBottom: '2px solid #e2e8f0',
                  }}>نسبة الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {health.recommendations.slice(0, 20).map((rec) => {
                  const cfg = matrixConfig.find(m => m.key === rec.status);
                  return (
                    <tr key={rec.id}>
                      <td style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        color: '#1a202c', fontWeight: 500,
                      }}>
                        {rec.recommendationNumber}
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        color: cfg?.color || '#475569',
                        fontWeight: 700,
                      }}>
                        {rec.score}%
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f1f5f9',
                      }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px',
                          borderRadius: '12px', fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: cfg?.bg || '#f1f5f9',
                          color: cfg?.textColor || '#475569',
                        }}>
                          {cfg?.label || rec.status}
                        </span>
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        color: '#475569',
                      }}>
                        {rec.progress}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
