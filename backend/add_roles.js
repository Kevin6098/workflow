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
    console.log('🔧 Adding Coordinator and Deputy Dean users...\n');

    // Generate password hash for 'password123'
    const passwordHash = await bcrypt.hash('password123', 10);

    // Add Course Coordinator user
    const [coordResult] = await connection.query(
        `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        ['Dr. Sarah Coordinator', 'coordinator@test.com', passwordHash]
    );
    
    let coordId;
    if (coordResult.insertId) {
        coordId = coordResult.insertId;
        console.log('✅ Created user: Dr. Sarah Coordinator (coordinator@test.com)');
    } else {
        const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', ['coordinator@test.com']);
        coordId = existing[0].id;
        console.log('ℹ️  User coordinator@test.com already exists');
    }

    // Grant COORDINATOR privilege
    await connection.query(
        `INSERT INTO user_privileges (user_id, privilege, active) VALUES (?, 'COORDINATOR', TRUE)
         ON DUPLICATE KEY UPDATE active = TRUE`,
        [coordId]
    );
    console.log('✅ Granted COORDINATOR privilege');

    // Add Deputy Dean user
    const [deanResult] = await connection.query(
        `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        ['Prof. Ahmad Deputy Dean', 'dean@test.com', passwordHash]
    );
    
    let deanId;
    if (deanResult.insertId) {
        deanId = deanResult.insertId;
        console.log('✅ Created user: Prof. Ahmad Deputy Dean (dean@test.com)');
    } else {
        const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', ['dean@test.com']);
        deanId = existing[0].id;
        console.log('ℹ️  User dean@test.com already exists');
    }

    // Grant DEPUTY_DEAN privilege
    await connection.query(
        `INSERT INTO user_privileges (user_id, privilege, active) VALUES (?, 'DEPUTY_DEAN', TRUE)
         ON DUPLICATE KEY UPDATE active = TRUE`,
        [deanId]
    );
    console.log('✅ Granted DEPUTY_DEAN privilege');

    // Create a course role mapping for the first course
    const [courses] = await connection.query('SELECT id, code, name FROM courses LIMIT 1');
    if (courses.length > 0) {
        await connection.query(
            `INSERT INTO course_role_map (course_id, coordinator_user_id, deputy_dean_user_id, active)
             VALUES (?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE coordinator_user_id = VALUES(coordinator_user_id), deputy_dean_user_id = VALUES(deputy_dean_user_id)`,
            [courses[0].id, coordId, deanId]
        );
        console.log(`\n✅ Mapped roles to course: ${courses[0].code} - ${courses[0].name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Setup complete! You can now login with:');
    console.log('='.repeat(60));
    console.log('\n📋 COURSE COORDINATOR (can APPROVE submissions):');
    console.log('   Email: coordinator@test.com');
    console.log('   Password: password123');
    console.log('\n📋 DEPUTY DEAN (can ENDORSE submissions):');
    console.log('   Email: dean@test.com');
    console.log('   Password: password123');
    console.log('\n📋 ADMIN (full access):');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('\n📋 LECTURER (submit documents):');
    console.log('   Email: lecturer@test.com');
    console.log('   Password: admin123');
    console.log('');

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

