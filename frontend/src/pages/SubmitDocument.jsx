import { useState, useEffect } from 'react';
import { submissionAPI, publicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/common/Alert';

function SubmitDocument() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        session_id: '',
        department_id: '',
        course_id: '',
        type_of_study: 'Undergraduate'
    });

    // Document types as per QP requirement
    const documentTypes = {
        qp004: [
            { key: 'QP004_TEST_SPEC', label: 'QP004: Test Specification Table', required: true },
            { key: 'QP004_FINAL_QUESTION', label: 'QP004: Final Examination Question', required: true },
            { key: 'QP004_FINAL_ANSWER', label: 'QP004: Final Examination Answer Scheme', required: true }
        ],
        qp005: [
            { key: 'QP005_APPOINTMENT', label: 'QP005: Lecturer\'s Appointment Letter', required: true },
            { key: 'QP005_SCHEDULE', label: 'QP005: Teaching Schedule and Consultation Time', required: true },
            { key: 'QP005_SYLLABUS', label: 'QP005: Course Syllabus', required: true },
            { key: 'QP005_SOW', label: 'QP005: Scheme of Work (SOW)', required: true },
            { key: 'QP005_ASSIGNMENT', label: 'QP005: Assignment', required: false },
            { key: 'QP005_TUTORIAL', label: 'QP005: Tutorial', required: false },
            { key: 'QP005_QUIZ', label: 'QP005: Quiz', required: false },
            { key: 'QP005_MIDSEM_QUESTION', label: 'QP005: Mid Semester Exam (Question)', required: true },
            { key: 'QP005_MIDSEM_ANSWER', label: 'QP005: Mid Semester Exam (Answer)', required: true },
            { key: 'QP005_AOL', label: 'QP005: AOL File', required: false }
        ]
    };

    const [files, setFiles] = useState({});
    const [notApplicable, setNotApplicable] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (formData.department_id) {
            const filtered = courses.filter(c => c.department_id === parseInt(formData.department_id));
            setFilteredCourses(filtered);
        } else {
            setFilteredCourses([]);
        }
    }, [formData.department_id, courses]);

    const loadData = async () => {
        try {
            const [sessionsRes, deptsRes, coursesRes] = await Promise.all([
                publicAPI.getSessions(),
                publicAPI.getDepartments(),
                publicAPI.getCourses()
            ]);

            setSessions(sessionsRes.data.sessions.filter(s => s.active));
            setDepartments(deptsRes.data.departments.filter(d => d.active));
            setCourses(coursesRes.data.courses.filter(c => c.active));
        } catch (error) {
            console.error('Error loading data:', error);
            setAlert({ type: 'error', message: 'Error loading form data' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'department_id') {
            setFormData(prev => ({ ...prev, course_id: '' }));
        }
    };

    const handleFileChange = (docType, e) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [docType]: file }));
            setNotApplicable(prev => ({ ...prev, [docType]: false }));
        }
    };

    const handleNotApplicable = (docType, checked) => {
        setNotApplicable(prev => ({ ...prev, [docType]: checked }));
        if (checked) {
            setFiles(prev => ({ ...prev, [docType]: null }));
        }
    };

    const handleSubmit = async (asDraft = true) => {
        setLoading(true);
        setAlert({ type: '', message: '' });

        try {
            // Validate required fields
            if (!formData.session_id || !formData.department_id || !formData.course_id) {
                setAlert({ type: 'error', message: 'Please fill in all course information fields' });
                setLoading(false);
                return;
            }

            // Step 1: Create submission
            const response = await submissionAPI.createSubmission(formData);
            const submissionId = response.data.submissionId;

            // Step 2: Upload files
            for (const [docType, file] of Object.entries(files)) {
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('documentType', docType);
                    await submissionAPI.uploadDocument(submissionId, formData);
                }
            }

            // Step 3: Mark not applicable documents
            for (const [docType, isNA] of Object.entries(notApplicable)) {
                if (isNA) {
                    const formData = new FormData();
                    formData.append('documentType', docType);
                    formData.append('notApplicable', 'true');
                    await submissionAPI.uploadDocument(submissionId, formData);
                }
            }

            // Step 4: Submit for review if not draft
            if (!asDraft) {
                await submissionAPI.submitForReview(submissionId);
                setAlert({ type: 'success', message: 'Document submitted for review successfully!' });
            } else {
                setAlert({ type: 'success', message: 'Document saved as draft successfully!' });
            }

            // Redirect after delay
            setTimeout(() => {
                navigate('/submissions');
            }, 2000);

        } catch (error) {
            console.error('Error submitting:', error);
            setAlert({ 
                type: 'error', 
                message: error.response?.data?.error || 'Error submitting document' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="form-header">
                <h3>QP Repository Information Form</h3>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            <h3>Course Information</h3>

            <div className="form-group">
                <label>Lecturer's Name</label>
                <input type="text" value={user?.name || ''} disabled />
            </div>

            <div className="form-group">
                <label>Session *</label>
                <select name="session_id" value={formData.session_id} onChange={handleChange} required>
                    <option value="">Select session</option>
                    {sessions.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Department *</label>
                <select name="department_id" value={formData.department_id} onChange={handleChange} required>
                    <option value="">Select department</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Course Code *</label>
                <select name="course_id" value={formData.course_id} onChange={handleChange} required disabled={!formData.department_id}>
                    <option value="">Select course</option>
                    {filteredCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Type of Study *</label>
                <select name="type_of_study" value={formData.type_of_study} onChange={handleChange} required>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                </select>
            </div>

            <h3 style={{ marginTop: '32px' }}>QP File Data</h3>

            <div className="file-upload-section">
                <h4>QP004 Series (Examination Documents)</h4>
                {documentTypes.qp004.map(doc => (
                    <div key={doc.key} className="file-upload-item">
                        <label>{doc.label} {doc.required && <span style={{ color: 'red' }}>*</span>}</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input 
                                type="file" 
                                id={doc.key}
                                onChange={(e) => handleFileChange(doc.key, e)}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <label htmlFor={doc.key} className="file-upload-btn">
                                {files[doc.key] ? files[doc.key].name : 'Click here to attach a file'}
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className="file-upload-section">
                <h4>QP005 Series (Course Documents)</h4>
                {documentTypes.qp005.map(doc => (
                    <div key={doc.key} className="file-upload-item">
                        <label>{doc.label} {doc.required && <span style={{ color: 'red' }}>*</span>}</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input 
                                type="file" 
                                id={doc.key}
                                onChange={(e) => handleFileChange(doc.key, e)}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                disabled={notApplicable[doc.key]}
                            />
                            <label htmlFor={doc.key} className="file-upload-btn">
                                {files[doc.key] ? files[doc.key].name : 'Click here to attach a file'}
                            </label>
                            {!doc.required && (
                                <div className="checkbox-na">
                                    <input 
                                        type="checkbox"
                                        checked={notApplicable[doc.key] || false}
                                        onChange={(e) => handleNotApplicable(doc.key, e.target.checked)}
                                    />
                                    <label>Not Applicable</label>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save as Draft'}
                </button>
                <button 
                    className="btn btn-primary" 
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit for Review'}
                </button>
            </div>
        </div>
    );
}

export default SubmitDocument;

