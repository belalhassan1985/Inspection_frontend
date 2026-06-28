import React, { useState } from 'react';
import { WorkloadBadge } from './WorkloadBadge';

interface DutyRow {
  campaignName: string;
  entityName: string;
  startDate: string;
  daysOnDuty: number;
  role: string;
}

interface InspectorDuty {
  inspectorId: string;
  fullName: string;
  department: string;
  workloadScore: number;
  workloadLevel: string;
  duties: DutyRow[];
}

interface DutiesExpandableTableProps {
  data: InspectorDuty[];
}

const ROLE_LABELS: Record<string, string> = {
  LEADER: 'قائد',
  DEPUTY: 'نائب قائد',
  MEMBER: 'عضو',
};

const ROLE_COLORS: Record<string, string> = {
  LEADER: '#d4af37',
  DEPUTY: '#3b82f6',
  MEMBER: '#6b7280',
};

export const DutiesExpandableTable: React.FC<DutiesExpandableTableProps> = ({ data }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (data.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>لا توجد بيانات للعرض</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((insp) => (
        <div key={insp.inspectorId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            onClick={() => toggle(insp.inspectorId)}
            style={{
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: expanded[insp.inspectorId] ? '#f8fafc' : '#ffffff',
              borderBottom: expanded[insp.inspectorId] ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px', transition: 'transform 0.2s', display: 'inline-block', transform: expanded[insp.inspectorId] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--primary-color)' }}>{insp.fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{insp.department}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{insp.duties.length} واجبات</span>
              <WorkloadBadge level={insp.workloadLevel} />
            </div>
          </div>

          {expanded[insp.inspectorId] && (
            <div style={{ padding: '12px 18px 18px 40px', backgroundColor: '#fafbfc' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>اسم اللجنة</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>الجهة المفتشة</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>تاريخ البداية</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>أيام الخدمة</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>الدور</th>
                  </tr>
                </thead>
                <tbody>
                  {insp.duties.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{d.campaignName}</td>
                      <td style={{ padding: '8px 10px' }}>{d.entityName}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {d.startDate ? new Date(d.startDate).toLocaleDateString('ar-IQ') : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontWeight: 'bold' }}>{d.daysOnDuty}</span> يوم
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          color: ROLE_COLORS[d.role] || '#6b7280',
                          fontWeight: 'bold',
                          fontSize: '11px',
                        }}>
                          {ROLE_LABELS[d.role] || d.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
