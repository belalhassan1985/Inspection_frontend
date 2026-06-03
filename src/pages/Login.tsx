import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من المدخلات.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0c2340',
      backgroundImage: 'radial-gradient(circle at top left, #1d3557 0%, #05101f 100%)',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '450px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '35px 30px',
        color: '#ffffff',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          backgroundColor: '#d4af37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)',
          border: '2px solid #ffffff'
        }}>
          <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#0c2340" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h1 style={{ fontSize: '22px', marginBottom: '8px', color: '#ffffff' }}>جمهورية العراق</h1>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#d4af37', marginBottom: '25px' }}>نظام أسس التفتيش  - وزارة الداخلية</h2>

        {error && (
          <div style={{
            backgroundColor: 'rgba(230, 57, 70, 0.15)',
            border: '1px solid #e63946',
            color: '#ff8892',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '15px',
            textAlign: 'right'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'right' }}>
          <div className="form-group">
            <label style={{ color: '#cbd5e0' }}>اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: ahmed"
              required
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                marginTop: '5px'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ color: '#cbd5e0' }}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                marginTop: '5px'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-secondary"
            style={{ width: '100%', padding: '14px', fontSize: '15px', justifyContent: 'center', fontWeight: 'bold' }}
          >
            دخول آمن للنظام
          </button>
        </form>
      </div>
    </div>
  );
};
