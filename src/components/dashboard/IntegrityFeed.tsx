import React from 'react';

interface AuditLog {
  id: number;
  username: string;
  actionType: string;
  timestamp: string;
  details?: any;
}

interface IntegrityFeedProps {
  logs: AuditLog[];
}

export const IntegrityFeed: React.FC<IntegrityFeedProps> = ({ logs }) => {
  const getActionLabel = (type: string) => {
    switch (type) {
      case 'CREATE_INSPECTION':
        return { label: '➕ إنشاء تفتيش', color: '#3b82f6' };
      case 'UPDATE_GRADE':
        return { label: '✏️ تعديل درجة', color: '#f59e0b' };
      case 'DELETE_INSPECTION':
        return { label: '🗑️ حذف تفتيش', color: '#ef4444' };
      case 'APPROVE_INSPECTION':
        return { label: '✅ اعتماد تقرير', color: '#10b981' };
      case 'LOGIN':
        return { label: '🔑 تسجيل دخول', color: '#10b981' };
      case 'LOGOUT':
        return { label: '🚪 تسجيل خروج', color: '#718096' };
      default:
        return { label: `⚙️ ${type}`, color: '#718096' };
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('ar-IQ');
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="card" style={{ padding: '20px', height: '100%', minHeight: '350px' }}>
      <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)', fontSize: '16px' }}>🛡️ مركز الرقابة وسجل النزاهة الأمني</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
        مراقبة حية فورية للعمليات والتعديلات الحساسة التي تمت على النظام لضمان شفافية النتائج.
      </p>

      <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '5px' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '50px 10px', textAlign: 'center', color: 'var(--text-light)', fontSize: '12px' }}>
            لا توجد سجلات تدقيق أمني متوفرة حالياً.
          </div>
        ) : (
          logs.map((log) => {
            const action = getActionLabel(log.actionType);
            return (
              <div
                key={log.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  borderRight: `4px solid ${action.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  fontSize: '11px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>👤 {log.username}</span>
                    <span style={{ color: action.color, fontWeight: 'bold', fontSize: '10px', backgroundColor: 'white', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      {action.label}
                    </span>
                  </div>
                  {log.details && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                      التفاصيل:{' '}
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details)
                        : log.details}
                    </div>
                  )}
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: '9px', whiteSpace: 'nowrap' }}>
                  {formatTime(log.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
