import { useState, useEffect } from 'react';
import { submissionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await submissionAPI.getMySubmissions();
            const submissions = response.data.submissions;

            setStats({
                total: submissions.length,
                draft: submissions.filter(s => s.status === 'DRAFT').length,
                submitted: submissions.filter(s => s.status === 'SUBMITTED').length,
                approved: submissions.filter(s => s.status === 'COORDINATOR_APPROVED' || s.status === 'DEAN_ENDORSED').length,
                rejected: submissions.filter(s => s.status === 'REJECTED').length
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <h2 style={{ marginBottom: '32px' }}>Welcome, {user?.name}</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <h4>Total Submissions</h4>
                    <div className="number">{stats.total}</div>
                </div>
                <div className="stat-card">
                    <h4>Drafts</h4>
                    <div className="number">{stats.draft}</div>
                </div>
                <div className="stat-card">
                    <h4>Submitted</h4>
                    <div className="number">{stats.submitted}</div>
                </div>
                <div className="stat-card">
                    <h4>Approved</h4>
                    <div className="number">{stats.approved}</div>
                </div>
                <div className="stat-card">
                    <h4>Rejected</h4>
                    <div className="number">{stats.rejected}</div>
                </div>
            </div>

            <div className="card">
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <a href="/submit" style={{ textDecoration: 'none' }}>
                        <button className="btn btn-primary">
                            📝 Submit New Document
                        </button>
                    </a>
                    <a href="/submissions" style={{ textDecoration: 'none' }}>
                        <button className="btn btn-secondary">
                            📄 View My Submissions
                        </button>
                    </a>
                    <a href="/dashboard" style={{ textDecoration: 'none' }}>
                        <button className="btn btn-secondary">
                            📊 Review Dashboard
                        </button>
                    </a>
                </div>
            </div>

            {user?.privileges?.length > 0 && (
                <div className="card">
                    <h3>Your Privileges</h3>
                    <div style={{ marginTop: '16px' }}>
                        {user.privileges.includes('ADMIN') && (
                            <span className="badge" style={{ marginRight: '8px', background: '#FEE2E2', color: '#991B1B' }}>
                                Admin
                            </span>
                        )}
                        {user.privileges.includes('COORDINATOR') && (
                            <span className="badge" style={{ marginRight: '8px', background: '#FEF3C7', color: '#92400E' }}>
                                Coordinator
                            </span>
                        )}
                        {user.privileges.includes('DEPUTY_DEAN') && (
                            <span className="badge" style={{ marginRight: '8px', background: '#EDE9FE', color: '#6B21A8' }}>
                                Deputy Dean
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;

