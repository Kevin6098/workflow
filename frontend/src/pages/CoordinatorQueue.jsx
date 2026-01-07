import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import Alert from '../components/common/Alert';

function CoordinatorQueue() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const response = await reviewAPI.getCoordinatorQueue();
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error loading queue:', error);
            setAlert({ type: 'error', message: 'Error loading submissions for review' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to APPROVE this submission?')) return;

        try {
            await reviewAPI.coordinatorApprove(id);
            setAlert({ type: 'success', message: 'Submission approved successfully! It will now be forwarded to Deputy Dean for endorsement.' });
            loadQueue();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error approving submission' });
        }
    };

    const openRejectModal = (submission) => {
        setSelectedSubmission(submission);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setAlert({ type: 'error', message: 'Please provide a reason for rejection' });
            return;
        }

        try {
            await reviewAPI.coordinatorReject(selectedSubmission.id, rejectReason);
            setAlert({ type: 'success', message: 'Submission rejected and returned to lecturer for revision.' });
            setShowRejectModal(false);
            setSelectedSubmission(null);
            loadQueue();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error rejecting submission' });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>📋 Coordinator Review Queue</h2>
                <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '1rem', padding: '8px 16px' }}>
                    {submissions.length} pending approval
                </span>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            <div className="card" style={{ marginBottom: '24px', background: '#FEF3C7', border: '1px solid #FCD34D' }}>
                <p style={{ margin: 0 }}>
                    <strong>📌 Your Role:</strong> As Course Coordinator, you review and approve document submissions from lecturers. 
                    Approved submissions will be forwarded to the Deputy Dean for final endorsement.
                </p>
            </div>

            {submissions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h3 style={{ color: '#10B981' }}>✅ All caught up!</h3>
                    <p style={{ color: '#666' }}>No submissions pending your approval at this time.</p>
                </div>
            ) : (
                <div className="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Submitted</th>
                                <th>Lecturer</th>
                                <th>Course</th>
                                <th>Session</th>
                                <th>Type of Study</th>
                                <th>Documents</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub.id}>
                                    <td>
                                        <span style={{ whiteSpace: 'nowrap' }}>
                                            {formatDate(sub.submitted_at || sub.created_at)}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{sub.lecturer_name}</strong>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#666' }}>{sub.lecturer_email}</span>
                                    </td>
                                    <td>
                                        <strong>{sub.course_code}</strong>
                                        <br />
                                        <span style={{ fontSize: '0.875rem', color: '#666' }}>{sub.course_name}</span>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: '#E5E7EB', color: '#374151' }}>
                                            {sub.session_code}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: sub.study_type === 'Undergraduate' ? '#DBEAFE' : '#EDE9FE', color: sub.study_type === 'Undergraduate' ? '#1E40AF' : '#6B21A8' }}>
                                            {sub.study_type}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600', color: '#059669' }}>
                                            {sub.document_count || 0} files
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className="btn btn-success btn-small"
                                                onClick={() => handleApprove(sub.id)}
                                            >
                                                ✓ Approve
                                            </button>
                                            <button 
                                                className="btn btn-danger btn-small"
                                                onClick={() => openRejectModal(sub)}
                                            >
                                                ✗ Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3 style={{ color: '#DC2626', marginTop: 0 }}>⚠️ Reject Submission</h3>
                        <p>
                            You are rejecting the submission from <strong>{selectedSubmission?.lecturer_name}</strong> for course <strong>{selectedSubmission?.course_code}</strong>.
                        </p>
                        <div className="form-group">
                            <label>Reason for Rejection *</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Please provide a detailed reason for rejection. This will be sent to the lecturer."
                                rows={4}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger"
                                onClick={handleReject}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CoordinatorQueue;
