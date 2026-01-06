import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Layout() {
    const { user, logout, hasPrivilege } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    return (
        <div className="layout">
            <header className="header">
                <div className="header-content">
                    <h1>📋 QP Repository System</h1>
                    <div className="header-user">
                        <span>{user?.name}</span>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="main-content">
                <aside className="sidebar">
                    <nav className="sidebar-nav">
                        <ul>
                            <li>
                                <Link to="/" className={isActive('/') ? 'active' : ''}>
                                    🏠 Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/submit" className={isActive('/submit') ? 'active' : ''}>
                                    📝 Submit Document
                                </Link>
                            </li>
                            <li>
                                <Link to="/submissions" className={isActive('/submissions') ? 'active' : ''}>
                                    📄 My Submissions
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                                    📊 Review Dashboard
                                </Link>
                            </li>

                            {hasPrivilege('COORDINATOR') && (
                                <li>
                                    <Link to="/coordinator/queue" className={isActive('/coordinator/queue') ? 'active' : ''}>
                                        ✅ Coordinator Queue
                                    </Link>
                                </li>
                            )}

                            {hasPrivilege('DEPUTY_DEAN') && (
                                <li>
                                    <Link to="/dean/queue" className={isActive('/dean/queue') ? 'active' : ''}>
                                        🎓 Deputy Dean Queue
                                    </Link>
                                </li>
                            )}

                            {hasPrivilege('ADMIN') && (
                                <>
                                    <li style={{ marginTop: '20px', padding: '12px 24px', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Admin Panel
                                    </li>
                                    <li>
                                        <Link to="/admin/users" className={isActive('/admin/users') ? 'active' : ''}>
                                            👥 Users
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/sessions" className={isActive('/admin/sessions') ? 'active' : ''}>
                                            📅 Sessions
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/departments" className={isActive('/admin/departments') ? 'active' : ''}>
                                            🏢 Departments
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/courses" className={isActive('/admin/courses') ? 'active' : ''}>
                                            📚 Courses
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/course-roles" className={isActive('/admin/course-roles') ? 'active' : ''}>
                                            🔗 Course Role Mapping
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/audit-log" className={isActive('/admin/audit-log') ? 'active' : ''}>
                                            📋 Audit Log
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>
                </aside>

                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;

