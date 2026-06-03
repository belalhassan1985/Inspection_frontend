import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Profile details states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync state if user loads/updates
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('الاسم الكامل مطلوب.');
      return;
    }

    setProfileSaving(true);
    try {
      await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName.trim(),
          department: department.trim()
        })
      });
      
      // Update global context state
      updateUser({
        fullName: fullName.trim(),
        department: department.trim()
      });
      
      setProfileSuccess('تم تحديث البيانات الشخصية بنجاح!');
    } catch (err: any) {
      setProfileError(err.message || 'فشل تحديث البيانات الشخصية.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('يجب أن تكون كلمة المرور الجديدة مكونة من 4 رموز على الأقل.');
      return;
    }

    setPasswordSaving(true);
    try {
      await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          password: newPassword
        })
      });
      setPasswordSuccess('تم تغيير كلمة المرور بنجاح!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'فشل تغيير كلمة المرور.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">الملف الشخصي للضابط</h1>
          <p className="page-subtitle">تحديث الاسم، التشكيل الإداري، وكلمة المرور الخاصة بحسابك</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '25px' }}>
        {/* Profile Card */}
        <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 className="m-b-15">✏️ تعديل البيانات الشخصية والتشكيل</h3>
          
          {profileError && (
            <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              ⚠️ {profileError}
            </div>
          )}

          {profileSuccess && (
            <div style={{ backgroundColor: 'rgba(42, 157, 143, 0.1)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              ✅ {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>الاسم الكامل للضابط</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: العميد أحمد علي"
                required
                disabled={profileSaving}
              />
            </div>

            <div className="form-group">
              <label>المديرية / التشكيل الإداري التابع له</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="مثال: مديرية شرطة بغداد الكرخ"
                required
                disabled={profileSaving}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', margin: '20px 0', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>اسم المستخدم (ثابت):</span>
                <code>{user?.username}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>الصلاحية الحالية:</span>
                <span className="badge badge-info" style={{ margin: 0 }}>{user?.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>بروتوكول الأمان:</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>JWT Secure Session</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 'bold' }}
            >
              {profileSaving ? 'جاري حفظ البيانات...' : 'حفظ التعديلات الشخصية 💾'}
            </button>
          </form>
        </div>

        {/* Password Change Card */}
        <div className="card" style={{ borderTop: '4px solid var(--secondary-color)' }}>
          <h3 className="m-b-15">🔒 تحديث كلمة المرور</h3>

          {passwordError && (
            <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              ⚠️ {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={{ backgroundColor: 'rgba(42, 157, 143, 0.1)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              ✅ {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                required
                disabled={passwordSaving}
              />
            </div>

            <div className="form-group">
              <label>تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور الجديدة للتأكيد"
                required
                disabled={passwordSaving}
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '10px', justifyContent: 'center', fontWeight: 'bold' }}
            >
              {passwordSaving ? 'جاري تحديث كلمة المرور...' : 'حفظ كلمة المرور الجديدة 🔒'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
