import React from 'react';
import { WorkloadBadge } from './WorkloadBadge';

interface LoadedInspector {
  inspectorId: string;
  fullName: string;
  department: string;
  workloadScore: number;
  workloadLevel: string;
  totalParticipation: number;
  duties: any[];
}

interface DepartmentImbalance {
  department: string;
  totalInspectors: number;
  heavyOverloadedCount: number;
  isBalanced: boolean;
}

interface BalanceComparisonPanelProps {
  mostLoaded: LoadedInspector | null;
  leastLoaded: LoadedInspector | null;
  departmentImbalance: DepartmentImbalance[];
}

export const BalanceComparisonPanel: React.FC<BalanceComparisonPanelProps> = ({
  mostLoaded, leastLoaded, departmentImbalance,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="card" style={{ padding: '18px', borderRight: '5px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '10px' }}>🔴 محمل فوق الطاقة</div>
          {mostLoaded ? (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--primary-color)' }}>{mostLoaded.fullName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{mostLoaded.department}</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>{mostLoaded.workloadScore}</span>
                <WorkloadBadge level={mostLoaded.workloadLevel} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {mostLoaded.totalParticipation} حملات | {mostLoaded.duties.length} واجبات نشطة
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-light)', fontSize: '12px', padding: '15px 0', textAlign: 'center' }}>لا توجد بيانات</div>
          )}
        </div>

        <div className="card" style={{ padding: '18px', borderRight: '5px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '10px' }}>🟢 متفرغ</div>
          {leastLoaded ? (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--primary-color)' }}>{leastLoaded.fullName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{leastLoaded.department}</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981' }}>{leastLoaded.workloadScore}</span>
                <WorkloadBadge level={leastLoaded.workloadLevel} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {leastLoaded.totalParticipation} حملات | {leastLoaded.duties.length} واجبات نشطة
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-light)', fontSize: '12px', padding: '15px 0', textAlign: 'center' }}>لا توجد بيانات</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '18px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--primary-color)' }}>⚖️ توازن الأقسام</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'right', padding: '8px 10px' }}>القسم</th>
              <th style={{ textAlign: 'center', padding: '8px 10px' }}>عدد المفتشين</th>
              <th style={{ textAlign: 'center', padding: '8px 10px' }}>محملين فوق الطاقة</th>
              <th style={{ textAlign: 'center', padding: '8px 10px' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {departmentImbalance.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 10px', fontWeight: 500 }}>{d.department}</td>
                <td style={{ textAlign: 'center', padding: '8px 10px' }}>{d.totalInspectors}</td>
                <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                  <span style={{
                    color: d.heavyOverloadedCount > 0 ? '#ef4444' : '#10b981',
                    fontWeight: 'bold',
                  }}>
                    {d.heavyOverloadedCount}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: d.isBalanced ? '#10b98120' : '#ef444420',
                    color: d.isBalanced ? '#10b981' : '#ef4444',
                  }}>
                    {d.isBalanced ? '🟢 متوازن' : '🔴 غير متوازن'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
