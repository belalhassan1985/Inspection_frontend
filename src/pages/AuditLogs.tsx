import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await apiFetch('/audit-logs');
        setLogs(data);
      } catch (e: any) {
        setError(e.message || 'فشل تحميل سجل العمليات');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">سجل العمليات والنظام (Audit Trail)</h1>
          <p className="page-subtitle">سجل العمليات الرقابية وسجل الدخول غير القابل للتعديل لأغراض الأمان والتدقيق</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل السجلات...</div>
      ) : (
        <div className="card">
          <h3>سجلات النظام الأمنية</h3>
          <table>
            <thead>
              <tr>
                <th>تاريخ وتوقيت العملية</th>
                <th>نوع العملية</th>
                <th>اسم المستخدم</th>
                <th>عنوان IP</th>
                <th>متصفح العميل</th>
                <th>تفاصيل تقنية</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                  <td>
                    <span className={`badge badge-${log.actionType === 'USER_LOGIN' ? 'success' : 'info'}`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td><strong>{log.username}</strong></td>
                  <td><code>{log.ipAddress}</code></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.userAgent}
                  </td>
                  <td style={{ fontSize: '11px' }}>
                    {log.details ? JSON.stringify(log.details) : 'بلا'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>لا توجد سجلات بعد. يرجى تسجيل الدخول أو إجراء عمليات في النظام أولاً.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
