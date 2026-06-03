import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface TimelineEntry {
  id: string;
  type: string;
  date: string;
  eventLabel: string;
  fromStatus: string | null;
  toStatus: string | null;
  progressPercent: number | null;
  actorName: string;
  notes: string | null;
  evidenceFile: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    description: string;
  } | null;
  replies?: {
    id: string;
    authorName: string;
    text: string;
    date: string;
  }[];
}

interface TimelineData {
  trackingId: string;
  recommendationNumber: string;
  timeline: TimelineEntry[];
  durations: Record<string, number | null>;
}

interface Props {
  trackingId: string;
}

const EVENT_ICONS: Record<string, string> = {
  ISSUED: '📋',
  REASSIGN: '📤',
  STATUS_CHANGE: '🔄',
  PROGRESS_UPDATE: '📈',
  COMMENT: '💬',
  EVIDENCE_UPLOAD: '📎',
  EXTENSION_REQUEST: '⏰',
};

const EVENT_COLORS: Record<string, { color: string; bg: string }> = {
  ISSUED: { color: '#718096', bg: '#f1f5f9' },
  REASSIGN: { color: '#3b82f6', bg: '#eff6ff' },
  STATUS_CHANGE: { color: '#6366f1', bg: '#eef2ff' },
  PROGRESS_UPDATE: { color: '#f59e0b', bg: '#fffbeb' },
  COMMENT: { color: '#10b981', bg: '#ecfdf5' },
  EVIDENCE_UPLOAD: { color: '#8b5cf6', bg: '#f5f3ff' },
  EXTENSION_REQUEST: { color: '#ef4444', bg: '#fef2f2' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTimeSince(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `منذ ${diffHours} ساعة`;
  }
  if (diffDays === 1) return 'منذ يوم واحد';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  return `منذ ${Math.floor(diffDays / 30)} شهر`;
}

function formatDuration(days: number | null): string {
  if (days === null || days === undefined) return '—';
  if (days === 0) return 'نفس اليوم';
  return `${days} يوم`;
}

const RecommendationTimeline: React.FC<Props> = ({ trackingId }) => {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!trackingId) return;
    setLoading(true);
    api
      .get(`/recommendations/tracking/${trackingId}/timeline`)
      .then((res) => {
        setData(res.data);
      })
      .catch((e) => {
        console.error('Failed to load timeline:', e);
        setError('فشل تحميل الخط الزمني');
      })
      .finally(() => setLoading(false));
  }, [trackingId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
        ⏳ جار تحميل الخط الزمني...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e53e3e', fontSize: '13px' }}>
        ❌ {error}
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
        📭 لا توجد إجراءات مسجلة بعد على هذه التوصية.
      </div>
    );
  }

  const { timeline, durations } = data;

  return (
    <div>
      {/* Durations Summary */}
      {(durations.forwardingLag !== null || durations.processingLag !== null) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0c2340', width: '100%', marginBottom: '4px' }}>
            ⏱ الفترات الزمنية بين المراحل
          </div>
          <DurationBadge label="الإحالة" days={durations.forwardingLag} />
          <DurationBadge label="بدء المعالجة" days={durations.processingLag} />
          <DurationBadge label="المعالجة" days={durations.processingDuration} />
          <DurationBadge label="التحقق" days={durations.verificationDuration} />
          <DurationBadge label="الإغلاق" days={durations.closureDuration} />
          <DurationBadge label="العمر الكلي" days={durations.totalAge} highlight />
        </div>
      )}

      {/* Timeline */}
      <div
        style={{
          position: 'relative',
          paddingRight: '30px',
          borderRight: '3px solid #cbd5e0',
          marginRight: '10px',
        }}
      >
        {timeline.map((entry, idx) => {
          const icon =
            entry.type === 'STATUS_CHANGE'
              ? EVENT_ICONS[entry.toStatus || ''] || EVENT_ICONS['STATUS_CHANGE']
              : EVENT_ICONS[entry.type] || '⚡';

          const color = EVENT_COLORS[entry.type] || EVENT_COLORS['STATUS_CHANGE'];

          return (
            <div key={`${entry.id}-${idx}`} style={{ position: 'relative', marginBottom: '28px' }}>
              {/* Timeline node */}
              <span
                style={{
                  position: 'absolute',
                  right: '-44px',
                  top: '2px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: color.bg,
                  color: color.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  boxShadow: '0 0 0 5px #fff',
                  border: `1px solid ${color.color}33`,
                  zIndex: 1,
                }}
                title={entry.eventLabel}
              >
                {icon}
              </span>

              {/* Card */}
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.015)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '-7px',
                    top: '10px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#fff',
                    borderRight: '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0',
                    transform: 'rotate(-45deg)',
                  }}
                />

                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    gap: '6px',
                    zIndex: 2,
                    position: 'relative',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#0c2340',
                        marginLeft: '10px',
                      }}
                    >
                      {entry.eventLabel}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#718096' }}>
                      بواسطة: <strong style={{ color: '#4a5568' }}>{entry.actorName}</strong>
                    </span>
                    {entry.progressPercent !== null && entry.progressPercent !== undefined && (
                      <span
                        style={{
                          marginRight: '8px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#ebf8ff',
                          color: '#2b6cb0',
                        }}
                      >
                        {entry.progressPercent}%
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      color: '#718096',
                      backgroundColor: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDate(entry.date)} - {new Date(entry.date).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                    {' '}({formatTimeSince(entry.date)})
                  </span>
                </div>

                {/* Status change detail */}
                {entry.type === 'STATUS_CHANGE' && entry.fromStatus && entry.toStatus && (
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                      fontSize: '11px',
                      backgroundColor: '#f7fafc',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      zIndex: 2,
                      position: 'relative',
                    }}
                  >
                    <span style={{ color: '#718096' }}>تغيرت الحالة من:</span>
                    <span style={{ textDecoration: 'line-through', color: '#a0aec0' }}>
                      {entry.fromStatus}
                    </span>
                    <span style={{ color: '#718096' }}>←</span>
                    <span style={{ color: '#0c2340', fontWeight: 800 }}>{entry.toStatus}</span>
                  </div>
                )}

                {/* Notes */}
                {entry.notes && (
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '12.5px',
                      color: '#2d3748',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      zIndex: 2,
                      position: 'relative',
                    }}
                  >
                    {entry.notes}
                  </p>
                )}

                {/* Evidence file */}
                {entry.evidenceFile && (
                  <div
                    style={{
                      marginTop: '10px',
                      borderTop: '1px solid #edf2f7',
                      paddingTop: '8px',
                      zIndex: 2,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e0',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                      }}
                    >
                      <span>📄</span>
                      <strong style={{ color: '#0c2340' }}>{entry.evidenceFile.fileName}</strong>
                      <span style={{ fontSize: '10px', color: '#718096' }}>
                        ({(entry.evidenceFile.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}

                {/* Comment replies */}
                {entry.type === 'COMMENT' && entry.replies && entry.replies.length > 0 && (
                  <div
                    style={{
                      marginTop: '10px',
                      borderTop: '1px solid #edf2f7',
                      paddingTop: '8px',
                      zIndex: 2,
                      position: 'relative',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px', fontWeight: 700 }}>
                      💬 الردود:
                    </div>
                    {entry.replies.map((reply) => (
                      <div
                        key={reply.id}
                        style={{
                          marginBottom: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          fontSize: '12px',
                          borderRight: '3px solid #cbd5e0',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                          }}
                        >
                          <strong style={{ color: '#0c2340', fontSize: '11px' }}>
                            {reply.authorName}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#718096' }}>
                            {formatDate(reply.date)}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#2d3748' }}>{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function DurationBadge({
  label,
  days,
  highlight = false,
}: {
  label: string;
  days: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        backgroundColor: highlight ? '#0c2340' : '#fff',
        border: `1px solid ${highlight ? '#0c2340' : '#cbd5e0'}`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: highlight ? '#a0c4e8' : '#718096',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 800,
          color: highlight ? '#fff' : '#0c2340',
        }}
      >
        {formatDuration(days)}
      </div>
    </div>
  );
}

export default RecommendationTimeline;
