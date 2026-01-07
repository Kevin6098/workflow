import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Alert from '../../components/common/Alert';

function SessionManagement() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: ''
    });

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await adminAPI.getSessions();
            setSessions(response.data.sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
            setAlert({ type: 'error', message: 'Error loading sessions' });
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
                await adminAPI.updateSession(editingId, { ...formData, active: true });
                setAlert({ type: 'success', message: 'Session updated successfully' });
            } else {
                await adminAPI.createSession(formData);
                setAlert({ type: 'success', message: 'Session created successfully' });
            }
            resetForm();
            loadSessions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error saving session' });
        }
    };

    const handleEdit = (session) => {
        setFormData({ code: session.code, name: session.name });
        setEditingId(session.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;

        try {
            await adminAPI.deleteSession(id);
            setAlert({ type: 'success', message: 'Session deleted successfully' });
            loadSessions();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error deleting session' });
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
                <h2>Session Management</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? 'Cancel' : '+ Add Session'}
                </button>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>{editingId ? 'Edit Session' : 'Add New Session'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Session Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="e.g., A251"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Session Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Semester 1 2025/2026"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">
                            {editingId ? 'Update Session' : 'Create Session'}
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
                        {sessions.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    No sessions found. Click "Add Session" to create one.
                                </td>
                            </tr>
                        ) : (
                            sessions.map(session => (
                                <tr key={session.id}>
                                    <td>{session.id}</td>
                                    <td><strong>{session.code}</strong></td>
                                    <td>{session.name}</td>
                                    <td>
                                        <span className={`badge ${session.active ? 'dean-endorsed' : 'rejected'}`}>
                                            {session.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-small" 
                                            style={{ marginRight: '8px' }}
                                            onClick={() => handleEdit(session)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-small" 
                                            onClick={() => handleDelete(session.id)}
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

export default SessionManagement;
