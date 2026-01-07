import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Alert from '../../components/common/Alert';

function CourseManagement() {
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        department_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, deptsRes] = await Promise.all([
                adminAPI.getCourses(),
                adminAPI.getDepartments()
            ]);
            setCourses(coursesRes.data.courses);
            setDepartments(deptsRes.data.departments.filter(d => d.active));
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
        
        if (!formData.code || !formData.name || !formData.department_id) {
            setAlert({ type: 'error', message: 'All fields are required' });
            return;
        }

        try {
            if (editingId) {
                await adminAPI.updateCourse(editingId, { ...formData, active: true });
                setAlert({ type: 'success', message: 'Course updated successfully' });
            } else {
                await adminAPI.createCourse(formData);
                setAlert({ type: 'success', message: 'Course created successfully' });
            }
            resetForm();
            loadData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error saving course' });
        }
    };

    const handleEdit = (course) => {
        setFormData({ 
            code: course.code, 
            name: course.name, 
            department_id: course.department_id 
        });
        setEditingId(course.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;

        try {
            await adminAPI.deleteCourse(id);
            setAlert({ type: 'success', message: 'Course deleted successfully' });
            loadData();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error deleting course' });
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', department_id: '' });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>Course Management</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? 'Cancel' : '+ Add Course'}
                </button>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>{editingId ? 'Edit Course' : 'Add New Course'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Course Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="e.g., BPMN3123"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Course Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Strategic Management"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Department</label>
                                <select
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.code} - {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">
                            {editingId ? 'Update Course' : 'Create Course'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn btn-secondary" style={{ marginLeft: '8px' }} onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>
            )}

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    No courses found. Click "Add Course" to create one.
                                </td>
                            </tr>
                        ) : (
                            courses.map(course => (
                                <tr key={course.id}>
                                    <td>{course.id}</td>
                                    <td><strong>{course.code}</strong></td>
                                    <td>{course.name}</td>
                                    <td>
                                        <span className="badge" style={{ background: '#E5E7EB', color: '#374151' }}>
                                            {course.department_code}
                                        </span>
                                        <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.875rem' }}>
                                            {course.department_name}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${course.active ? 'dean-endorsed' : 'rejected'}`}>
                                            {course.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-small" 
                                            style={{ marginRight: '8px' }}
                                            onClick={() => handleEdit(course)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-small" 
                                            onClick={() => handleDelete(course.id)}
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

export default CourseManagement;
