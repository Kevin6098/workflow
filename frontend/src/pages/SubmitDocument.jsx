import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submissionAPI, publicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/common/Alert';

function SubmitDocument() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;

    const [sessions, setSessions] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [existingDocuments, setExistingDocuments] = useState({});
    const [pdfModal, setPdfModal] = useState({ open: false, url: '', fileName: '' });

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
        if (isEditMode) {
            loadSubmissionData();
        }
    }, [isEditMode, editId]);

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

    const loadSubmissionData = async () => {
        try {
            const response = await submissionAPI.getSubmission(editId);
            const submission = response.data.submission;

            // Pre-populate form data
            setFormData({
                session_id: submission.session_id,
                department_id: submission.department_id,
                course_id: submission.course_id,
                type_of_study: submission.type_of_study
            });

            // Load existing documents
            const docs = {};
            const na = {};
            if (submission.documents) {
                submission.documents.forEach(doc => {
                    if (doc.file_path) {
                        // Use file_name if available, otherwise extract from path
                        const fileName = doc.file_name || doc.file_path.split('/').pop();
                        docs[doc.document_type] = { 
                            name: fileName, 
                            uploaded: true,
                            docId: doc.id,
                            filePath: doc.file_path
                        };
                    }
                    na[doc.document_type] = doc.not_applicable || false;
                });
            }
            setExistingDocuments(docs);
            setNotApplicable(na);

        } catch (error) {
            console.error('Error loading submission:', error);
            setAlert({ type: 'error', message: 'Error loading submission data' });
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

    const handleViewPdf = async (docId, fileName) => {
        try {
            // Fetch PDF with authentication using the API service
            const response = await submissionAPI.downloadDocument(docId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            
            setPdfModal({
                open: true,
                url: blobUrl,
                fileName: fileName
            });
        } catch (error) {
            console.error('Error loading PDF:', error);
            setAlert({ type: 'error', message: 'Error loading PDF document' });
        }
    };

    const closePdfModal = () => {
        // Clean up blob URL to prevent memory leaks
        if (pdfModal.url && pdfModal.url.startsWith('blob:')) {
            URL.revokeObjectURL(pdfModal.url);
        }
        setPdfModal({ open: false, url: '', fileName: '' });
    };

    const handleRemoveFile = async (docType, docId) => {
        if (!window.confirm('Are you sure you want to remove this file?')) return;

        try {
            await submissionAPI.deleteDocument(editId, docId);
            
            // Remove from existingDocuments state
            setExistingDocuments(prev => {
                const updated = { ...prev };
                delete updated[docType];
                return updated;
            });
            
            setAlert({ type: 'success', message: 'File removed successfully' });
        } catch (error) {
            console.error('Error removing file:', error);
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error removing file' });
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

            let submissionId;
            
            if (isEditMode) {
                // Step 1: Update existing submission
                await submissionAPI.updateSubmission(editId, formData);
                submissionId = editId;
            } else {
                // Step 1: Create new submission
                const response = await submissionAPI.createSubmission(formData);
                submissionId = response.data.submissionId;
            }

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
                setAlert({ type: 'success', message: isEditMode ? 'Document updated and submitted for review successfully!' : 'Document submitted for review successfully!' });
            } else {
                setAlert({ type: 'success', message: isEditMode ? 'Document updated successfully!' : 'Document saved as draft successfully!' });
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
                <h3>{isEditMode ? 'Edit Submission' : 'QP Repository Information Form'}</h3>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <label htmlFor={doc.key} className="file-upload-btn">
                                    {files[doc.key] 
                                        ? files[doc.key].name 
                                        : existingDocuments[doc.key]?.uploaded
                                            ? `✓ ${existingDocuments[doc.key].name}`
                                            : 'Click here to attach a file'}
                                </label>
                                {existingDocuments[doc.key]?.uploaded && (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleViewPdf(existingDocuments[doc.key].docId, existingDocuments[doc.key].name)}
                                            style={{ 
                                                fontSize: '0.875rem', 
                                                color: '#3B82F6', 
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                textAlign: 'left',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            👁️ View PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(doc.key, existingDocuments[doc.key].docId)}
                                            style={{ 
                                                fontSize: '0.875rem', 
                                                color: '#EF4444', 
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                textAlign: 'left',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                )}
                            </div>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <label htmlFor={doc.key} className="file-upload-btn">
                                    {files[doc.key] 
                                        ? files[doc.key].name 
                                        : existingDocuments[doc.key]?.uploaded
                                            ? `✓ ${existingDocuments[doc.key].name}`
                                            : 'Click here to attach a file'}
                                </label>
                                {existingDocuments[doc.key]?.uploaded && (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleViewPdf(existingDocuments[doc.key].docId, existingDocuments[doc.key].name)}
                                            style={{ 
                                                fontSize: '0.875rem', 
                                                color: '#3B82F6', 
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                textAlign: 'left',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            👁️ View PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(doc.key, existingDocuments[doc.key].docId)}
                                            style={{ 
                                                fontSize: '0.875rem', 
                                                color: '#EF4444', 
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                textAlign: 'left',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                )}
                            </div>
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
                    {loading ? 'Submitting...' : isEditMode ? 'Update and Submit for Review' : 'Submit for Review'}
                </button>
            </div>

            {/* PDF Viewer Modal */}
            {pdfModal.open && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '20px'
                    }}
                    onClick={closePdfModal}
                >
                    <div 
                        style={{
                            background: 'white',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '1200px',
                            height: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#1f2937' }}>
                                {pdfModal.fileName}
                            </h3>
                            <button
                                onClick={closePdfModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                                onMouseOut={(e) => e.target.style.background = 'none'}
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* PDF Viewer */}
                        <div style={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f3f4f6'
                        }}>
                            <iframe
                                src={pdfModal.url}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                                title="PDF Viewer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubmitDocument;

