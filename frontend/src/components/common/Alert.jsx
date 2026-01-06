function Alert({ type = 'info', message, onClose }) {
    if (!message) return null;

    return (
        <div className={`alert alert-${type}`}>
            <span>{message}</span>
            {onClose && (
                <button 
                    onClick={onClose}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    ×
                </button>
            )}
        </div>
    );
}

export default Alert;

