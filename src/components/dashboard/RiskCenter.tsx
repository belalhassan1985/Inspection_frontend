import React, { useState } from 'react';

interface RiskEntity {
  entityName: string;
  score: number;
  leaderRank: string;
  leaderName: string;
}

interface RiskCenterProps {
  red: RiskEntity[];
  yellow: RiskEntity[];
  green: RiskEntity[];
}

export const RiskCenter: React.FC<RiskCenterProps> = ({ red, yellow, green }) => {
  const [activeTab, setActiveTab] = useState<'red' | 'yellow' | 'green'>('red');

  const getList = () => {
    switch (activeTab) {
      case 'red': return red;
      case 'yellow': return yellow;
      case 'green': return green;
      default: return [];
    }
  };

  const list = getList();

  const tabStyle = (tab: 'red' | 'yellow' | 'green') => {
    const isActive = activeTab === tab;
    let activeBorder = '';
    let activeBg = '';
    let textColor = '';

    if (tab === 'red') {
      activeBorder = '3px solid #ef4444';
      activeBg = 'rgba(239, 68, 68, 0.05)';
      textColor = '#ef4444';
    } else if (tab === 'yellow') {
      activeBorder = '3px solid #f59e0b';
      activeBg = 'rgba(245, 158, 11, 0.05)';
      textColor = '#f59e0b';
    } else {
      activeBorder = '3px solid #10b981';
      activeBg = 'rgba(16, 185, 129, 0.05)';
      textColor = '#10b981';
    }

    return {
      flex: 1,
      textAlign: 'center' as const,
      padding: '12px 8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 'bold',
      color: isActive ? textColor : 'var(--text-secondary)',
      borderBottom: isActive ? activeBorder : '2px solid transparent',
      backgroundColor: isActive ? activeBg : 'transparent',
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div className="card" style={{ padding: '20px', height: '100%', minHeight: '350px' }}>
      <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)', fontSize: '16px' }}>🔴 مركز قيادة وإدارة المخاطر بالوزارة</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
        فرز فوري للكيانات الأمنية التابعة للوزارة بناءً على مستويات الخطورة المعتمدة.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
        <div onClick={() => setActiveTab('red')} style={tabStyle('red')}>
          🔴 خطورة حمراء ({red.length})
        </div>
        <div onClick={() => setActiveTab('yellow')} style={tabStyle('yellow')}>
          🟡 تنبيه أصفر ({yellow.length})
        </div>
        <div onClick={() => setActiveTab('green')} style={tabStyle('green')}>
          🟢 ممتثل أخضر ({green.length})
        </div>
      </div>

      {/* Content */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {list.length === 0 ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-light)', fontSize: '12px' }}>
            لا توجد كيانات أمنية مسجلة في هذا النطاق حالياً.
          </div>
        ) : (
          <table className="table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                <th style={{ padding: '8px' }}>الكيان الأمني</th>
                <th style={{ padding: '8px' }}>القائد المسؤول</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>الدرجة</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f7fafc' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{item.entityName}</td>
                  <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                    {item.leaderRank} / {item.leaderName}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: activeTab === 'red' ? '#ef4444' : activeTab === 'yellow' ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {item.score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
