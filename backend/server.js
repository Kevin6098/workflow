import app from './app.js';
import { testConnection } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
testConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
        console.log('');
        console.log('Available endpoints:');
        console.log('  - POST   /api/auth/login');
        console.log('  - GET    /api/auth/me');
        console.log('  - GET    /api/submissions');
        console.log('  - POST   /api/submissions');
        console.log('  - GET    /api/reviews/coordinator/queue');
        console.log('  - GET    /api/reviews/dean/queue');
        console.log('  - GET    /api/admin/users');
        console.log('  - GET    /api/admin/sessions');
        console.log('  - GET    /api/admin/departments');
        console.log('  - GET    /api/admin/courses');
        console.log('  - GET    /api/admin/course-roles');
        console.log('  ... and more');
        console.log('');
        console.log('💡 Test connection: http://localhost:' + PORT + '/api/health');
    });
}).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

