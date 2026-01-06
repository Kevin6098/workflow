import { useState, useEffect } from 'react';
import { submissionAPI } from '../services/api';
import Alert from '../components/common/Alert';

function MySubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const response = await submissionAPI.getMySubmissions();
            setSubmissions(response.data.submissions);
        } catch (error) {
            console.error('Error loading submissions:', error);
            setAlert({ type: 'error', message: 'Error loading submissions' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this submission?')) return;

        try {
            await submissionAPI.deleteSubmission(id);
            setAlert({ type: 'success', message: 'Submission deleted successfully' });
            loadSubmissions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error deleting submission' });
        }
    };

    const handleSubmitForReview = async (id) => {
        if (!window.confirm('Are you sure you want to submit this for review?')) return;

        try {
            await submissionAPI.submitForReview(id);
            setAlert({ type: 'success', message: 'Submitted for review successfully' });
            loadSubmissions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error submitting for review' });
        }
    };

    const getStatusBadgeClass = (status) => {
        return `badge ${status.toLowerCase().replace(/_/g, '-')}`;
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>My Submissions</h2>
                <a href="/submit" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-primary">+ New Submission</button>
                </a>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {submissions.length === 0 ? (
                <div className="card">
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        No submissions yet. Click "New Submission" to get started.
                    </p>
                </div>
            ) : (
                <div className="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Session</th>
                                <th>Type of Study</th>
                                <th>Status</th>
                                <th>Submitted Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub.id}>
                                    <td>{sub.course_code} - {sub.course_name}</td>
                                    <td>{sub.session_code}</td>
                                    <td>{sub.type_of_study}</td>
                                    <td>
                                        <span className={getStatusBadgeClass(sub.status)}>
                                            {sub.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {sub.status === 'DRAFT' && (
                                            <>
                                                <button 
                                                    className="btn btn-success btn-small" 
                                                    onClick={() => handleSubmitForReview(sub.id)}
                                                    style={{ marginRight: '8px' }}
                                                >
                                                    Submit
                                                </button>
                                                <button 
                                                    className="btn btn-danger btn-small" 
                                                    onClick={() => handleDelete(sub.id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        {sub.status !== 'DRAFT' && (
                                            <span style={{ color: '#999', fontSize: '0.875rem' }}>
                                                {sub.status === 'SUBMITTED' && 'Awaiting review'}
                                                {sub.status === 'COORDINATOR_APPROVED' && 'With Deputy Dean'}
                                                {sub.status === 'DEAN_ENDORSED' && '✓ Endorsed'}
                                                {sub.status === 'REJECTED' && '✗ Rejected'}
                                            </span>
                                        )}
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

export default MySubmissions;

