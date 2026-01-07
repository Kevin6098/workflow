import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/common/Alert';

function ReviewDashboard() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [filter, setFilter] = useState('all');
    const [rejectModal, setRejectModal] = useState({ open: false, submissionId: null, type: null });
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Check if user can approve/endorse/reject
    const canReview = user?.privileges?.includes('ADMIN') || 
                      user?.privileges?.includes('COORDINATOR') || 
                      user?.privileges?.includes('DEPUTY_DEAN');

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const response = await reviewAPI.getAllSubmissions();
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error loading submissions:', error);
            setAlert({ type: 'error', message: 'Error loading submissions' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this submission as Coordinator?')) return;
        
        setActionLoading(true);
        try {
            await reviewAPI.coordinatorApprove(id);
            setAlert({ type: 'success', message: 'Submission approved successfully' });
            loadSubmissions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error approving submission' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndorse = async (id) => {
        if (!window.confirm('Endorse this submission as Deputy Dean?')) return;
        
        setActionLoading(true);
        try {
            await reviewAPI.deputyDeanEndorse(id);
            setAlert({ type: 'success', message: 'Submission endorsed successfully' });
            loadSubmissions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error endorsing submission' });
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (id, type) => {
        setRejectModal({ open: true, submissionId: id, type });
        setRejectReason('');
    };

    const closeRejectModal = () => {
        setRejectModal({ open: false, submissionId: null, type: null });
        setRejectReason('');
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setAlert({ type: 'error', message: 'Please provide a rejection reason' });
            return;
        }

        setActionLoading(true);
        try {
            if (rejectModal.type === 'coordinator') {
                await reviewAPI.coordinatorReject(rejectModal.submissionId, rejectReason);
            } else {
                await reviewAPI.deputyDeanReject(rejectModal.submissionId, rejectReason);
            }
            setAlert({ type: 'success', message: 'Submission rejected' });
            closeRejectModal();
            loadSubmissions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error rejecting submission' });
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'DRAFT': { class: 'draft', label: 'Draft' },
            'SUBMITTED': { class: 'submitted', label: 'Submitted' },
            'COORDINATOR_APPROVED': { class: 'coordinator-approved', label: 'Approved' },
            'DEAN_ENDORSED': { class: 'dean-endorsed', label: 'Endorsed' },
            'REJECTED': { class: 'rejected', label: 'Rejected' }
        };
        const config = statusConfig[status] || { class: '', label: status };
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'all') return true;
        return sub.status === filter;
    });

    // Count submissions by status
    const statusCounts = {
        all: submissions.length,
        SUBMITTED: submissions.filter(s => s.status === 'SUBMITTED').length,
        COORDINATOR_APPROVED: submissions.filter(s => s.status === 'COORDINATOR_APPROVED').length,
        DEAN_ENDORSED: submissions.filter(s => s.status === 'DEAN_ENDORSED').length,
        REJECTED: submissions.filter(s => s.status === 'REJECTED').length
    };


    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>📊 Review Dashboard</h2>
                <span style={{ color: '#666' }}>{submissions.length} total submissions</span>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {/* Status Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div 
                    className="card" 
                    style={{ 
                        cursor: 'pointer', 
                        textAlign: 'center',
                        border: filter === 'all' ? '2px solid #3B82F6' : '1px solid #e5e7eb'
                    }}
                    onClick={() => setFilter('all')}
                >
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#3B82F6' }}>{statusCounts.all}</h3>
                    <p style={{ margin: '8px 0 0', color: '#666' }}>All Submissions</p>
                </div>
                <div 
                    className="card" 
                    style={{ 
                        cursor: 'pointer', 
                        textAlign: 'center',
                        border: filter === 'SUBMITTED' ? '2px solid #F59E0B' : '1px solid #e5e7eb'
                    }}
                    onClick={() => setFilter('SUBMITTED')}
                >
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#F59E0B' }}>{statusCounts.SUBMITTED}</h3>
                    <p style={{ margin: '8px 0 0', color: '#666' }}>Pending Review</p>
                </div>
                <div 
                    className="card" 
                    style={{ 
                        cursor: 'pointer', 
                        textAlign: 'center',
                        border: filter === 'COORDINATOR_APPROVED' ? '2px solid #8B5CF6' : '1px solid #e5e7eb'
                    }}
                    onClick={() => setFilter('COORDINATOR_APPROVED')}
                >
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#8B5CF6' }}>{statusCounts.COORDINATOR_APPROVED}</h3>
                    <p style={{ margin: '8px 0 0', color: '#666' }}>Awaiting Endorsement</p>
                </div>
                <div 
                    className="card" 
                    style={{ 
                        cursor: 'pointer', 
                        textAlign: 'center',
                        border: filter === 'DEAN_ENDORSED' ? '2px solid #10B981' : '1px solid #e5e7eb'
                    }}
                    onClick={() => setFilter('DEAN_ENDORSED')}
                >
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#10B981' }}>{statusCounts.DEAN_ENDORSED}</h3>
                    <p style={{ margin: '8px 0 0', color: '#666' }}>Endorsed</p>
                </div>
                <div 
                    className="card" 
                    style={{ 
                        cursor: 'pointer', 
                        textAlign: 'center',
                        border: filter === 'REJECTED' ? '2px solid #EF4444' : '1px solid #e5e7eb'
                    }}
                    onClick={() => setFilter('REJECTED')}
                >
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#EF4444' }}>{statusCounts.REJECTED}</h3>
                    <p style={{ margin: '8px 0 0', color: '#666' }}>Rejected</p>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Course</th>
                                <th>Lecturer</th>
                                <th>Session</th>
                                <th>Dept</th>
                                <th>Study Type</th>
                                <th>Created</th>
                                <th>Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        No submissions found with the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredSubmissions.map(sub => (
                                    <tr key={sub.id}>
                                        <td>{getStatusBadge(sub.status)}</td>
                                        <td>
                                            <strong>{sub.course_code}</strong>
                                            <br />
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>{sub.course_name}</span>
                                        </td>
                                        <td>{sub.lecturer_name}</td>
                                        <td>
                                            <span className="badge" style={{ background: '#E5E7EB', color: '#374151' }}>
                                                {sub.session_code}
                                            </span>
                                        </td>
                                        <td>{sub.department_code}</td>
                                        <td>
                                            <span className="badge" style={{ 
                                                background: sub.study_type === 'Undergraduate' ? '#DBEAFE' : '#EDE9FE', 
                                                color: sub.study_type === 'Undergraduate' ? '#1E40AF' : '#6B21A8' 
                                            }}>
                                                {sub.study_type === 'Undergraduate' ? 'UG' : 'PG'}
                                            </span>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatDateTime(sub.created_at)}</td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatDateTime(sub.updated_at)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {/* Approve/Reject/Endorse buttons - only for reviewers (Admin, Coordinator, Deputy Dean) */}
                                                {canReview && (
                                                    <>
                                                        {/* SUBMITTED: Can Approve or Reject */}
                                                        {sub.status === 'SUBMITTED' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-success btn-small"
                                                                    onClick={() => handleApprove(sub.id)}
                                                                    disabled={actionLoading}
                                                                    title="Approve"
                                                                >
                                                                    ✓ Approve
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-small"
                                                                    onClick={() => openRejectModal(sub.id, 'coordinator')}
                                                                    disabled={actionLoading}
                                                                    title="Reject"
                                                                >
                                                                    ✗ Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {/* COORDINATOR_APPROVED (Approved): Can Endorse or Reject */}
                                                        {sub.status === 'COORDINATOR_APPROVED' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-primary btn-small"
                                                                    onClick={() => handleEndorse(sub.id)}
                                                                    disabled={actionLoading}
                                                                    title="Endorse"
                                                                >
                                                                    ✓ Endorse
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-small"
                                                                    onClick={() => openRejectModal(sub.id, 'dean')}
                                                                    disabled={actionLoading}
                                                                    title="Reject"
                                                                >
                                                                    ✗ Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {/* Status indicators for non-actionable states */}
                                                {sub.status === 'DEAN_ENDORSED' && (
                                                    <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: '500' }}>✓ Endorsed</span>
                                                )}
                                                {sub.status === 'REJECTED' && (
                                                    <span style={{ color: '#EF4444', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.rejection_reason}>
                                                        {sub.rejection_reason ? `Rejected: ${sub.rejection_reason}` : 'Rejected'}
                                                    </span>
                                                )}
                                                {sub.status === 'DRAFT' && (
                                                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Draft</span>
                                                )}
                                                
                                                {/* For lecturers (non-reviewers), show status text */}
                                                {!canReview && sub.status === 'SUBMITTED' && (
                                                    <span style={{ color: '#F59E0B', fontSize: '0.875rem' }}>Pending Review</span>
                                                )}
                                                {!canReview && sub.status === 'COORDINATOR_APPROVED' && (
                                                    <span style={{ color: '#8B5CF6', fontSize: '0.875rem' }}>Approved - Pending Endorsement</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectModal.open && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={closeRejectModal}
                >
                    <div 
                        style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '24px',
                            width: '90%',
                            maxWidth: '500px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px', color: '#1f2937' }}>
                            Reject Submission
                        </h3>
                        <p style={{ color: '#666', marginBottom: '16px' }}>
                            Please provide a reason for rejection. This will be visible to the lecturer.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                resize: 'vertical',
                                marginBottom: '16px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={closeRejectModal}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Submission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReviewDashboard;
