import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchRiskLevelOptions, getRiskLevelMap, getRiskLevelDisplay } from '../services/riskLevelService';
import RecommendationTimeline from '../components/recommendation-tracking/RecommendationTimeline';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types & Configs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type RecommendationStatus =
  | 'ISSUED'
  | 'FORWARDED'
  | 'UNDER_PROCESSING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'NEEDS_CLARIFICATION'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REJECTED'
  | 'OVERDUE';

const PROGRESS_TRANSITIONS: Partial<Record<RecommendationStatus, RecommendationStatus[]>> = {
  FORWARDED: ['UNDER_PROCESSING'],
  UNDER_PROCESSING: ['PARTIALLY_COMPLETED', 'COMPLETED', 'NEEDS_CLARIFICATION'],
  PARTIALLY_COMPLETED: ['UNDER_PROCESSING', 'COMPLETED'],
  NEEDS_CLARIFICATION: ['UNDER_PROCESSING', 'COMPLETED'],
};

const VERIFY_TRANSITIONS: Partial<Record<RecommendationStatus, RecommendationStatus[]>> = {
  COMPLETED: ['VERIFIED', 'REJECTED', 'NEEDS_CLARIFICATION'],
  VERIFIED: ['CLOSED'],
  NEEDS_CLARIFICATION: ['COMPLETED', 'REJECTED', 'UNDER_PROCESSING'],
  REJECTED: ['UNDER_PROCESSING'],
};

type HealthScoreType = 'Excellent' | 'Good' | 'Needs Attention' | 'At Risk' | 'Critical';

const STATUS_CONFIG: Record<
  RecommendationStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  ISSUED: { label: 'صادرة', color: '#718096', bg: 'rgba(113,128,150,0.1)', icon: '📋' },
  FORWARDED: { label: 'محالة للجهة', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '📤' },
  UNDER_PROCESSING: { label: 'قيد المعالجة', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚙️' },
  PARTIALLY_COMPLETED: { label: 'منجزة جزئياً', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: '🌗' },
  COMPLETED: { label: 'منجزة من الجهة', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '✅' },
  NEEDS_CLARIFICATION: { label: 'بحاجة لتوضيح', color: '#d97706', bg: 'rgba(217,119,6,0.1)', icon: '❓' },
  VERIFIED: { label: 'تم التحقق', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '🔍' },
  CLOSED: { label: 'مغلقة ومعتمدة', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '🔒' },
  REJECTED: { label: 'مرفوضة', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌' },
  OVERDUE: { label: 'متأخرة عن الاستحقاق', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⚠️' },
};

const HEALTH_CONFIG: Record<
  HealthScoreType,
  { label: string; color: string; bg: string; icon: string; desc: string }
> = {
  Excellent: { label: 'Excellent (ممتاز)', color: '#38a169', bg: '#f0fff4', icon: '💚', desc: 'التوصية تسير وفق الجدول الزمني المحدد بنسبة إنجاز عالية.' },
  Good: { label: 'Good (جيد)', color: '#3182ce', bg: '#ebf8ff', icon: '💙', desc: 'حالة التوصية جيدة والإجراءات مستمرة دون عوائق كبيرة.' },
  'Needs Attention': { label: 'Needs Attention (انتباه)', color: '#d69e2e', bg: '#fefcbf', icon: '💛', desc: 'معدل التقدم بطيء أو تقترب التوصية من تاريخ استحقاقها.' },
  'At Risk': { label: 'At Risk (في خطر)', color: '#dd6b20', bg: '#fffaf0', icon: '🧡', desc: 'تأخر في المعالجة أو غياب الأدلة الثبوتية الكافية للإنجاز.' },
  Critical: { label: 'Critical (حرج)', color: '#e53e3e', bg: '#fff5f5', icon: '❤️', desc: 'التوصية تجاوزت تاريخ الاستحقاق دون إغلاق أو بنسبة تقدم متدنية جداً.' },
};

const IMPACT_CONFIG: Record<string, { label: string }> = {
  SECURITY: { label: 'أمني' },
  OPERATIONAL: { label: 'تشغيلي' },
  ADMINISTRATIVE: { label: 'إداري' },
  FINANCIAL: { label: 'مالي' },
  HUMAN_RESOURCES: { label: 'موارد بشرية' },
  LOGISTICAL: { label: 'لوجستي' },
  LOGISTICS: { label: 'لوجستي' },
  TECHNICAL: { label: 'تقني' },
  LEGAL: { label: 'قانوني' },
  INFRASTRUCTURE: { label: 'بنية تحتية' },
  TRAINING: { label: 'تدريب وتطوير' },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers & Calculations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatTimeSince = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'منذ يوم';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
    return `منذ ${diffDays} يوم`;
  } catch {
    return formatDate(dateStr);
  }
};

const calculateDaysDiff = (dueDateStr: string | null) => {
  if (!dueDateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
};

const calculateDaysElapsed = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'أقل من يوم';
    if (days === 1) return 'يوم واحد';
    if (days === 2) return 'يومان';
    if (days >= 3 && days <= 10) return `${days} أيام`;
    return `${days} يوم`;
  } catch {
    return '—';
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Health Score Calculator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const calculateHealthScore = (
  progressPercent: number,
  dueDateStr: string | null,
  status: RecommendationStatus,
  evidenceCount: number,
  updatedAtStr: string,
  riskLevel: string
): HealthScoreType => {
    if (status === 'CLOSED' || status === 'VERIFIED' || status === 'REJECTED') {
      return 'Excellent';
    }

  const diffDays = calculateDaysDiff(dueDateStr);
  
  let score = 100;

  // 1. Progress Deduction
  if (progressPercent < 20) score -= 25;
  else if (progressPercent < 50) score -= 15;
  else if (progressPercent >= 80) score += 10;

  // 2. Due Date/Remaining Days Deduction
  if (diffDays !== null) {
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (overdueDays > 30) score -= 40;
      else if (overdueDays > 7) score -= 30;
      else score -= 20;
    } else if (diffDays < 7) {
      score -= 15;
    } else if (diffDays < 15) {
      score -= 5;
    }
  }

  // 3. Evidence modifier
  if (progressPercent > 50 && evidenceCount === 0) {
    score -= 15;
  } else if (evidenceCount > 0) {
    score += 5;
  }

  // 4. Inactivity Penalty (no updates for > 30 days)
  try {
    const lastUpdateDays = Math.max(0, Math.ceil((new Date().getTime() - new Date(updatedAtStr).getTime()) / (1000 * 60 * 60 * 24)));
    if (lastUpdateDays > 30) {
      score -= 10;
    }
  } catch { }

  // 5. Risk Multiplier
  if (riskLevel === 'CRITICAL' && (diffDays === null || diffDays < 14 || progressPercent < 60)) {
    score -= 15;
  } else if (riskLevel === 'HIGH' && (diffDays === null || diffDays < 7 || progressPercent < 45)) {
    score -= 8;
  }

  // Bound score
  score = Math.max(0, Math.min(100, score));

  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  if (score >= 35) return 'At Risk';
  return 'Critical';
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Page Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const RecommendationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const refreshTimerRef = useRef<any>(null);
  
  // Modals visibility state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Form input states
  const [assignDueDate, setAssignDueDate] = useState('');
  const [progressVal, setProgressVal] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');
  const [progressStatus, setProgressStatus] = useState<RecommendationStatus>('UNDER_PROCESSING');
  
  const [statusVal, setStatusVal] = useState<RecommendationStatus>('UNDER_PROCESSING');
  const [statusNotes, setStatusNotes] = useState('');
  
  const [commentText, setCommentText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDesc, setEvidenceDesc] = useState('');

  // Comments tree list state
  const [commentsTree, setCommentsTree] = useState<any[]>([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [data, setData] = useState<any>(null);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'relationships' | 'analytics'>('timeline');

  const [riskMap, setRiskMap] = useState<Record<string, any>>({});

  const loadCommentsTree = async () => {
    try {
      const res = await apiFetch(`/recommendations/tracking/${id}/comments`);
      setCommentsTree(res || []);
    } catch (e) {
    }
  };

  const loadDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/recommendations/tracking/${id}`);
      setData(res);
      setProgressVal(res.progressPercent || 0);
      setProgressStatus(res.status || 'UNDER_PROCESSING');
      setStatusVal(res.status || 'UNDER_PROCESSING');

      // Fetch campaign details dynamically in the frontend to populate stakeholders without API change
      if (res.campaignId) {
        try {
          const campRes = await apiFetch(`/campaigns/${res.campaignId}`);
          setCampaignDetails(campRes);
        } catch (campErr) {

        }
      }

      await loadCommentsTree();
    } catch (e: any) {
      setError(e.message || 'فشل تحميل تفاصيل التوصية. ربما لا تملك صلاحية الوصول أو السجل غير موجود.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced loadDetails helper to throttle reload actions
  const debouncedLoadDetails = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      loadDetails();
    }, 1500);
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
    fetchRiskLevelOptions().then(opts => setRiskMap(getRiskLevelMap(opts))).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    // Join room for this recommendation
    socket.emit('join:recommendation', { recommendationId: id });

    const handleRecommendationUpdated = (_updatedData: any) => {
      debouncedLoadDetails();
    };

    const handleEscalationCreated = (_data: any) => {
      debouncedLoadDetails();
    };

    const handleReconnect = () => {
      socket.emit('join:recommendation', { recommendationId: id });
    };

    socket.on('recommendation:updated', handleRecommendationUpdated);
    socket.on('escalation:created', handleEscalationCreated);
    socket.on('connect', handleReconnect);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      socket.emit('leave:recommendation', { recommendationId: id });
      socket.off('recommendation:updated', handleRecommendationUpdated);
      socket.off('escalation:created', handleEscalationCreated);
      socket.off('connect', handleReconnect);
    };
  }, [socket, id]);

  const handleAssignRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      if (data?.status !== 'ISSUED') {
        throw new Error('هذه التوصية تمت إحالتها مسبقاً ولا تحتاج إلى تكليف أولي جديد.');
      }
      if (!(user?.role === 'ADMIN' || user?.role === 'EVALUATOR')) {
        throw new Error('غير مخول بإحالة أو تكليف هذه التوصية.');
      }
      if (!assignDueDate) {
        throw new Error('يرجى تحديد تاريخ استحقاق تنفيذ التوصية.');
      }

      await apiFetch(`/recommendations/tracking/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ dueDate: assignDueDate }),
      });
      setActionSuccess('تمت إحالة التوصية إلى الجهة المختصة بنجاح.');
      setShowAssignModal(false);
      setAssignDueDate('');
      await loadDetails();
    } catch (err: any) {
      setActionError(err.message || 'فشل إحالة أو تكليف التوصية');
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      if (data?.status === 'ISSUED') {
        throw new Error('هذه التوصية لم تُحال بعد. يرجى إحالتها إلى الجهة المختصة أولاً.');
      }
      const allowedTransitions = PROGRESS_TRANSITIONS[data?.status as RecommendationStatus] || [];
      if (!allowedTransitions.includes(progressStatus)) {
        throw new Error('لا يوجد انتقال صالح لتحديث تقدم التوصية من حالتها الحالية.');
      }
      if (progressStatus === 'COMPLETED') {
        if (progressVal !== 100) {
          throw new Error('يجب وضع نسبة الإنجاز 100% لإعلان اكتمال التوصية');
        }
        const currentEvCount = data.evidence ? data.evidence.length : 0;
        if (currentEvCount === 0) {
          throw new Error('يجب إرفاق ملف إثبات أو دليل واحد على الأقل لإعلان اكتمال التوصية');
        }
      }

      await apiFetch(`/recommendations/tracking/${id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          progressPercent: Number(progressVal),
          status: progressStatus,
          notes: progressNotes,
        }),
      });
      setActionSuccess('تم تحديث تقدم التوصية بنجاح.');
      setShowProgressModal(false);
      setProgressNotes('');
      await loadDetails();
    } catch (err: any) {
      setActionError(err.message || 'فشل تحديث التقدم');
    }
  };

  const handleVerifyClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      if (data?.status === 'ISSUED') {
        throw new Error('هذه التوصية لم تُحال بعد. يرجى إحالتها إلى الجهة المختصة أولاً.');
      }
      const allowedTransitions = VERIFY_TRANSITIONS[data?.status as RecommendationStatus] || [];
      if (!allowedTransitions.includes(statusVal)) {
        throw new Error('لا يوجد انتقال صالح لتغيير حالة التوصية من مرحلتها الحالية.');
      }
      if (data?.status === 'REJECTED' && statusVal === 'UNDER_PROCESSING' && user?.role !== 'ADMIN') {
        throw new Error('فقط المشرف يمكنه إعادة فتح توصية مرفوضة.');
      }
      await apiFetch(`/recommendations/tracking/${id}/verify-close`, {
        method: 'POST',
        body: JSON.stringify({
          resolutionStatus: statusVal,
          notes: statusNotes,
        }),
      });
      setActionSuccess('تم تغيير حالة التوصية وتوثيق الإجراء.');
      setShowStatusModal(false);
      setStatusNotes('');
      await loadDetails();
    } catch (err: any) {
      setActionError(err.message || 'فشل تغيير حالة التوصية');
    }
  };

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;

    try {
      await apiFetch(`/recommendations/tracking/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          notes: text,
          parentCommentId: parentId,
        }),
      });
      setActionSuccess(parentId ? 'تم إضافة الرد بنجاح.' : 'تم إضافة التعليق بنجاح.');
      if (parentId) {
        setReplyText('');
        setReplyToCommentId(null);
      } else {
        setCommentText('');
        setShowCommentModal(false);
      }
      await loadDetails();
    } catch (err: any) {
      setActionError(err.message || 'فشل إضافة التعليق');
    }
  };

  const handleEditComment = async (commentId: string) => {
    setActionError('');
    setActionSuccess('');
    if (!editingCommentText.trim()) return;

    try {
      await apiFetch(`/recommendations/tracking/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          commentText: editingCommentText,
        }),
      });
      setActionSuccess('تم تعديل التعليق بنجاح.');
      setEditingCommentId(null);
      setEditingCommentText('');
      await loadCommentsTree();
    } catch (err: any) {
      setActionError(err.message || 'فشل تعديل التعليق');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا التعليق؟')) return;
    setActionError('');
    setActionSuccess('');
    try {
      await apiFetch(`/recommendations/tracking/comments/${commentId}`, {
        method: 'DELETE',
      });
      setActionSuccess('تم حذف التعليق بنجاح.');
      await loadCommentsTree();
    } catch (err: any) {
      setActionError(err.message || 'فشل حذف التعليق');
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!evidenceFile) {
      setActionError('يجب اختيار ملف أولاً لرفعه');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (evidenceFile.size > maxSize) {
      setActionError('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميغابايت.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/zip',
      'application/x-zip-compressed'
    ];
    if (!allowedTypes.includes(evidenceFile.type) && !evidenceFile.name.endsWith('.docx') && !evidenceFile.name.endsWith('.doc') && !evidenceFile.name.endsWith('.zip')) {
      setActionError('صيغة الملف غير مدعومة. المسموح به: PDF, PNG, JPG, DOCX, ZIP');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('description', evidenceDesc);

      await api.post(`/recommendations/tracking/${id}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setActionSuccess('تم رفع دليل المعالجة بنجاح.');
      setShowEvidenceModal(false);
      setEvidenceFile(null);
      setEvidenceDesc('');
      await loadDetails();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'فشل رفع الملف';
      setActionError(Array.isArray(errMsg) ? errMsg.join(' | ') : errMsg);
    }
  };

  const renderCommentsList = (nodes: any[], depth = 0) => {
    return nodes.map((comment: any) => (
      <div 
        key={comment.id} 
        style={{ 
          marginRight: depth > 0 ? `${depth * 20}px` : '0', 
          borderRight: depth > 0 ? '2px solid #cbd5e0' : 'none',
          paddingRight: depth > 0 ? '12px' : '0',
          marginTop: '12px',
          marginBottom: '12px',
        }}
      >
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#0c2340' }}>
                👤 {comment.author?.fullName || comment.author?.username}
              </span>
              <span style={{ fontSize: '11px', color: '#718096', marginRight: '8px' }}>
                ({comment.author?.username})
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#a0aec0' }}>
              {formatTimeSince(comment.createdAt)}
            </span>
          </div>

          {editingCommentId === comment.id ? (
            <div style={{ marginTop: '10px' }}>
              <textarea
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '13px',
                  fontFamily: 'Cairo, sans-serif',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleEditComment(comment.id)}
                  style={{
                    backgroundColor: '#0c2340',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  حفظ التعديل
                </button>
                <button
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingCommentText('');
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: '#2d3748', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {comment.commentText}
            </p>
          )}

          {!comment.commentText.includes('تم حذف هذا التعليق بواسطة صاحبه') && editingCommentId !== comment.id && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '11.5px' }}>
              <button
                onClick={() => {
                  setReplyToCommentId(comment.id);
                  setReplyText('');
                }}
                style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', padding: 0, fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}
              >
                💬 رد
              </button>
              {(user?.role === 'ADMIN' || user?.id === comment.authorId) && (
                <>
                  <button
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditingCommentText(comment.commentText);
                    }}
                    style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', padding: 0, fontFamily: 'Cairo, sans-serif' }}
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 0, fontFamily: 'Cairo, sans-serif' }}
                  >
                    🗑️ حذف
                  </button>
                </>
              )}
            </div>
          )}

          {replyToCommentId === comment.id && (
            <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
              <textarea
                placeholder="اكتب ردك هنا..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '12.5px',
                  fontFamily: 'Cairo, sans-serif',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={(e) => handleAddComment(e, comment.id)}
                  style={{
                    backgroundColor: '#0c2340',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إرسال الرد
                </button>
                <button
                  onClick={() => setReplyToCommentId(null)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && renderCommentsList(comment.replies, depth + 1)}
      </div>
    ));
  };

  if (loading) {
    return (
      <div style={{ direction: 'rtl', padding: '30px', fontFamily: 'Cairo, sans-serif' }}>
        {/* Skeleton Breadcrumb */}
        <div style={{ height: '35px', width: '200px', backgroundColor: '#edf2f7', borderRadius: '8px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
        
        {/* Skeleton Executive Banner */}
        <div style={{ height: '140px', backgroundColor: '#edf2f7', borderRadius: '16px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
        
        {/* Skeleton Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ height: '180px', backgroundColor: '#edf2f7', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: '350px', backgroundColor: '#edf2f7', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ height: '140px', backgroundColor: '#edf2f7', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: '280px', backgroundColor: '#edf2f7', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.9} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ direction: 'rtl', padding: '60px 20px', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '50px 30px', borderTop: '5px solid #ef4444' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ color: '#0c2340', fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>غير مخول بالوصول أو السجل غير موجود</h2>
          <p style={{ color: '#718096', fontSize: '14px', lineHeight: 1.8, marginBottom: '24px' }}>
            {error || 'تفتقر إلى الأذونات اللازمة لعرض تفاصيل هذه التوصية الرقابية، أو أن المعرف المدخل غير صحيح.'}
          </p>
          <button onClick={() => navigate('/recommendations/tracking')} className="btn-outline" style={{ display: 'inline-flex', alignSelf: 'center', gap: '8px', fontSize: '13px' }}>
            ← الرجوع إلى مركز المتابعة
          </button>
        </div>
      </div>
    );
  }

  // Core indicators
  const statusCfg = STATUS_CONFIG[data.status as RecommendationStatus] || STATUS_CONFIG.ISSUED;
  const riskCfg = getRiskLevelDisplay(riskMap, data.riskLevel);
  const impactLabel = IMPACT_CONFIG[data.impactCategory]?.label || data.impactCategory;
  
  // Date calculations
  const diffDays = calculateDaysDiff(data.dueDate);
  const recAge = calculateDaysElapsed(data.issuedAt);
  const lastUpdateStr = formatTimeSince(data.updatedAt);
  
  const isOverdue = diffDays !== null && diffDays < 0 && data.status !== 'CLOSED' && data.status !== 'VERIFIED';
  
  // Lock checks and role verification
  const isLocked = (data.status === 'CLOSED' || data.status === 'VERIFIED') && user?.role !== 'ADMIN';
  
  const isCoordinator = user?.role === 'ADMIN' || user?.role === 'EVALUATOR' || user?.role === 'EDITOR' || 
    (data.assignedUserId === user?.id) || 
    (user?.department && data.assignedEntityNameSnapshot && (
      user.department.trim().toLowerCase() === data.assignedEntityNameSnapshot.trim().toLowerCase() ||
      data.assignedEntityNameSnapshot.trim().toLowerCase().includes(user.department.trim().toLowerCase()) ||
      user.department.trim().toLowerCase().includes(data.assignedEntityNameSnapshot.trim().toLowerCase())
    ));

  const currentStatus = data.status as RecommendationStatus;
  const progressTargets = PROGRESS_TRANSITIONS[currentStatus] || [];
  const verifyTargets = (VERIFY_TRANSITIONS[currentStatus] || []).filter(
    (target) => !(currentStatus === 'REJECTED' && target === 'UNDER_PROCESSING' && user?.role !== 'ADMIN'),
  );
  const canAssignIssued = currentStatus === 'ISSUED' && (user?.role === 'ADMIN' || user?.role === 'EVALUATOR');
  const canUpdateProgress = isCoordinator && !isLocked && progressTargets.length > 0;
  const canVerifyClose = (user?.role === 'ADMIN' || user?.role === 'EVALUATOR') && !isLocked && verifyTargets.length > 0;
  
  const remainingColor = (() => {
    if (data.status === 'CLOSED' || data.status === 'VERIFIED') return '#38a169';
    if (diffDays === null) return '#718096';
    if (diffDays < 0) return '#e53e3e';
    if (diffDays < 7) return '#dd6b20';
    return '#38a169';
  })();
  
  // Health score calculation
  const evidenceCount = data.evidence ? data.evidence.length : 0;
  const healthLabel = calculateHealthScore(
    data.progressPercent,
    data.dueDate,
    data.status as RecommendationStatus,
    evidenceCount,
    data.updatedAt,
    data.riskLevel
  );
  const healthCfg = HEALTH_CONFIG[healthLabel];

  // Stepper configurations
  const steps: { key: RecommendationStatus; label: string }[] = [
    { key: 'ISSUED', label: 'صادرة' },
    { key: 'FORWARDED', label: 'محالة للجهة' },
    { key: 'UNDER_PROCESSING', label: 'قيد المعالجة' },
    { key: 'COMPLETED', label: 'منجزة من الجهة' },
    { key: 'VERIFIED', label: 'تم التحقق' },
    { key: 'CLOSED', label: 'مغلقة ومعتمدة' },
  ];

  const getStepIndex = (status: RecommendationStatus): number => {
    switch (status) {
      case 'ISSUED': return 0;
      case 'FORWARDED': return 1;
      case 'UNDER_PROCESSING': return 2;
      case 'PARTIALLY_COMPLETED': return 2;
      case 'NEEDS_CLARIFICATION': return 2;
      case 'COMPLETED': return 3;
      case 'VERIFIED': return 4;
      case 'CLOSED': return 5;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(data.status as RecommendationStatus);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: '24px', fontFamily: 'Cairo, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Toast Alert Success */}
      {actionSuccess && (
        <div style={{
          backgroundColor: '#f0fff4',
          border: '1px solid #c6f6d5',
          borderRight: '6px solid #38a169',
          borderRadius: '12px',
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '13px', color: '#22543d', fontWeight: 700 }}>
            ✅ {actionSuccess}
          </span>
          <button 
            onClick={() => setActionSuccess('')}
            style={{ background: 'none', border: 'none', color: '#22543d', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/recommendations/tracking')}
          className="btn-outline"
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontSize: '13px',
            fontFamily: 'Cairo, sans-serif',
            padding: '8px 14px',
            borderColor: '#e2e8f0',
            backgroundColor: '#fff',
            color: '#4a5568',
            borderRadius: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          ← الرجوع إلى مركز المتابعة
        </button>

        <div style={{ fontSize: '13px', color: '#718096' }}>
          المتابعة الإلكترونية / تفاصيل التوصية <span style={{ color: '#0c2340', fontWeight: 700 }}>{data.recommendationNumber}</span>
        </div>
      </div>

      {/* 3. OVERDUE ALERT BANNER */}
      {isOverdue && (
        <div
          style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRight: '6px solid #e53e3e',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🚨</span>
            <div>
              <h4 style={{ margin: 0, color: '#c53030', fontWeight: 800, fontSize: '14.5px' }}>
                تنبيه أمني: تجاوز موعد الاستحقاق الرسمي للتوصية!
              </h4>
              <p style={{ margin: '4px 0 0', color: '#742a2a', fontSize: '12.5px', lineHeight: 1.5 }}>
                تجاوزت هذه التوصية تاريخ استحقاقها بمقدار <strong style={{ textDecoration: 'underline' }}>{Math.abs(diffDays || 0)} يوم</strong> دون إتمام إغلاقها. مستوى الخطورة: <strong>{riskCfg.label}</strong>.
              </p>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#9b2c2c', fontWeight: 700, backgroundColor: '#fed7d7', padding: '5px 12px', borderRadius: '6px' }}>
            تاريخ الاستحقاق الأصلي: {formatDate(data.dueDate)}
          </div>
        </div>
      )}

      {/* 1 & 2. EXECUTIVE SUMMARY BANNER */}
      <div
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          borderRight: `6px solid ${statusCfg.color}`,
          backgroundColor: '#fff',
          boxShadow: '0 4px 18px rgba(12,35,64,0.03)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'center' }}>
          
          {/* Identifiers */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c2340' }}>{data.recommendationNumber}</span>
              <span
                style={{
                  backgroundColor: riskCfg.bg,
                  color: riskCfg.color,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: `1px solid ${riskCfg.color}22`,
                }}
                title="مستوى خطورة التوصية الرقابية"
              >
                {riskCfg.icon} {riskCfg.label}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#4a5568' }}>
              🏛️ الجهة المسؤولة: <strong style={{ color: '#0c2340' }}>{data.assignedEntityNameSnapshot}</strong>
            </div>
          </div>

          {/* Health Score Indicator */}
          <div style={{ padding: '0 10px', borderRight: '1px solid #edf2f7', borderLeft: '1px solid #edf2f7' }}>
            <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px', fontWeight: 700 }}>❤️ مؤشر صحة التوصية (Health)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: healthCfg.color,
                  backgroundColor: healthCfg.bg,
                  border: `1px solid ${healthCfg.color}22`,
                }}
                title={healthCfg.desc}
              >
                <span>{healthCfg.icon}</span> {healthCfg.label}
              </span>
            </div>
          </div>

          {/* Progress Percent */}
          <div>
            <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px', fontWeight: 700 }}>📈 نسبة المعالجة والإنجاز</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.progressPercent}%`, backgroundColor: data.progressPercent < 40 ? '#e53e3e' : data.progressPercent < 80 ? '#dd6b20' : '#38a169', borderRadius: '10px' }} />
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0c2340' }}>{data.progressPercent}%</span>
            </div>
          </div>

          {/* Dates & Status */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px', fontWeight: 700 }}>الحالة</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, color: statusCfg.color, backgroundColor: statusCfg.bg }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px', fontWeight: 700 }}>تاريخ الاستحقاق</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: isOverdue ? '#e53e3e' : '#0c2340' }}>
                {formatDate(data.dueDate)}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Layout Grid: 70% Content (Right) / 30% Sidebar (Left) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        
        {/* MAIN CONTENT (70%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 68%', minWidth: '320px' }}>
          
          {/* SECTION 3: RECOMMENDATION LIFECYCLE */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ color: '#0c2340', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '24px' }}>
              📋 دورة حياة التوصية الرقابية ومراحلها
            </h3>

            {/* Stepper Grid */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 20px', position: 'relative', overflowX: 'auto' }}>
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const circleBg = isCurrent ? '#0c2340' : isPassed ? '#38a169' : '#edf2f7';
                const circleColor = isCurrent || isPassed ? '#fff' : '#a0aec0';
                const lineBg = isPassed ? '#38a169' : isCurrent ? 'rgba(12,35,64,0.3)' : '#edf2f7';

                return (
                  <React.Fragment key={step.key}>
                    {/* Circle Node */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, minWidth: '85px', position: 'relative' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: circleBg,
                          color: circleColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'all 0.3s',
                          border: isCurrent ? '4px solid rgba(12,35,64,0.15)' : 'none',
                          boxShadow: isCurrent ? '0 4px 10px rgba(12,35,64,0.2)' : 'none',
                        }}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? '#0c2340' : isPassed ? '#38a169' : '#718096',
                          marginTop: '10px',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}
                      >
                        {step.label}
                      </span>
                    </div>

                    {/* Step Link Line */}
                    {idx < steps.length - 1 && (
                      <div
                        style={{
                          height: '3px',
                          backgroundColor: lineBg,
                          flex: 1,
                          margin: '0 -15px',
                          alignSelf: 'flex-start',
                          marginTop: '18px',
                          zIndex: 1,
                          minWidth: '20px',
                          transition: 'all 0.3s',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Stepper info details footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
                padding: '12px 18px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#4a5568',
                marginTop: '10px',
              }}
            >
              <div>
                📅 دخلت المرحلة الحالية في: <strong style={{ color: '#0c2340' }}>{formatDate(data.updatedAt)}</strong>
              </div>
              <div>
                🔄 آخر تحديث للنظام: <strong style={{ color: '#0c2340' }}>{formatTimeSince(data.updatedAt)}</strong>
              </div>
            </div>
          </div>

          {/* 6. EXPANDABLE FUTURE TAB ARCHITECTURE */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            
            {/* Tab header buttons */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #edf2f7', paddingBottom: '1px', marginBottom: '20px' }}>
              <button
                onClick={() => setActiveTab('timeline')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'timeline' ? '3px solid #0c2340' : '3px solid transparent',
                  color: activeTab === 'timeline' ? '#0c2340' : '#718096',
                  fontWeight: activeTab === 'timeline' ? 800 : 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                📜 سجل المتابعة والجدول الزمني (Timeline)
              </button>

              <button
                onClick={() => setActiveTab('relationships')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'relationships' ? '3px solid #0c2340' : '3px solid transparent',
                  color: activeTab === 'relationships' ? '#0c2340' : '#718096',
                  fontWeight: activeTab === 'relationships' ? 800 : 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                🔗 التوصيات المرتبطة والعلاقات (Relationships)
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'analytics' ? '3px solid #0c2340' : '3px solid transparent',
                  color: activeTab === 'analytics' ? '#0c2340' : '#718096',
                  fontWeight: activeTab === 'analytics' ? 800 : 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                📊 سجل الإنجاز والتحليلات (Charts & Analytics)
              </button>
            </div>

            {/* TAB CONTENT 1: UNIFIED TIMELINE */}
            {activeTab === 'timeline' && (
              <div>
                <RecommendationTimeline trackingId={id!} />

                {/* Comments Section */}
                <div style={{ marginTop: '40px', borderTop: '2px solid #edf2f7', paddingTop: '24px' }}>
                  <h3 style={{ color: '#0c2340', fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>
                    💬 قسم النقاشات والتعليقات التفاعلية
                  </h3>
                  
                  {/* Top New Comment Box */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12.5px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>إضافة تعليق جديد على التوصية:</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <textarea
                        placeholder="اكتب تفاصيل تعليقك أو استفسارك هنا..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        style={{
                          flex: 1,
                          minHeight: '70px',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e0',
                          fontSize: '13px',
                          fontFamily: 'Cairo, sans-serif',
                          backgroundColor: '#fff',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button
                        onClick={(e) => handleAddComment(e, null)}
                        disabled={!commentText.trim()}
                        style={{
                          backgroundColor: commentText.trim() ? '#0c2340' : '#a0aec0',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                          fontFamily: 'Cairo, sans-serif',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        نشر التعليق 📤
                      </button>
                    </div>
                  </div>

                  {/* Render Tree */}
                  {commentsTree.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#a0aec0', fontSize: '13px', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                      💬 لا توجد نقاشات مسجلة بعد. كن أول من يضيف تعليقاً!
                    </div>
                  ) : (
                    <div>
                      {renderCommentsList(commentsTree)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: RELATED RECOMMENDATIONS MOCKUP */}
            {activeTab === 'relationships' && (
              <div style={{ padding: '10px 0' }}>
                <h4 style={{ color: '#0c2340', fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>🔗 شجرة العلاقات والارتباطات بين التوصيات الرقابية</h4>
                <p style={{ color: '#718096', fontSize: '12.5px', marginBottom: '20px', lineHeight: 1.6 }}>
                  يوضح هذا المخطط التفاعلي الترابط الهيكلي بين التوصية الحالية وبقية التوصيات المشتقة من الحملة التفتيشية أو التقارير السنوية المشابهة لتجنب تكرار الإجراءات.
                </p>

                {/* Simulated interactive tree hierarchy */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
                  
                  {/* Parent Recommendation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📁</span>
                    <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e0', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px' }}>
                      <span style={{ color: '#718096', marginLeft: '6px' }}>التوصية الأم:</span>
                      <strong style={{ color: '#0c2340' }}>
                        {data.recommendation?.parentRecId ? 'توصية تفتيشية رئيسية' : 'توصية مستقلة (لا توجد توصية أم)'}
                      </strong>
                    </div>
                  </div>

                  {/* Connecting Line symbol */}
                  <div style={{ marginRight: '10px', borderRight: '2px dashed #a0aec0', height: '24px', margin: '4px 9px 4px 0' }} />

                  {/* Current Active Recommendation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>🎯</span>
                    <div style={{ backgroundColor: '#fff', border: '2px solid #0c2340', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', boxShadow: '0 4px 10px rgba(12,35,64,0.05)' }}>
                      <span style={{ color: '#718096', marginLeft: '6px' }}>التوصية الحالية:</span>
                      <strong style={{ color: '#0c2340' }}>{data.recommendationNumber}</strong>
                      <span style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Connecting Line symbol */}
                  <div style={{ marginRight: '10px', borderRight: '2px dashed #a0aec0', height: '24px', margin: '4px 9px 4px 0' }} />

                  {/* Child Recommendations Mock */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>📄</span>
                      <div style={{ backgroundColor: '#fff', border: '1px dashed #cbd5e0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#718096' }}>
                        توصية فرعية مشتقة: <strong>REC-2025-000001-A</strong> (قيد الإنشاء للربط التقني)
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>📄</span>
                      <div style={{ backgroundColor: '#fff', border: '1px dashed #cbd5e0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#718096' }}>
                        توصية فرعية مشتقة: <strong>REC-2025-000001-B</strong> (قيد الإنشاء للربط التقني)
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: '#718096' }}>
                    💡 <span>سيتم إتاحة الربط الديناميكي للتوصيات وتحديد العلاقات المشتقة برمجياً في المراحل القادمة.</span>
                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PROGRESS CHARTS & ANALYTICS MOCKUP */}
            {activeTab === 'analytics' && (
              <div style={{ padding: '10px 0' }}>
                <h4 style={{ color: '#0c2340', fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>📊 الرسوم البيانية لسجل إنجاز التوصية والتحليلات المتقدمة</h4>
                <p style={{ color: '#718096', fontSize: '12.5px', marginBottom: '20px', lineHeight: 1.6 }}>
                  رسم بياني يوضح المسار التاريخي لتقدم نسبة الإنجاز والمهل الزمنية للتوصية منذ تاريخ إصدارها حتى اليوم.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'center' }}>
                  
                  {/* Analytic KPIs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>درجة الالتزام الإجمالية (Adherence)</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#38a169', marginTop: '4px' }}>92.5%</div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>معدل سرعة معالجة التوصية</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#3182ce', marginTop: '4px' }}>طبيعي (Normal)</div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>درجة مخاطر التأخير</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: isOverdue ? '#e53e3e' : '#38a169', marginTop: '4px' }}>
                        {isOverdue ? 'حرجة (High)' : 'منخفضة (Low)'}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic CSS/SVG simulated progress chart */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                    <div style={{ height: '150px', position: 'relative', borderLeft: '2px solid #cbd5e0', borderBottom: '2px solid #cbd5e0', padding: '10px' }}>
                      
                      {/* Grid lines */}
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed #edf2f7', fontSize: '9px', color: '#a0aec0', textAlign: 'left', paddingRight: '4px' }}>75%</div>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed #edf2f7', fontSize: '9px', color: '#a0aec0', textAlign: 'left', paddingRight: '4px' }}>50%</div>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed #edf2f7', fontSize: '9px', color: '#a0aec0', textAlign: 'left', paddingRight: '4px' }}>25%</div>

                      {/* SVG Line path for progress points */}
                      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                        <polyline
                          fill="none"
                          stroke="#0c2340"
                          strokeWidth="3"
                          points={`0,130 50,110 100,90 150,70 200,${150 - (data.progressPercent * 1.3)}`}
                        />
                        {/* Interactive dots */}
                        <circle cx="0" cy="130" r="4" fill="#d4af37" />
                        <circle cx="50" cy="110" r="4" fill="#d4af37" />
                        <circle cx="100" cy="90" r="4" fill="#d4af37" />
                        <circle cx="150" cy="70" r="4" fill="#d4af37" />
                        <circle cx="200" cy={150 - (data.progressPercent * 1.3)} r="6" fill="#0c2340" />
                      </svg>

                      {/* X-axis indicators */}
                      <div style={{ position: 'absolute', bottom: '-20px', left: '0%', fontSize: '9px', color: '#718096' }}>الإصدار</div>
                      <div style={{ position: 'absolute', bottom: '-20px', left: '50%', fontSize: '9px', color: '#718096' }}>التقدم</div>
                      <div style={{ position: 'absolute', bottom: '-20px', right: '0%', fontSize: '9px', color: '#718096', fontWeight: 800 }}>الحالي ({data.progressPercent}%)</div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* SECTION 7: QUICK ACTIONS PANEL */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ color: '#0c2340', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              ⚙️ لوحة الإجراءات السريعة والمتابعة
            </h3>
            <p style={{ color: '#718096', fontSize: '12.5px', marginBottom: '16px', lineHeight: 1.5 }}>
              يمكنك تحديث حالة التوصية أو إرفاق أدلة المعالجة الميدانية بناءً على الصلاحيات الممنوحة لدوركم في النظام:
            </p>

            {currentStatus === 'ISSUED' && (
              <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#9a3412', fontSize: '12.5px', fontWeight: 700 }}>
                هذه التوصية لم تُحال بعد. يرجى إحالتها إلى الجهة المختصة أولاً.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {currentStatus === 'ISSUED' ? (
                <button
                  onClick={() => {
                    setAssignDueDate('');
                    setActionError('');
                    setShowAssignModal(true);
                  }}
                  disabled={!canAssignIssued}
                  className="btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    padding: '12px',
                    backgroundColor: canAssignIssued ? '#fff' : '#f8fafc',
                    opacity: canAssignIssued ? 1 : 0.5,
                    cursor: canAssignIssued ? 'pointer' : 'not-allowed',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                  title="إحالة التوصية إلى الجهة المختصة وتحديد تاريخ الاستحقاق"
                >
                  📤 إحالة / تكليف التوصية
                </button>
              ) : (
                <>
              <button
                onClick={() => {
                  if (!canVerifyClose) return;
                  setStatusVal(verifyTargets[0]);
                  setShowStatusModal(true);
                }}
                disabled={!canVerifyClose}
                className="btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  padding: '12px',
                  backgroundColor: canVerifyClose ? '#fff' : '#f8fafc',
                  opacity: canVerifyClose ? 1 : 0.5,
                  cursor: canVerifyClose ? 'pointer' : 'not-allowed',
                  fontFamily: 'Cairo, sans-serif',
                }}
                title={isLocked ? "مغلقة ومعتمدة (مغلق لغير المشرف)" : "تغيير حالة التوصية والمطابقة"}
              >
                🔄 تغيير حالة التوصية
              </button>

              <button
                onClick={() => {
                  if (!canUpdateProgress) return;
                  setProgressVal(data.progressPercent || 0);
                  setProgressStatus(progressTargets[0]);
                  setShowProgressModal(true);
                }}
                disabled={!canUpdateProgress}
                className="btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  padding: '12px',
                  backgroundColor: canUpdateProgress ? '#fff' : '#f8fafc',
                  opacity: canUpdateProgress ? 1 : 0.5,
                  cursor: canUpdateProgress ? 'pointer' : 'not-allowed',
                  fontFamily: 'Cairo, sans-serif',
                }}
                title={isLocked ? "مغلقة ومعتمدة (مغلق لغير المشرف)" : "تحديث نسبة الإنجاز والتقدم"}
              >
                📈 تحديث نسبة التقدم
              </button>
                </>
              )}

              <button
                onClick={() => {
                  setCommentText('');
                  setShowCommentModal(true);
                }}
                className="btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  padding: '12px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif',
                }}
                title="إضافة تعليق جديد على التوصية"
              >
                💬 إضافة تعليق
              </button>

              <button
                onClick={() => {
                  setEvidenceFile(null);
                  setEvidenceDesc('');
                  setShowEvidenceModal(true);
                }}
                disabled={!isCoordinator || isLocked}
                className="btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  padding: '12px',
                  backgroundColor: isCoordinator && !isLocked ? '#fff' : '#f8fafc',
                  opacity: isCoordinator && !isLocked ? 1 : 0.5,
                  cursor: isCoordinator && !isLocked ? 'pointer' : 'not-allowed',
                  fontFamily: 'Cairo, sans-serif',
                }}
                title={isLocked ? "مغلقة ومعتمدة (مغلق لغير المشرف)" : "رفع دليل إثبات معالجة"}
              >
                📎 رفع دليل إثبات
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR (30%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 28%', minWidth: '300px' }}>
          
          {/* TEMPORAL INDICATORS CARD */}
          <div
            className="card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              borderTop: '4px solid #0c2340',
            }}
          >
            <h4 style={{ color: '#0c2340', fontSize: '13.5px', fontWeight: 800, marginBottom: '14px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              ⏱️ مؤشرات قياس الفترات الزمنية
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#718096' }}>عمر التوصية الرقابية:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0c2340', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                  {recAge}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#718096' }}>منذ آخر تحديث للنظام:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ca8a04', backgroundColor: 'rgba(202,138,4,0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                  {lastUpdateStr}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#718096' }}>الأيام المتبقية للاستحقاق:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: remainingColor, backgroundColor: `${remainingColor}11`, padding: '3px 8px', borderRadius: '6px' }}>
                  {diffDays !== null ? `${Math.abs(diffDays)} يوم` : 'غير محدد'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. STAKEHOLDERS INFORMATION CARD */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h4 style={{ color: '#0c2340', fontSize: '13.5px', fontWeight: 800, marginBottom: '12px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              👥 الأطراف المعنية بالتوصية (Stakeholders)
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: '#4a5568' }}>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', marginBottom: '2px' }}>الجهة المصدرة للتوصية:</span>
                <strong style={{ color: '#0c2340' }}>{data.recommendation?.authorityName || 'غير محدد'}</strong>
              </div>

              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', marginBottom: '2px' }}>الجهة المسؤولة عن التنفيذ والمعالجة:</span>
                <strong style={{ color: '#0c2340' }}>{data.assignedEntityNameSnapshot}</strong>
              </div>

              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '11px', marginBottom: '2px' }}>الجهة المكلفة بمتابعة التنفيذ:</span>
                <strong style={{ color: '#0c2340' }}>هيئة تفتيش قوى الأمن الداخلي - مديرية المتابعة والتقييم</strong>
              </div>

              {campaignDetails && (
                <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: '10px', marginTop: '6px' }}>
                  <span style={{ color: '#718096', display: 'block', fontSize: '11px', marginBottom: '4px' }}>اللجنة / المفتش المصدر للتوصية:</span>
                  <div style={{ fontSize: '12px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <div>👑 <strong>رئيس اللجنة:</strong> {campaignDetails.leader?.fullName || 'غير محدد'}</div>
                    <div style={{ marginTop: '4px' }}>👤 <strong>المعاون/المقرر:</strong> {campaignDetails.deputy?.fullName || 'غير محدد'}</div>
                    {campaignDetails.members && campaignDetails.members.length > 0 && (
                      <div style={{ marginTop: '6px', borderTop: '1px solid #edf2f7', paddingTop: '6px' }}>
                        <strong style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '2px' }}>أعضاء اللجنة المشاركين:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {campaignDetails.members.map((m: any) => (
                            <span key={m.inspectorId} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                              {m.inspector?.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: ORIGINAL RECOMMENDATION INFORMATION */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h4 style={{ color: '#0c2340', fontSize: '13.5px', fontWeight: 800, marginBottom: '12px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              📌 بيانات التوصية الأصلية المعتمدة
            </h4>

            {/* Rec Text quotation block */}
            <div
              style={{
                backgroundColor: 'rgba(12,35,64,0.02)',
                borderRight: '4px solid #d4af37',
                padding: '12px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#2d3748',
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              « {data.recommendation?.recommendationText || '—'} »
            </div>

            {/* Key details list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#4a5568' }}>
              <div>
                <span style={{ color: '#718096' }}>سلطة الاعتماد:</span> <strong style={{ color: '#2d3748' }}>{data.recommendation?.authorityName || 'غير محدد'}</strong>
              </div>
              <div>
                <span style={{ color: '#718096' }}>الحملة التفتيشية:</span> <strong style={{ color: '#2d3748' }}>{data.campaign?.name || 'غير محدد'}</strong>
              </div>
              {data.campaign?.formationNumber && (
                <div>
                  <span style={{ color: '#718096' }}>رقم تشكيل اللجنة:</span> <strong style={{ color: '#2d3748' }}>{data.campaign.formationNumber}</strong>
                </div>
              )}
              {data.campaign?.assignmentReference && (
                <div>
                  <span style={{ color: '#718096' }}>مرجع التكليف الرسمي:</span> <strong style={{ color: '#2d3748' }}>{data.campaign.assignmentReference}</strong>
                </div>
              )}
              <div>
                <span style={{ color: '#718096' }}>تصنيف مجال الأثر:</span> <strong style={{ color: '#2d3748' }}>{impactLabel}</strong>
              </div>
              
              {/* Risk Indicator Card */}
              <div>
                <span style={{ color: '#718096' }}>مستوى المخاطر:</span>
                <span
                  style={{
                    backgroundColor: riskCfg.bg,
                    color: riskCfg.color,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginRight: '6px',
                    border: `1px solid ${riskCfg.color}22`,
                  }}
                >
                  {riskCfg.icon} {riskCfg.label}
                </span>
              </div>

              <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#718096' }}>تاريخ الإصدار الأولي:</span> <strong style={{ color: '#2d3748' }}>{formatDate(data.issuedAt)}</strong>
              </div>
              <div>
                <span style={{ color: '#718096' }}>تاريخ الاستحقاق المحدد:</span> <strong style={{ color: '#2d3748' }}>{formatDate(data.dueDate)}</strong>
              </div>
              <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#718096' }}>الموظف المكلف بالمتابعة:</span> <strong style={{ color: '#2d3748' }}>{data.assignedUser?.fullName || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#718096' }}>جهة التنفيذ (اللقطة):</span> <strong style={{ color: '#2d3748' }}>{data.assignedEntityNameSnapshot}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 5: PROGRESS INFORMATION */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h4 style={{ color: '#0c2340', fontSize: '13.5px', fontWeight: 800, marginBottom: '12px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              📈 حالة تقدم إجراءات المعالجة
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: '#718096', fontSize: '12px' }}>نسبة التقدم الحالية:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#edf2f7', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.progressPercent}%`, height: '100%', backgroundColor: '#0c2340', borderRadius: '999px' }} />
                  </div>
                  <strong style={{ color: '#0c2340' }}>{data.progressPercent}%</strong>
                </div>
              </div>

              <div>
                <span style={{ color: '#718096', fontSize: '12px' }}>تاريخ آخر تحديث للإنجاز:</span>
                <div style={{ fontWeight: 700, color: '#2d3748', marginTop: '2px' }}>
                  {formatDate(data.updatedAt)} ({formatTimeSince(data.updatedAt)})
                </div>
              </div>

              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#718096', fontSize: '12px' }}>ملاحظات ومستجدات المعالجة:</span>
                <div style={{ fontSize: '12px', color: '#4a5568', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', marginTop: '4px', lineHeight: 1.5 }}>
                  {data.progressNotes || 'لا توجد ملاحظات تفصيلية مدونة لنسبة التقدم الحالية.'}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: EVIDENCE SUMMARY */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h4 style={{ color: '#0c2340', fontSize: '13.5px', fontWeight: 800, marginBottom: '12px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              📎 الوثائق والمستندات الثبوتية المرفقة
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#718096' }}>عدد ملفات الإثبات المرفقة:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0c2340', backgroundColor: 'rgba(12,35,64,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                  {evidenceCount} ملفات
                </span>
              </div>

              {/* Latest evidence file info */}
              {data.evidence && data.evidence.length > 0 ? (
                <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#718096' }}>أحدث مستند ثبوتي تم رفعه:</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#f1f5f9',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      marginTop: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <strong style={{ color: '#0c2340', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }} title={data.evidence[0].fileName}>
                        {data.evidence[0].fileName}
                      </strong>
                      <span style={{ fontSize: '10px', color: '#718096' }}>
                        بواسطة: {data.evidence[0].uploadedBy?.fullName || '—'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#718096', marginTop: '4px', textAlign: 'left' }}>
                    تاريخ الرفع: {formatDate(data.evidence[0].createdAt)}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#a0aec0', textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                  📂 لم يتم تحميل أي مستندات ثبوتية بعد.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ASSIGN ISSUED RECOMMENDATION MODAL */}
      {showAssignModal && currentStatus === 'ISSUED' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12,35,64,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
        }}>
          <div className="card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: 'none' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0c2340', fontWeight: 800, fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              📤 إحالة / تكليف التوصية
            </h3>

            <form onSubmit={handleAssignRecommendation}>
              <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '12.5px' }}>
                <div style={{ marginBottom: '4px', color: '#718096' }}>الجهة المختصة الحالية:</div>
                <strong style={{ color: '#0c2340' }}>{data.assignedEntityNameSnapshot || 'الجهة المسجلة في التوصية'}</strong>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  تاريخ استحقاق التنفيذ:
                </label>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e0',
                    fontSize: '13px',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
              </div>

              {actionError && (
                <div style={{ color: '#e53e3e', fontSize: '12px', marginBottom: '12px', backgroundColor: '#fff5f5', padding: '8px', borderRadius: '6px' }}>
                  ⚠️ {actionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{ backgroundColor: '#0c2340', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
                >
                  تأكيد الإحالة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignDueDate('');
                    setActionError('');
                  }}
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PROGRESS MODAL */}
      {showProgressModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12,35,64,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
        }}>
          <div className="card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: 'none' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0c2340', fontWeight: 800, fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              📈 تحديث نسبة التقدم وإجراءات المعالجة
            </h3>
            
            <form onSubmit={handleUpdateProgress}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  نسبة الإنجاز الحالية: {progressVal}%
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    style={{ flex: 1, cursor: 'pointer' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Math.max(0, Math.min(100, Number(e.target.value))))}
                    style={{
                      width: '65px',
                      padding: '6px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      fontSize: '13px',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  الحالة التشغيلية للتوصية:
                </label>
                {(function renderProgressOptions() {
                  const current = data.status as string;
                  const optionsMap: Record<string, { value: string; label: string }[]> = {
                    FORWARDED: [
                      { value: 'UNDER_PROCESSING', label: 'قيد المعالجة (Under Processing)' },
                    ],
                    UNDER_PROCESSING: [
                      { value: 'PARTIALLY_COMPLETED', label: 'منجزة جزئياً (Partially Completed)' },
                      { value: 'COMPLETED', label: 'منجزة من الجهة (Completed - 100%)' },
                      { value: 'NEEDS_CLARIFICATION', label: 'بحاجة لتوضيح (Needs Clarification)' },
                    ],
                    PARTIALLY_COMPLETED: [
                      { value: 'UNDER_PROCESSING', label: 'قيد المعالجة (Under Processing)' },
                      { value: 'COMPLETED', label: 'منجزة من الجهة (Completed - 100%)' },
                    ],
                    NEEDS_CLARIFICATION: [
                      { value: 'UNDER_PROCESSING', label: 'قيد المعالجة (Under Processing)' },
                      { value: 'COMPLETED', label: 'منجزة من الجهة (Completed - 100%)' },
                    ],
                  };

                  const options = optionsMap[current] || [];

                  return (
                    <select
                      value={options.some(o => o.value === progressStatus) ? progressStatus : (options[0]?.value || '')}
                      onChange={(e) => setProgressStatus(e.target.value as RecommendationStatus)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e0',
                        fontSize: '13px',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      {options.length > 0 ? (
                        options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))
                      ) : (
                        <option value="">— لا يمكن تغيير الحالة من هذه المرحلة —</option>
                      )}
                    </select>
                  );
                })()}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  تفاصيل الإجراء المنجز والمستجدات:
                </label>
                <textarea
                  required
                  placeholder="يرجى كتابة شرح وافٍ عن الإجراءات المتخذة لمعالجة الملاحظة الرقابية..."
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '90px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e0',
                    fontSize: '13px',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
              </div>

              {actionError && (
                <div style={{ color: '#e53e3e', fontSize: '12px', marginBottom: '12px', backgroundColor: '#fff5f5', padding: '8px', borderRadius: '6px' }}>
                  ⚠️ {actionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0c2340',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  تحديث التقدم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProgressModal(false);
                    setActionError('');
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {showStatusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12,35,64,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
        }}>
          <div className="card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: 'none' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0c2340', fontWeight: 800, fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              🔄 تدقيق ومطابقة التوصية وتغيير الحالة المعززة
            </h3>
            
            <form onSubmit={handleVerifyClose}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  الحالة المستهدفة للتدقيق والمطابقة:
                </label>
                {(function renderStatusOptions() {
                  const current = data.status as string;
                  let options: { value: string; label: string }[] = [];

                  if (current === 'COMPLETED') {
                    options = [
                      { value: 'VERIFIED', label: 'تم التحقق الميداني (Verified)' },
                      { value: 'REJECTED', label: 'مرفوضة وغير مستوفية للشروط (Rejected)' },
                      { value: 'NEEDS_CLARIFICATION', label: 'بحاجة لتوضيح وإعادة صياغة (Needs Clarification)' },
                    ];
                  } else if (current === 'VERIFIED') {
                    options = [
                      { value: 'CLOSED', label: 'مغلقة ومعتمدة رسمياً (Closed)' },
                    ];
                  } else if (current === 'REJECTED' && user?.role === 'ADMIN') {
                    options = [
                      { value: 'UNDER_PROCESSING', label: 'إعادة فتحها قيد المعالجة (Under Processing)' },
                    ];
                  } else if (current === 'REJECTED') {
                    options = [
                      { value: '', label: '— الحالة نهائية، لا يمكن تغييرها —' },
                    ];
                  } else if (current === 'NEEDS_CLARIFICATION') {
                    options = [
                      { value: 'COMPLETED', label: 'منجزة من الجهة (Completed)' },
                      { value: 'UNDER_PROCESSING', label: 'قيد المعالجة (Under Processing)' },
                      { value: 'REJECTED', label: 'مرفوضة (Rejected)' },
                    ];
                  } else {
                    options = [
                      { value: '', label: '— لا يمكن تغيير الحالة من هذه المرحلة —' },
                    ];
                  }

                  return (
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value as RecommendationStatus)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e0',
                        fontSize: '13px',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      {options.map(opt => (
                        <option key={opt.value} value={opt.value} disabled={!opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  توجيهات المفتش ومبررات القرار:
                </label>
                <textarea
                  required
                  placeholder="يرجى كتابة رأي لجنة التدقيق والمبررات الإدارية لتغيير الحالة..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '90px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e0',
                    fontSize: '13px',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
              </div>

              {actionError && (
                <div style={{ color: '#e53e3e', fontSize: '12px', marginBottom: '12px', backgroundColor: '#fff5f5', padding: '8px', borderRadius: '6px' }}>
                  ⚠️ {actionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0c2340',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  تغيير الحالة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setActionError('');
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD COMMENT MODAL */}
      {showCommentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12,35,64,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
        }}>
          <div className="card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: 'none' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0c2340', fontWeight: 800, fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              💬 إضافة تعليق أو استفسار جديد للتوصية
            </h3>
            
            <form onSubmit={(e) => handleAddComment(e, null)}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  موضوع أو نص التعليق:
                </label>
                <textarea
                  required
                  placeholder="اكتب نص تعليقك الإداري بالتفصيل هنا..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e0',
                    fontSize: '13px',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
              </div>

              {actionError && (
                <div style={{ color: '#e53e3e', fontSize: '12px', marginBottom: '12px', backgroundColor: '#fff5f5', padding: '8px', borderRadius: '6px' }}>
                  ⚠️ {actionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0c2340',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  نشر التعليق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentModal(false);
                    setActionError('');
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {showEvidenceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12,35,64,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
        }}>
          <div className="card" style={{ width: '450px', padding: '24px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: 'none' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0c2340', fontWeight: 800, fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              📎 رفع مستند أو دليل إثبات معالجة
            </h3>
            
            <form onSubmit={handleUploadEvidence}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  اختر الملف الثبوتي (PDF, PNG, JPG, DOCX, ZIP):
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.zip"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e0',
                    fontSize: '13px',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
                <span style={{ fontSize: '10.5px', color: '#718096', display: 'block', marginTop: '4px' }}>
                  الحد الأقصى لحجم الملف هو 10 ميغابايت.
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '8px', fontWeight: 700 }}>
                  وصف مختصر للمرفق أو الدليل:
                </label>
                <input
                  type="text"
                  placeholder="مثال: كتاب وزارة الداخلية رقم 102 لتثبيت التوصية..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e0',
                    fontSize: '13px',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
              </div>

              {actionError && (
                <div style={{ color: '#e53e3e', fontSize: '12px', marginBottom: '12px', backgroundColor: '#fff5f5', padding: '8px', borderRadius: '6px' }}>
                  ⚠️ {actionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0c2340',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  رفع الملف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setActionError('');
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
