import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Alert from '../../components/common/Alert';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await adminAPI.getUsers();
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error loading users:', error);
            setAlert({ type: 'error', message: 'Error loading users' });
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
        
        if (!formData.name || !formData.email || !formData.password) {
            setAlert({ type: 'error', message: 'All fields are required' });
            return;
        }

        try {
            await adminAPI.createUser(formData);
            setAlert({ type: 'success', message: 'User created successfully' });
            setFormData({ name: '', email: '', password: '' });
            setShowForm(false);
            loadUsers();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error creating user' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await adminAPI.deleteUser(id);
            setAlert({ type: 'success', message: 'User deleted successfully' });
            loadUsers();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error deleting user' });
        }
    };

    const handleGrantPrivilege = async (userId, privilege) => {
        try {
            await adminAPI.grantPrivilege(userId, privilege);
            setAlert({ type: 'success', message: `${privilege} privilege granted` });
            loadUsers();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error granting privilege' });
        }
    };

    const handleRevokePrivilege = async (userId, privilege) => {
        if (!window.confirm(`Revoke ${privilege} privilege from this user?`)) return;

        try {
            await adminAPI.revokePrivilege(userId, privilege);
            setAlert({ type: 'success', message: `${privilege} privilege revoked` });
            loadUsers();
        } catch (error) {
            setAlert({ type: 'error', message: error.response?.data?.error || 'Error revoking privilege' });
        }
    };

    const hasPrivilege = (user, privilege) => {
        return user.privileges && user.privileges.includes(privilege);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>User Management</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add User'}
                </button>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>Add New User</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">Create User</button>
                    </form>
                </div>
            )}

            <div className="card">
                <p style={{ marginBottom: '16px', color: '#666' }}>
                    <strong>Privileges:</strong> 
                    <span style={{ marginLeft: '12px' }}>
                        <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', marginRight: '8px' }}>COORDINATOR</span> = Can approve submissions
                    </span>
                    <span style={{ marginLeft: '12px' }}>
                        <span className="badge" style={{ background: '#EDE9FE', color: '#6B21A8', marginRight: '8px' }}>DEPUTY_DEAN</span> = Can endorse submissions
                    </span>
                    <span style={{ marginLeft: '12px' }}>
                        <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>ADMIN</span> = Full system access
                    </span>
                </p>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Privileges</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF', marginRight: '4px' }}>
                                        LECTURER
                                    </span>
                                    {hasPrivilege(user, 'COORDINATOR') && (
                                        <span 
                                            className="badge" 
                                            style={{ background: '#FEF3C7', color: '#92400E', marginRight: '4px', cursor: 'pointer' }}
                                            onClick={() => handleRevokePrivilege(user.id, 'COORDINATOR')}
                                            title="Click to revoke"
                                        >
                                            COORDINATOR ×
                                        </span>
                                    )}
                                    {hasPrivilege(user, 'DEPUTY_DEAN') && (
                                        <span 
                                            className="badge" 
                                            style={{ background: '#EDE9FE', color: '#6B21A8', marginRight: '4px', cursor: 'pointer' }}
                                            onClick={() => handleRevokePrivilege(user.id, 'DEPUTY_DEAN')}
                                            title="Click to revoke"
                                        >
                                            DEPUTY_DEAN ×
                                        </span>
                                    )}
                                    {hasPrivilege(user, 'ADMIN') && (
                                        <span 
                                            className="badge" 
                                            style={{ background: '#FEE2E2', color: '#991B1B', cursor: 'pointer' }}
                                            onClick={() => handleRevokePrivilege(user.id, 'ADMIN')}
                                            title="Click to revoke"
                                        >
                                            ADMIN ×
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {!hasPrivilege(user, 'COORDINATOR') && (
                                            <button 
                                                className="btn btn-small" 
                                                style={{ background: '#FEF3C7', color: '#92400E', border: 'none' }}
                                                onClick={() => handleGrantPrivilege(user.id, 'COORDINATOR')}
                                            >
                                                + Coordinator
                                            </button>
                                        )}
                                        {!hasPrivilege(user, 'DEPUTY_DEAN') && (
                                            <button 
                                                className="btn btn-small" 
                                                style={{ background: '#EDE9FE', color: '#6B21A8', border: 'none' }}
                                                onClick={() => handleGrantPrivilege(user.id, 'DEPUTY_DEAN')}
                                            >
                                                + Deputy Dean
                                            </button>
                                        )}
                                        {!hasPrivilege(user, 'ADMIN') && (
                                            <button 
                                                className="btn btn-small" 
                                                style={{ background: '#FEE2E2', color: '#991B1B', border: 'none' }}
                                                onClick={() => handleGrantPrivilege(user.id, 'ADMIN')}
                                            >
                                                + Admin
                                            </button>
                                        )}
                                        <button 
                                            className="btn btn-danger btn-small" 
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;
