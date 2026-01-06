import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';

function ReviewDashboard() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const response = await reviewAPI.getAllSubmissions();
            setSubmissions(response.data.submissions);
        } catch (error) {
            console.error('Error loading submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Review Dashboard</h2>

            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>File Name</th>
                                <th>Created By</th>
                                <th>Created At</th>
                                <th>Session</th>
                                <th>Subject Code</th>
                                <th>Type of Study</th>
                                <th>Final Exam Q</th>
                                <th>Appt Letter</th>
                                <th>Teaching Sch</th>
                                <th>SOW</th>
                                <th>Midsem Q&A</th>
                                <th>Lecturer</th>
                                <th>Dept</th>
                                <th>Syllabus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub.id}>
                                    <td>📄</td>
                                    <td>{sub.course_code}</td>
                                    <td>{sub.lecturer_name}</td>
                                    <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                                    <td>{sub.session_code}</td>
                                    <td>{sub.course_code}</td>
                                    <td>{sub.type_of_study}</td>
                                    <td>{sub.document_checks?.QP004_FINAL_QUESTION ? 'Yes' : 'No'}</td>
                                    <td>{sub.document_checks?.QP005_APPOINTMENT ? 'Yes' : 'No'}</td>
                                    <td>{sub.document_checks?.QP005_SCHEDULE ? 'Yes' : 'No'}</td>
                                    <td>{sub.document_checks?.QP005_SOW ? 'Yes' : 'No'}</td>
                                    <td>{sub.document_checks?.QP005_MIDSEM_QUESTION ? 'Yes' : 'No'}</td>
                                    <td>{sub.lecturer_name}</td>
                                    <td>{sub.department_code}</td>
                                    <td>{sub.document_checks?.QP005_SYLLABUS ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ReviewDashboard;

