import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { reviewAPI, submissionAPI } from '../services/api';

function Dashboard() {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        mySubmissions: 0,
        pendingApproval: 0,
        pendingEndorsement: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Load user's own submissions if they have any
            const mySubRes = await submissionAPI.getMySubmissions();
            const mySubmissions = mySubRes.data.submissions?.length || 0;

            let pendingApproval = 0;
            let pendingEndorsement = 0;

            // Load coordinator queue if coordinator
            if (user?.privileges?.includes('COORDINATOR')) {
                const coordRes = await reviewAPI.getCoordinatorQueue();
                pendingApproval = coordRes.data.submissions?.length || 0;
            }

            // Load dean queue if deputy dean
            if (user?.privileges?.includes('DEPUTY_DEAN')) {
                const deanRes = await reviewAPI.getDeputyDeanQueue();
                pendingEndorsement = deanRes.data.submissions?.length || 0;
            }

            setStats({ mySubmissions, pendingApproval, pendingEndorsement });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPrivilege = (priv) => user?.privileges?.includes(priv);

    return (
        <div>
            <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h1 style={{ margin: '0 0 8px 0' }}>Welcome, {user?.name || 'User'}!</h1>
                <p style={{ margin: 0, opacity: 0.9 }}>
                    Document Submission Workflow System
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>LECTURER</span>
                    {hasPrivilege('COORDINATOR') && (
                        <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>COORDINATOR</span>
                    )}
                    {hasPrivilege('DEPUTY_DEAN') && (
                        <span className="badge" style={{ background: '#EDE9FE', color: '#6B21A8' }}>DEPUTY DEAN</span>
                    )}
                    {hasPrivilege('ADMIN') && (
                        <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>ADMIN</span>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <Link to="/submissions" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                            <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#3B82F6' }}>{stats.mySubmissions}</h3>
                            <p style={{ margin: '8px 0 0', color: '#666' }}>My Submissions</p>
                        </div>
                    </Link>
                    
                    {hasPrivilege('COORDINATOR') && (
                        <Link to="/coordinator/queue" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', border: stats.pendingApproval > 0 ? '2px solid #F59E0B' : '1px solid #e5e7eb' }}>
                                <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#F59E0B' }}>{stats.pendingApproval}</h3>
                                <p style={{ margin: '8px 0 0', color: '#666' }}>Pending Approval</p>
                            </div>
                        </Link>
                    )}

                    {hasPrivilege('DEPUTY_DEAN') && (
                        <Link to="/dean/queue" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', border: stats.pendingEndorsement > 0 ? '2px solid #8B5CF6' : '1px solid #e5e7eb' }}>
                                <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#8B5CF6' }}>{stats.pendingEndorsement}</h3>
                                <p style={{ margin: '8px 0 0', color: '#666' }}>Pending Endorsement</p>
                            </div>
                        </Link>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {/* Everyone can submit documents */}
                <Link to="/submit" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #10B981' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#10B981' }}>📄 Submit New Document</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                            Upload course documents for the current semester
                        </p>
                    </div>
                </Link>

                <Link to="/submissions" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #3B82F6' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#3B82F6' }}>📋 My Submissions</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                            View and manage your submitted documents
                        </p>
                    </div>
                </Link>

                {/* Coordinator Actions */}
                {hasPrivilege('COORDINATOR') && (
                    <Link to="/coordinator/queue" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #F59E0B' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#F59E0B' }}>✅ Approve Submissions</h3>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                                Review and approve documents from lecturers
                            </p>
                        </div>
                    </Link>
                )}

                {/* Deputy Dean Actions */}
                {hasPrivilege('DEPUTY_DEAN') && (
                    <Link to="/dean/queue" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #8B5CF6' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#8B5CF6' }}>🎓 Endorse Submissions</h3>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                                Provide final endorsement for approved documents
                            </p>
                        </div>
                    </Link>
                )}

                {/* Admin Actions */}
                {hasPrivilege('ADMIN') && (
                    <>
                        <Link to="/admin/users" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #EF4444' }}>
                                <h3 style={{ margin: '0 0 8px 0', color: '#EF4444' }}>👥 User Management</h3>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                                    Manage users and assign privileges
                                </p>
                            </div>
                        </Link>
                        <Link to="/admin/course-roles" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ cursor: 'pointer', borderLeft: '4px solid #EC4899' }}>
                                <h3 style={{ margin: '0 0 8px 0', color: '#EC4899' }}>🔗 Course Mapping</h3>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                                    Assign coordinators and deans to courses
                                </p>
                            </div>
                        </Link>
                    </>
                )}
            </div>

            {/* Workflow Guide */}
            <div className="card" style={{ marginTop: '24px', background: '#F9FAFB' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>📖 Workflow Process</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge draft">1. Draft</span>
                        <span>→</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge submitted">2. Submitted</span>
                        <span>→</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge coordinator-approved">3. Coordinator Approved</span>
                        <span>→</span>
                    </div>
                    <div>
                        <span className="badge dean-endorsed">4. Dean Endorsed ✓</span>
                    </div>
                </div>
                <p style={{ marginTop: '12px', marginBottom: 0, color: '#666', fontSize: '0.875rem' }}>
                    Documents go through a review process: Lecturer submits → Course Coordinator approves → Deputy Dean endorses
                </p>
            </div>
        </div>
    );
}

export default Dashboard;
