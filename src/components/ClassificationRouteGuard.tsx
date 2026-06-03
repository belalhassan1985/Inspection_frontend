import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ClassificationRouteGuardProps {
  requiredLevel: 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  forbiddenRoles?: string[];
  children: React.ReactNode;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  RESTRICTED: 'محدود / مقيد (Restricted)',
  CONFIDENTIAL: 'سري (Confidential)',
  SECRET: 'سري للغاية (Secret)',
  TOP_SECRET: 'سري للغاية وممتاز (Top Secret)',
};

export const ClassificationRouteGuard: React.FC<ClassificationRouteGuardProps> = ({
  requiredLevel,
  forbiddenRoles,
  children,
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // ADMIN bypasses all security classification levels and restrictions
  if (user.role === 'ADMIN') {
    return <>{children}</>;
  }

  if (forbiddenRoles && forbiddenRoles.includes(user.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '60vh',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px 30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '50%',
            backgroundColor: '#fff5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            color: '#e53e3e',
            border: '2px dashed #fed7d7',
          }}>
            🚫
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#0c2340',
            margin: 0,
          }}>
            دخول غير مصرح به للدور الإداري
          </h2>
          <p style={{
            fontSize: '14.5px',
            color: '#4a5568',
            lineHeight: 1.6,
            margin: 0,
          }}>
            عذراً، نوع حسابك الإداري لا يملك الصلاحية للوصول إلى هذه الشاشة أو البيانات التحليلية.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: '#f7fafc',
            padding: '15px 20px',
            borderRadius: '10px',
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '13.5px',
            color: '#4a5568',
            textAlign: 'right',
            borderRight: '4px solid #e53e3e',
          }}>
            <div>• دورك الإداري الحالي: <strong>{user.role}</strong></div>
            <div>• القيود: <strong>غير مصرح لهذا الدور بالدخول</strong></div>
          </div>
        </div>
      </div>
    );
  }

  const weights = {
    RESTRICTED: 1,
    CONFIDENTIAL: 2,
    SECRET: 3,
    TOP_SECRET: 4,
  };

  const userLevel = (user.securityClassification || 'RESTRICTED') as keyof typeof weights;
  const userWeight = weights[userLevel] || 1;
  const requiredWeight = weights[requiredLevel] || 1;

  if (userWeight < requiredWeight) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '60vh',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px 30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '50%',
            backgroundColor: '#fff5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            color: '#e53e3e',
            border: '2px dashed #fed7d7',
          }}>
            🛡️
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#0c2340',
            margin: 0,
          }}>
            وصول غير مصرح به
          </h2>
          <p style={{
            fontSize: '14.5px',
            color: '#4a5568',
            lineHeight: 1.6,
            margin: 0,
          }}>
            عذراً، لا تمتلك الصلاحية الأمنية الكافية لاستعراض هذه الشاشة أو البيانات التحليلية. تتطلب هذه الصفحة تصنيفاً أمنياً بمستوى <strong>{CLASSIFICATION_LABELS[requiredLevel] || requiredLevel}</strong> أو أعلى.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: '#f7fafc',
            padding: '15px 20px',
            borderRadius: '10px',
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '13.5px',
            color: '#4a5568',
            textAlign: 'right',
            borderRight: '4px solid #e53e3e',
          }}>
            <div>• تصنيفك الأمني الحالي: <strong>{CLASSIFICATION_LABELS[userLevel] || userLevel}</strong></div>
            <div>• التصنيف المطلوب للدخول: <strong>{CLASSIFICATION_LABELS[requiredLevel] || requiredLevel}</strong></div>
          </div>
          <p style={{
            fontSize: '12px',
            color: '#a0aec0',
            margin: '5px 0 0',
          }}>
            إذا كان هذا الخطأ غير متوقع، يرجى مراجعة مسؤول إدارة الرقابة والتفتيش للحصول على الصلاحيات اللازمة.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
