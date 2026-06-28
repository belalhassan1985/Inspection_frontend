import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';

const TYPE_ICONS: Record<string, string> = {
  ASSIGNMENT: '👑',
  STATUS_CHANGE: '🔄',
  PROGRESS_UPDATE: '📊',
  COMMENT: '💬',
  EVIDENCE_UPLOAD: '📎',
  SLA_AT_RISK: '⚠️',
  SLA_OVERDUE: '🚨',
  VERIFIED: '✅',
  REJECTED: '❌',
  REOPENED: '🔓',
  ESCALATION: '⏫',
  GENERAL: '📋',
};

const SEVERITY_COLORS: Record<string, string> = {
  INFO: '#3b82f6',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
  SUCCESS: '#10b981',
};

const SEVERITY_BG: Record<string, string> = {
  INFO: '#eff6ff',
  WARNING: '#fffbeb',
  CRITICAL: '#fef2f2',
  SUCCESS: '#ecfdf5',
};

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => location.pathname.includes('/reports/designer'));
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await apiFetch('/notifications/unread-count');
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchAllNotifications = async () => {
    try {
      const params = filterType ? `?type=${filterType}` : '';
      const res = await apiFetch(`/notifications${params}`);
      setNotifications(res.items || res || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (showDropdown) {
      fetchAllNotifications();
    }
  }, [showDropdown, filterType]);

  // WebSocket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: any) => {
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [notif, ...prev]);
    };

    const handleNotificationRead = (data: { id: string }) => {
      setNotifications(prev => prev.map(n => n.id === data.id ? { ...n, isRead: true } : n));
      fetchUnreadCount();
    };

    const handleNotificationReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:readAll', handleNotificationReadAll);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:readAll', handleNotificationReadAll);
    };
  }, [socket]);

  // Fallback Polling (polls every 90s only when socket is disconnected)
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
      if (showDropdown) {
        fetchAllNotifications();
      }
    }, 90000);

    return () => clearInterval(interval);
  }, [isConnected, showDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    setShowDropdown(false);
    try {
      if (!notif.isRead) {
        await apiFetch(`/notifications/${notif.id}/read`, { method: 'PATCH' });
        fetchUnreadCount();
      }
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      if (notif.link) {
        navigate(notif.link);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const weights = {
    RESTRICTED: 1,
    CONFIDENTIAL: 2,
    SECRET: 3,
    TOP_SECRET: 4,
  };

  const hasClearance = (requiredLevel: 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET') => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const userLevel = (user.securityClassification || 'RESTRICTED') as keyof typeof weights;
    return (weights[userLevel] || 1) >= (weights[requiredLevel] || 1);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: sidebarCollapsed ? '56px' : '260px',
        backgroundColor: '#0c2340',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '4px solid #d4af37',
        flexShrink: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: '48px',
        }}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={sidebarCollapsed ? 'فتح القائمة' : 'إغلاق القائمة'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#d4af37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#0c2340',
            fontSize: '18px',
          }}>
            ت
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold' }}>هيئة تفتيش قوى الأمن الداخلي</h2>
            <p style={{ fontSize: '11px', color: '#cbd5e0' }}>وزارة الداخلية العراقية</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>📊</span> لوحة التحكم
          </NavLink>
          <NavLink to="/campaigns" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>📅</span> إدارة اللجان
          </NavLink>
          <NavLink to="/inspections" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>📝</span> تنفيذ التفتيش
          </NavLink>
          <NavLink to="/reports/designer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>📄</span> التقارير
          </NavLink>
          <NavLink to="/recommendations/tracking" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>🏛️</span> مركز متابعة التوصيات
          </NavLink>
          <NavLink to="/hierarchy" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>🌳</span> الهيكل الإداري والمناصب
          </NavLink>
          <NavLink to="/criteria" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>⚖️</span> أسس التفتيش
          </NavLink>

          {(hasClearance('SECRET') || hasClearance('CONFIDENTIAL')) && (
            <>
              <div style={{ margin: '15px 10px 5px', fontSize: '11px', textTransform: 'uppercase', color: '#718096', fontWeight: 'bold' }}>
                إدارة المفتشين والواجبات
              </div>
              <NavLink to="/inspectors-directory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>📇</span> دليل المفتشين
              </NavLink>
              <NavLink to="/inspection-groups" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>👥</span> الفرق التفتيشية
              </NavLink>
              <NavLink to="/dashboard/inspector-workload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>📊</span> لوحة أعباء العمل
              </NavLink>
              <NavLink to="/dashboard/inspector-duties" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>📋</span> سجل الواجبات الحالية
              </NavLink>
              <NavLink to="/dashboard/inspector-excellence" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>🏆</span> لوحة التميز والنشاط
              </NavLink>
              <NavLink to="/dashboard/workload-balance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>⚖️</span> توازن أعباء العمل
              </NavLink>
            </>
          )}

          {(hasClearance('SECRET') || hasClearance('CONFIDENTIAL')) && (
            <>
              <div style={{ margin: '15px 10px 5px', fontSize: '11px', textTransform: 'uppercase', color: '#718096', fontWeight: 'bold' }}>
                الذكاء التنفيذي والتحليلات
              </div>
              {hasClearance('SECRET') && (
                <NavLink to="/dashboard/executive" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <span>📈</span> اللوحة التنفيذية العليا
                </NavLink>
              )}
              {hasClearance('CONFIDENTIAL') && (
                <NavLink to="/dashboard/sla" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <span>⏱️</span> مؤشرات SLA
                </NavLink>
              )}
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div style={{ margin: '15px 10px 5px', fontSize: '11px', textTransform: 'uppercase', color: '#718096', fontWeight: 'bold' }}>
                إدارة النظام
              </div>
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>👥</span> المستخدمون
              </NavLink>
              <NavLink to="/inspectors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>🎖️</span> المفتشون
              </NavLink>
              <NavLink to="/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>📜</span> سجل العمليات
              </NavLink>
            </>
          )}

          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>👤</span> الملف الشخصي
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>⚙️</span> الإعدادات
          </NavLink>
        </nav>

        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: '#cbd5e0',
          textAlign: 'center',
        }}>
          النسخة المطورة v2.0
        </div>
        </>
        )}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f4f6f9', overflowY: 'auto' }}>
        <header style={{
          height: '70px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: 600 }}>
              مرحباً بك في لوحة تحكم الضباط والمفتشين
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Bell Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#f1f5f9',
                  transition: 'background-color 0.2s',
                }}
                title="الإشعارات والتنبيهات"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 2px #ffffff',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '48px',
                  width: '320px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  zIndex: 1000,
                  direction: 'rtl',
                  textAlign: 'right',
                  fontFamily: 'Cairo, sans-serif',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 15px',
                    borderBottom: '1px solid #edf2f7',
                    backgroundColor: '#0c2340',
                    color: '#ffffff',
                    borderTopLeftRadius: '11px',
                    borderTopRightRadius: '11px',
                  }}>
                    <strong style={{ fontSize: '13.5px' }}>🔔 مركز التنبيهات الإدارية</strong>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d4af37',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontFamily: 'Cairo, sans-serif',
                          textDecoration: 'underline',
                          padding: '0',
                        }}
                      >
                        قراءة الكل ({unreadCount})
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #edf2f7', backgroundColor: '#f8fafc' }}>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: '11px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontFamily: 'Cairo, sans-serif',
                        background: '#ffffff',
                        color: '#0c2340',
                      }}
                    >
                      <option value="">جميع الإشعارات</option>
                      <option value="ASSIGNMENT">تكليف</option>
                      <option value="PROGRESS_UPDATE">تحديث التقدم</option>
                      <option value="COMMENT">تعليقات</option>
                      <option value="EVIDENCE_UPLOAD">أدلة إثبات</option>
                      <option value="VERIFIED">تحقق</option>
                      <option value="REJECTED">رفض</option>
                      <option value="REOPENED">إعادة فتح</option>
                      <option value="ESCALATION">تصعيد</option>
                      <option value="SLA_AT_RISK">SLA خطر</option>
                      <option value="SLA_OVERDUE">SLA تجاوز</option>
                      <option value="STATUS_CHANGE">تغيير حالة</option>
                    </select>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 15px', textAlign: 'center', color: '#a0aec0', fontSize: '12.5px' }}>
                        📭 لا توجد إشعارات حالية.
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const icon = TYPE_ICONS[notif.type] || '📋';
                        const severityColor = SEVERITY_COLORS[notif.severity] || '#718096';
                        const bgColor = notif.isRead ? '#ffffff' : (SEVERITY_BG[notif.severity] || '#f0f4f8');
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                              padding: '12px 15px',
                              borderBottom: '1px solid #f7fafc',
                              cursor: 'pointer',
                              backgroundColor: bgColor,
                              transition: 'background-color 0.15s',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? '#f8fafc' : '#e6eef4'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                          >
                            <span style={{ fontSize: '16px', marginTop: '2px' }}>{icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: notif.isRead ? 600 : 800, color: '#0c2340', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {notif.title}
                                <span style={{
                                  fontSize: '8px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                  backgroundColor: severityColor,
                                  color: '#ffffff',
                                  lineHeight: '16px',
                                }}>
                                  {notif.severity}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#4a5568', lineHeight: 1.4 }}>
                                {notif.message}
                              </div>
                              <div style={{ fontSize: '9.5px', color: '#a0aec0', marginTop: '4px' }}>
                                {new Date(notif.createdAt).toLocaleDateString('ar-IQ')} {new Date(notif.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer' }}
              title="عرض الملف الشخصي"
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0c2340' }}>{user?.fullName}</div>
                <div style={{ fontSize: '11px', color: '#718096' }}>
                  الدور: {user?.role === 'ADMIN' ? 'مشرف عام' : user?.role === 'EVALUATOR' ? 'مفتش تقييم' : user?.role === 'EDITOR' ? 'محرر' : user?.role === 'COORDINATOR' ? 'منسق' : 'متابع'} | التصنيف: {user?.securityClassification || 'RESTRICTED'} | {user?.department}
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#cbd5e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                👤
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-outline"
              style={{
                padding: '8px 15px',
                fontSize: '13px',
                color: '#e63946',
                borderColor: '#e63946',
                borderRadius: '8px',
              }}
            >
              خروج 🚪
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          color: #cbd5e0;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .sidebar-link span {
          font-size: 16px;
        }
        .sidebar-link:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
        .sidebar-link.active {
          background-color: #d4af37;
          color: #0c2340;
        }
      `}</style>
    </div>
  );
};
