import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitDocument from './pages/SubmitDocument';
import MySubmissions from './pages/MySubmissions';
import CoordinatorQueue from './pages/CoordinatorQueue';
import DeanQueue from './pages/DeanQueue';
import ReviewDashboard from './pages/ReviewDashboard';
import UserManagement from './pages/admin/UserManagement';
import SessionManagement from './pages/admin/SessionManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CourseRoleMapping from './pages/admin/CourseRoleMapping';
import AuditLog from './pages/admin/AuditLog';
import Layout from './components/common/Layout';

// Protected Route wrapper
const ProtectedRoute = ({ children, requirePrivilege }) => {
    const { user, loading, hasPrivilege } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requirePrivilege && !hasPrivilege(requirePrivilege)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="submit" element={<SubmitDocument />} />
                <Route path="submissions" element={<MySubmissions />} />
                <Route path="dashboard" element={<ReviewDashboard />} />
                
                <Route path="coordinator/queue" element={
                    <ProtectedRoute requirePrivilege="COORDINATOR">
                        <CoordinatorQueue />
                    </ProtectedRoute>
                } />
                
                <Route path="dean/queue" element={
                    <ProtectedRoute requirePrivilege="DEPUTY_DEAN">
                        <DeanQueue />
                    </ProtectedRoute>
                } />
                
                <Route path="admin/users" element={
                    <ProtectedRoute requirePrivilege="ADMIN">
                        <UserManagement />
                    </ProtectedRoute>
                } />
                
                <Route path="admin/sessions" element={
                    <ProtectedRoute requirePrivilege="ADMIN">
                        <SessionManagement />
                    </ProtectedRoute>
                } />
                
                <Route path="admin/departments" element={
                    <ProtectedRoute requirePrivilege="ADMIN">
                        <DepartmentManagement />
                    </ProtectedRoute>
                } />
                
                <Route path="admin/courses" element={
                    <ProtectedRoute requirePrivilege="ADMIN">
                        <CourseManagement />
                    </ProtectedRoute>
                } />
                
                <Route path="admin/course-roles" element={
                    <ProtectedRoute requirePrivilege="ADMIN">
                        <CourseRoleMapping />
                    </ProtectedRoute>
                } />
                
                <Route path="admin/audit-log" element={
                    <ProtectedRoute requirePrivilege="ADMIN">
                        <AuditLog />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;

