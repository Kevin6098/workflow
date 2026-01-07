import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Alert from '../../components/common/Alert';

function DepartmentManagement() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: ''
    });

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const response = await adminAPI.getDepartments();
            setDepartments(response.data.departments);
        } catch (error) {
            console.error('Error loading departments:', error);
            setAlert({ type: 'error', message: 'Error loading departments' });
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
        
        if (!formData.code || !formData.name) {
            setAlert({ type: 'error', message: 'All fields are required' });
            return;
        }

        try {
            if (editingId) {
                await adminAPI.updateDepartment(editingId, { ...formData, active: true });
                setAlert({ type: 'success', message: 'Department updated successfully' });
            } else {
                await adminAPI.createDepartment(formData);
                setAlert({ type: 'success', message: 'Department created successfully' });
            }
            resetForm();
            loadDepartments();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error saving department' });
        }
    };

    const handleEdit = (department) => {
        setFormData({ code: department.code, name: department.name });
        setEditingId(department.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department? This will also delete all associated courses.')) return;

        try {
            await adminAPI.deleteDepartment(id);
            setAlert({ type: 'success', message: 'Department deleted successfully' });
            loadDepartments();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error deleting department' });
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '' });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>Department Management</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? 'Cancel' : '+ Add Department'}
                </button>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>{editingId ? 'Edit Department' : 'Add New Department'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Department Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="e.g., OYAGSB"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Department Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Graduate School of Business"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">
                            {editingId ? 'Update Department' : 'Create Department'}
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
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    No departments found. Click "Add Department" to create one.
                                </td>
                            </tr>
                        ) : (
                            departments.map(dept => (
                                <tr key={dept.id}>
                                    <td>{dept.id}</td>
                                    <td><strong>{dept.code}</strong></td>
                                    <td>{dept.name}</td>
                                    <td>
                                        <span className={`badge ${dept.active ? 'dean-endorsed' : 'rejected'}`}>
                                            {dept.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-small" 
                                            style={{ marginRight: '8px' }}
                                            onClick={() => handleEdit(dept)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-small" 
                                            onClick={() => handleDelete(dept.id)}
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

export default DepartmentManagement;
