import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Alert from '../../components/common/Alert';

function CourseRoleMapping() {
    const [mappings, setMappings] = useState([]);
    const [courses, setCourses] = useState([]);
    const [coordinators, setCoordinators] = useState([]);
    const [deputyDeans, setDeputyDeans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        course_id: '',
        coordinator_user_id: '',
        deputy_dean_user_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [mappingsRes, coursesRes, usersRes] = await Promise.all([
                adminAPI.getCourseRoleMappings(),
                adminAPI.getCourses(),
                adminAPI.getUsers()
            ]);

            setMappings(mappingsRes.data.mappings);
            setCourses(coursesRes.data.courses.filter(c => c.active));
            
            // Filter users by privilege
            const users = usersRes.data.users;
            setCoordinators(users.filter(u => u.privileges && u.privileges.includes('COORDINATOR')));
            setDeputyDeans(users.filter(u => u.privileges && u.privileges.includes('DEPUTY_DEAN')));
        } catch (error) {
            console.error('Error loading data:', error);
            setAlert({ type: 'error', message: 'Error loading data' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.course_id) {
            setAlert({ type: 'error', message: 'Please select a course' });
            return;
        }

        if (!formData.coordinator_user_id && !formData.deputy_dean_user_id) {
            setAlert({ type: 'error', message: 'Please assign at least one role (Coordinator or Deputy Dean)' });
            return;
        }

        try {
            await adminAPI.saveCourseRoleMapping(formData);
            setAlert({ type: 'success', message: 'Course role mapping saved successfully' });
            resetForm();
            loadData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error saving mapping' });
        }
    };

    const handleEdit = (mapping) => {
        setFormData({ 
            course_id: mapping.course_id,
            coordinator_user_id: mapping.coordinator_user_id || '',
            deputy_dean_user_id: mapping.deputy_dean_user_id || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this mapping?')) return;

        try {
            await adminAPI.deleteCourseRoleMapping(id);
            setAlert({ type: 'success', message: 'Mapping deleted successfully' });
            loadData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error deleting mapping' });
        }
    };

    const resetForm = () => {
        setFormData({ course_id: '', coordinator_user_id: '', deputy_dean_user_id: '' });
        setShowForm(false);
    };

    // Get courses that don't have mappings yet
    const unmappedCourses = courses.filter(
        course => !mappings.some(m => m.course_id === course.id)
    );

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>Course Role Mapping</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? 'Cancel' : '+ Add Mapping'}
                </button>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            <div className="card" style={{ marginBottom: '24px', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                <p style={{ margin: 0 }}>
                    <strong>ℹ️ How it works:</strong><br />
                    1. Assign a <strong>Course Coordinator</strong> to approve submissions for a course<br />
                    2. Assign a <strong>Deputy Dean</strong> to endorse submissions after coordinator approval<br />
                    3. Users must have the corresponding privilege (COORDINATOR or DEPUTY_DEAN) to be assignable<br />
                    4. You can grant privileges in <a href="/admin/users">User Management</a>
                </p>
            </div>

            {coordinators.length === 0 && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    ⚠️ No users with COORDINATOR privilege found. <a href="/admin/users">Grant COORDINATOR privilege to users first.</a>
                </div>
            )}

            {deputyDeans.length === 0 && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    ⚠️ No users with DEPUTY_DEAN privilege found. <a href="/admin/users">Grant DEPUTY_DEAN privilege to users first.</a>
                </div>
            )}

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>Assign Roles to Course</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Course *</label>
                                <select
                                    name="course_id"
                                    value={formData.course_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Course</option>
                                    {(formData.course_id ? courses : unmappedCourses).map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>
                                    Course Coordinator 
                                    <span style={{ color: '#FEF3C7', background: '#92400E', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '8px' }}>
                                        Approves
                                    </span>
                                </label>
                                <select
                                    name="coordinator_user_id"
                                    value={formData.coordinator_user_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Coordinator</option>
                                    {coordinators.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>
                                    Deputy Dean 
                                    <span style={{ color: '#EDE9FE', background: '#6B21A8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '8px' }}>
                                        Endorses
                                    </span>
                                </label>
                                <select
                                    name="deputy_dean_user_id"
                                    value={formData.deputy_dean_user_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Deputy Dean</option>
                                    {deputyDeans.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">
                            Save Mapping
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ marginLeft: '8px' }} onClick={resetForm}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Course Coordinator</th>
                            <th>Deputy Dean</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mappings.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    No course role mappings found. Click "Add Mapping" to create one.
                                </td>
                            </tr>
                        ) : (
                            mappings.map(mapping => (
                                <tr key={mapping.id}>
                                    <td>
                                        <strong>{mapping.course_code}</strong>
                                        <br />
                                        <span style={{ color: '#666', fontSize: '0.875rem' }}>{mapping.course_name}</span>
                                    </td>
                                    <td>
                                        {mapping.coordinator_name ? (
                                            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                                {mapping.coordinator_name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>Not assigned</span>
                                        )}
                                    </td>
                                    <td>
                                        {mapping.deputy_dean_name ? (
                                            <span className="badge" style={{ background: '#EDE9FE', color: '#6B21A8' }}>
                                                {mapping.deputy_dean_name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>Not assigned</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${mapping.active ? 'dean-endorsed' : 'rejected'}`}>
                                            {mapping.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-small" 
                                            style={{ marginRight: '8px' }}
                                            onClick={() => handleEdit(mapping)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-small" 
                                            onClick={() => handleDelete(mapping.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CourseRoleMapping;
