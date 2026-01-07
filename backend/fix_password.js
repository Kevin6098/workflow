import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

// Database connection (update if needed)
const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'workflow_system'
});

try {
    console.log('🔧 Fixing password for admin users...\n');

    // Generate new password hash for 'admin123'
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('Generated hash:', passwordHash);
    console.log('');

    // Update admin user
    await connection.query(
        `UPDATE users SET password = ? WHERE email = 'admin@test.com'`,
        [passwordHash]
    );
    console.log('✅ Updated admin@test.com password');

    // Update lecturer user
    await connection.query(
        `UPDATE users SET password = ? WHERE email = 'lecturer@test.com'`,
        [passwordHash]
    );
    console.log('✅ Updated lecturer@test.com password');

    // Verify
    const [admin] = await connection.query(
        `SELECT id, email, name FROM users WHERE email = 'admin@test.com'`
    );
    console.log('\n📋 User verification:');
    console.log(admin[0]);

    console.log('\n✅ Password fix complete!');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('\n  OR');
    console.log('  Email: lecturer@test.com');
    console.log('  Password: admin123');

} catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
        console.error('\n⚠️  Database "workflow_system" not found!');
        console.error('   Please import database/schema.sql first in phpMyAdmin.');
    } else if (error.code === 'ECONNREFUSED') {
        console.error('\n⚠️  Cannot connect to MySQL!');
        console.error('   Make sure XAMPP MySQL is running.');
    }
} finally {
    await connection.end();
}

