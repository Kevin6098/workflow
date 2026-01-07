import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Alert from '../../components/common/Alert';

function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [filters, setFilters] = useState({
        action: '',
        entity_type: '',
        user_id: ''
    });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [logsRes, usersRes] = await Promise.all([
                adminAPI.getAuditLogs(filters),
                adminAPI.getUsers()
            ]);
            setLogs(logsRes.data.logs);
            setUsers(usersRes.data.users);
        } catch (error) {
            console.error('Error loading audit logs:', error);
            setAlert({ type: 'error', message: 'Error loading audit logs' });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        setLoading(true);
        loadData();
    };

    const clearFilters = () => {
        setFilters({ action: '', entity_type: '', user_id: '' });
        setLoading(true);
        setTimeout(loadData, 100);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadge = (action) => {
        const actionStyles = {
            'CREATE': { bg: '#D1FAE5', color: '#065F46' },
            'UPDATE': { bg: '#DBEAFE', color: '#1E40AF' },
            'DELETE': { bg: '#FEE2E2', color: '#991B1B' },
            'LOGIN': { bg: '#E5E7EB', color: '#374151' },
            'SUBMIT': { bg: '#FEF3C7', color: '#92400E' },
            'APPROVE': { bg: '#D1FAE5', color: '#065F46' },
            'REJECT': { bg: '#FEE2E2', color: '#991B1B' },
            'ENDORSE': { bg: '#EDE9FE', color: '#6B21A8' },
            'GRANT_PRIVILEGE': { bg: '#DBEAFE', color: '#1E40AF' },
            'REVOKE_PRIVILEGE': { bg: '#FEE2E2', color: '#991B1B' }
        };
        const style = actionStyles[action] || { bg: '#E5E7EB', color: '#374151' };
        return (
            <span className="badge" style={{ background: style.bg, color: style.color }}>
                {action}
            </span>
        );
    };

    const getEntityBadge = (entityType) => {
        const entityStyles = {
            'user': { bg: '#DBEAFE', color: '#1E40AF' },
            'session': { bg: '#FEF3C7', color: '#92400E' },
            'department': { bg: '#D1FAE5', color: '#065F46' },
            'course': { bg: '#EDE9FE', color: '#6B21A8' },
            'submission': { bg: '#FEE2E2', color: '#991B1B' },
            'course_role_map': { bg: '#E5E7EB', color: '#374151' },
            'privilege': { bg: '#FFEDD5', color: '#9A3412' }
        };
        const style = entityStyles[entityType] || { bg: '#E5E7EB', color: '#374151' };
        return (
            <span className="badge" style={{ background: style.bg, color: style.color }}>
                {entityType}
            </span>
        );
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="card-header">
                <h2>Audit Log</h2>
                <span style={{ color: '#666' }}>{logs.length} entries</span>
            </div>

            {alert.message && <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />}

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Filters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Action</label>
                        <select name="action" value={filters.action} onChange={handleFilterChange}>
                            <option value="">All Actions</option>
                            <option value="CREATE">CREATE</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                            <option value="LOGIN">LOGIN</option>
                            <option value="SUBMIT">SUBMIT</option>
                            <option value="APPROVE">APPROVE</option>
                            <option value="REJECT">REJECT</option>
                            <option value="ENDORSE">ENDORSE</option>
                            <option value="GRANT_PRIVILEGE">GRANT_PRIVILEGE</option>
                            <option value="REVOKE_PRIVILEGE">REVOKE_PRIVILEGE</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Entity Type</label>
                        <select name="entity_type" value={filters.entity_type} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            <option value="user">User</option>
                            <option value="session">Session</option>
                            <option value="department">Department</option>
                            <option value="course">Course</option>
                            <option value="submission">Submission</option>
                            <option value="course_role_map">Course Role Map</option>
                            <option value="privilege">Privilege</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>User</label>
                        <select name="user_id" value={filters.user_id} onChange={handleFilterChange}>
                            <option value="">All Users</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={applyFilters}>
                        Apply Filters
                    </button>
                    <button className="btn btn-secondary" style={{ marginLeft: '8px' }} onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>Entity ID</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                    No audit logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <span style={{ whiteSpace: 'nowrap' }}>
                                            {formatDate(log.created_at)}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{log.user_name}</strong>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#666' }}>{log.user_email}</span>
                                    </td>
                                    <td>{getActionBadge(log.action)}</td>
                                    <td>{getEntityBadge(log.entity_type)}</td>
                                    <td>
                                        <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                                            {log.entity_id}
                                        </code>
                                    </td>
                                    <td>
                                        {log.details ? (
                                            <pre style={{ 
                                                margin: 0, 
                                                fontSize: '0.75rem', 
                                                maxWidth: '300px', 
                                                overflow: 'auto',
                                                background: '#F9FAFB',
                                                padding: '4px 8px',
                                                borderRadius: '4px'
                                            }}>
                                                {typeof log.details === 'string' 
                                                    ? log.details 
                                                    : JSON.stringify(log.details, null, 2)
                                                }
                                            </pre>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
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

export default AuditLog;
