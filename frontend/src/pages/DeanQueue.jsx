import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import Alert from '../components/common/Alert';

function DeanQueue() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const response = await reviewAPI.getDeputyDeanQueue();
            setSubmissions(response.data.submissions);
        } catch (error) {
            console.error('Error loading queue:', error);
            setAlert({ type: 'error', message: 'Error loading queue' });
        } finally {
            setLoading(false);
        }
    };

    const handleEndorse = async (id) => {
        if (!window.confirm('Endorse this submission?')) return;

        try {
            await reviewAPI.deputyDeanEndorse(id);
            setAlert({ type: 'success', message: 'Submission endorsed successfully' });
            loadQueue();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error endorsing submission' });
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Please enter rejection reason:');
        if (!reason) return;

        try {
            await reviewAPI.deputyDeanReject(id, reason);
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
            <h2 style={{ marginBottom: '24px' }}>Deputy Dean Endorsement Queue</h2>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {submissions.length === 0 ? (
                <div className="card">
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        No submissions pending endorsement
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
                                <th>Approved Date</th>
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
                                    <td>{new Date(sub.coordinator_approved_at).toLocaleDateString()}</td>
                                    <td>
                                        <button 
                                            className="btn btn-success btn-small" 
                                            onClick={() => handleEndorse(sub.id)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            Endorse
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

export default DeanQueue;

