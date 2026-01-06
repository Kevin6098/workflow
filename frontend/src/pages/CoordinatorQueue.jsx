import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import Alert from '../components/common/Alert';

function CoordinatorQueue() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const response = await reviewAPI.getCoordinatorQueue();
            setSubmissions(response.data.submissions);
        } catch (error) {
            console.error('Error loading queue:', error);
            setAlert({ type: 'error', message: 'Error loading queue' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this submission?')) return;

        try {
            await reviewAPI.coordinatorApprove(id);
            setAlert({ type: 'success', message: 'Submission approved successfully' });
            loadQueue();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error approving submission' });
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Please enter rejection reason:');
        if (!reason) return;

        try {
            await reviewAPI.coordinatorReject(id, reason);
            setAlert({ type: 'success', message: 'Submission rejected' });
            loadQueue();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error rejecting submission' });
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Coordinator Review Queue</h2>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {submissions.length === 0 ? (
                <div className="card">
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        No submissions pending review
                    </p>
                </div>
            ) : (
                <div className="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Lecturer</th>
                                <th>Session</th>
                                <th>Type of Study</th>
                                <th>Submitted Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub.id}>
                                    <td>{sub.course_code} - {sub.course_name}</td>
                                    <td>{sub.lecturer_name}</td>
                                    <td>{sub.session_code}</td>
                                    <td>{sub.type_of_study}</td>
                                    <td>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                                    <td>
                                        <button 
                                            className="btn btn-success btn-small" 
                                            onClick={() => handleApprove(sub.id)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-small" 
                                            onClick={() => handleReject(sub.id)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default CoordinatorQueue;

