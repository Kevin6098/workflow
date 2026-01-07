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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'DRAFT': { class: 'draft', label: 'Draft' },
            'SUBMITTED': { class: 'submitted', label: 'Submitted' },
            'COORDINATOR_APPROVED': { class: 'coordinator-approved', label: 'Coord. Approved' },
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

    // Document types to show in the table
    const documentTypes = [
        { key: 'FINAL_EXAM_QUESTION', label: 'Final Exam Q' },
        { key: 'FINAL_EXAM_ANSWER', label: 'Final Exam A' },
        { key: 'APPOINTMENT_LETTER', label: 'Appt. Letter' },
        { key: 'TEACHING_SCHEDULE', label: 'Schedule' },
        { key: 'COURSE_SYLLABUS', label: 'Syllabus' },
        { key: 'SCHEME_OF_WORK', label: 'SOW' },
        { key: 'MIDSEM_QUESTION', label: 'MidSem Q' },
        { key: 'MIDSEM_ANSWER', label: 'MidSem A' }
    ];

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
                                {documentTypes.map(dt => (
                                    <th key={dt.key} style={{ fontSize: '0.75rem', textAlign: 'center' }}>{dt.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={7 + documentTypes.length} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
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
                                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(sub.created_at)}</td>
                                        {documentTypes.map(dt => (
                                            <td key={dt.key} style={{ textAlign: 'center' }}>
                                                {sub.document_checks && sub.document_checks[dt.key] ? (
                                                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                                                ) : (
                                                    <span style={{ color: '#D1D5DB' }}>-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ReviewDashboard;
