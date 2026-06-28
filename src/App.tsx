import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Lazy loaded page components
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Hierarchy = lazy(() => import('./pages/Hierarchy').then(m => ({ default: m.Hierarchy })));
const Criteria = lazy(() => import('./pages/Criteria').then(m => ({ default: m.Criteria })));
const Campaigns = lazy(() => import('./pages/Campaigns').then(m => ({ default: m.Campaigns })));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail').then(m => ({ default: m.CampaignDetail })));
const Execution = lazy(() => import('./pages/Execution').then(m => ({ default: m.Execution })));
const Review = lazy(() => import('./pages/Review').then(m => ({ default: m.Review })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const ReportDesigner = lazy(() => import('./pages/ReportDesigner').then(m => ({ default: m.ReportDesigner })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const Inspectors = lazy(() => import('./pages/Inspectors').then(m => ({ default: m.Inspectors })));
const RecommendationCenter = lazy(() => import('./pages/RecommendationCenter').then(m => ({ default: m.RecommendationCenter })));
const RecommendationDetails = lazy(() => import('./pages/RecommendationDetails').then(m => ({ default: m.RecommendationDetails })));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const HealthDashboard = lazy(() => import('./pages/HealthDashboard').then(m => ({ default: m.HealthDashboard })));
const EscalationDashboard = lazy(() => import('./pages/EscalationDashboard').then(m => ({ default: m.EscalationDashboard })));
const SlaDashboard = lazy(() => import('./pages/SlaDashboard').then(m => ({ default: m.SlaDashboard })));
const InspectorWorkload = lazy(() => import('./pages/InspectorWorkload').then(m => ({ default: m.InspectorWorkload })));
const InspectorDuties = lazy(() => import('./pages/InspectorDuties').then(m => ({ default: m.InspectorDuties })));
const InspectorExcellence = lazy(() => import('./pages/InspectorExcellence').then(m => ({ default: m.InspectorExcellence })));
const WorkloadBalance = lazy(() => import('./pages/WorkloadBalance').then(m => ({ default: m.WorkloadBalance })));
const InspectorProfile = lazy(() => import('./pages/InspectorProfile').then(m => ({ default: m.InspectorProfile })));
const InspectionGroups = lazy(() => import('./pages/InspectionGroups').then(m => ({ default: m.InspectionGroups })));
const GroupDetail = lazy(() => import('./pages/GroupDetail').then(m => ({ default: m.GroupDetail })));
const InspectorsDirectory = lazy(() => import('./pages/InspectorsDirectory').then(m => ({ default: m.InspectorsDirectory })));
const Specializations = lazy(() => import('./pages/Specializations').then(m => ({ default: m.Specializations })));
import { ClassificationRouteGuard } from './components/ClassificationRouteGuard';

const LoadingSplash: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0c2340',
      color: '#ffffff',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl',
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid rgba(255, 255, 255, 0.1)',
        borderTop: '5px solid #d4af37',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
      }}></div>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>جاري التحقق من الجلسة الأمنية...</h2>
      <p style={{ fontSize: '13px', color: '#cbd5e0', marginTop: '5px' }}>هيئة تفتيش قوى الأمن الداخلي - وزارة الداخلية</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSplash />;
  }

  return (
    <Suspense fallback={<LoadingSplash />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Home />} />
          <Route path="dashboard/executive" element={
            <ClassificationRouteGuard requiredLevel="SECRET">
              <ExecutiveDashboard />
            </ClassificationRouteGuard>
          } />
          <Route path="dashboard/health" element={
            <ClassificationRouteGuard requiredLevel="CONFIDENTIAL">
              <HealthDashboard />
            </ClassificationRouteGuard>
          } />
          <Route path="dashboard/escalation" element={
            <ClassificationRouteGuard requiredLevel="CONFIDENTIAL" forbiddenRoles={['COORDINATOR']}>
              <EscalationDashboard />
            </ClassificationRouteGuard>
          } />
          <Route path="dashboard/sla" element={
            <ClassificationRouteGuard requiredLevel="CONFIDENTIAL">
              <SlaDashboard />
            </ClassificationRouteGuard>
          } />
          <Route path="dashboard/inspector-workload" element={<InspectorWorkload />} />
          <Route path="dashboard/inspector-duties" element={<InspectorDuties />} />
          <Route path="dashboard/inspector-excellence" element={<InspectorExcellence />} />
          <Route path="dashboard/workload-balance" element={<WorkloadBalance />} />
          <Route path="hierarchy" element={<Hierarchy />} />
          <Route path="criteria" element={<Criteria />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="inspections" element={<Execution />} />
          <Route path="execution" element={<Navigate to="/inspections" replace />} />
          <Route path="review" element={<Review />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/designer" element={<ReportDesigner />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="inspectors" element={<AdminRoute><Inspectors /></AdminRoute>} />
          <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          <Route path="inspectors/:id/profile" element={<InspectorProfile />} />
          <Route path="inspection-groups" element={<InspectionGroups />} />
          <Route path="inspection-groups/:id" element={<GroupDetail />} />
          <Route path="inspectors-directory" element={<InspectorsDirectory />} />
          <Route path="specializations" element={<AdminRoute><Specializations /></AdminRoute>} />
          <Route path="recommendations/tracking" element={<RecommendationCenter />} />
          <Route path="recommendations/tracking/:id" element={<RecommendationDetails />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
