import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uData, rData] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/users/roles'),
      ]);
      setUsers(uData.filter((u: any) => u.role?.name !== 'EVALUATOR'));
      setRoles(rData.filter((r: any) => r.name !== 'EVALUATOR'));
    } catch (e: any) {
      setError(e.message || 'فشل تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName,
        username,
        password: password || undefined,
        roleId: parseInt(roleId),
        department,
        isActive,
      };

      if (userId) {
        await apiFetch(`/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ حساب المستخدم');
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'فشل حذف المستخدم');
    }
  };

  const editUser = (u: any) => {
    setUserId(u.id);
    setFullName(u.fullName);
    setUsername(u.username);
    setPassword('');
    setRoleId(u.roleId?.toString() || '');
    setDepartment(u.department || '');
    setIsActive(u.isActive);
    setShowForm(true);
  };

  const resetForm = () => {
    setUserId(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setRoleId('');
    setDepartment('');
    setIsActive(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المستخدمين والصلاحيات</h1>
          <p className="page-subtitle">إضافة حسابات الضباط والمفتشين وتخصيص أدوارهم للنظام</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          + إضافة مستخدم جديد
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230,57,70,0.1)', color: 'var(--accent-color)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="card m-b-20" style={{ border: '2px solid var(--primary-color)' }}>
          <h3>{userId ? 'تعديل حساب المستخدم' : 'إنشاء حساب مستخدم جديد'}</h3>
          <form onSubmit={handleSubmit} className="grid-2" style={{ marginTop: '15px' }}>
            <div className="form-group">
              <label>الاسم الكامل واللقب للضابط</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>اسم المستخدم (للدخول)</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>كلمة المرور {userId && '(اتركها فارغة لعدم التعديل)'}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required={!userId} />
            </div>

            <div className="form-group">
              <label>دور الصلاحية</label>
              <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
                <option value="">(اختر الدور)</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name} - {r.description}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>المديرية / القسم التابع له</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="مثال: قسم التفتيش الفني" required />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '20px', height: '20px', margin: 0 }}
              />
              <label style={{ margin: 0 }}>الحساب نشط (يمكنه تسجيل الدخول)</label>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">إلغاء</button>
              <button type="submit" className="btn-primary">حفظ حساب المستخدم</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل الحسابات...</div>
      ) : (
        <div className="card">
          <h3>قائمة الحسابات المسجلة بالنظام</h3>
          <table>
            <thead>
              <tr>
                <th>الاسم الكامل للضابط</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>المديرية/القسم</th>
                <th>حالة الحساب</th>
                <th>خيارات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.fullName}</strong></td>
                  <td>{u.username}</td>
                  <td><span className="badge badge-info">{u.role?.name}</span></td>
                  <td>{u.department}</td>
                  <td>
                    <span className={`badge badge-${u.isActive ? 'success' : 'danger'}`}>
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td>
                    {u.username !== 'ahmed' ? (
                      <div className="flex gap-10">
                        <button
                          onClick={() => editUser(u)}
                          className="btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          حذف
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>حساب النظام الرئيسي</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
