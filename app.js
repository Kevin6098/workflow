// Data Storage
let users = [
    { id: 1, name: "Dr. John Smith", email: "admin@test.com", password: "12345", role: "ADMIN" },
    { id: 2, name: "Dr. Emily Wang", email: "lecturer@test.com", password: "12345", role: "LECTURER" },
    { id: 3, name: "Dr. David Kim", email: "david@university.edu", password: "lecturer123", role: "LECTURER" },
    { id: 4, name: "Prof. Sarah Lee", email: "sarah@university.edu", password: "lecturer123", role: "LECTURER" }
];

let schools = [
    { id: 1, code: "CS", name: "Computer Science" },
    { id: 2, code: "MATH", name: "Mathematics" },
    { id: 3, code: "PHY", name: "Physics" }
];

let courses = [
    { id: "DS101", name: "Data Structures 101", schoolId: 1 },
    { id: "CS201", name: "Algorithms", schoolId: 1 },
    { id: "MATH301", name: "Advanced Calculus", schoolId: 2 },
    { id: "PHY202", name: "Quantum Physics", schoolId: 3 }
];


let courseAssignments = [];
let facultyRoleMap = [];

let auditLogs = [];
let assignmentHistory = [];

let submissions = [];

let currentUser = null;
let selectedDocuments = [];
let isLoggedIn = false;

// Login Functions
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        isLoggedIn = true;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-app').classList.add('active');
        document.getElementById('header-user-name').textContent = user.name;
        updateNavigation();
        renderAllScreens();
        showScreen('my-submissions');
        showAlert('Login successful!', 'success');
    } else {
        showAlert('Invalid email or password', 'error');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Initialize
function init() {
    // Load from storage first
    loadFromStorage();
    
    // Ensure default users exist with correct credentials (double-check after loadFromStorage)
    const adminIndex = users.findIndex(u => u.id === 1);
    if (adminIndex >= 0) {
        users[adminIndex] = { ...users[adminIndex], email: 'admin@test.com', password: '12345', role: 'ADMIN' };
    } else {
        users.unshift({ id: 1, name: "Dr. John Smith", email: "admin@test.com", password: "12345", role: "ADMIN" });
    }
    
    const lecturerIndex = users.findIndex(u => u.id === 2);
    if (lecturerIndex >= 0) {
        users[lecturerIndex] = { ...users[lecturerIndex], email: 'lecturer@test.com', password: '12345', role: 'LECTURER' };
    } else {
        const adminPos = users.findIndex(u => u.id === 1);
        users.splice(adminPos >= 0 ? adminPos + 1 : 0, 0, { id: 2, name: "Dr. Emily Wang", email: "lecturer@test.com", password: "12345", role: "LECTURER" });
    }
    
    // Save updated users to ensure credentials are persisted
    saveToStorage();
    
    // Check if user was previously logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        const user = users.find(u => u.id === userData.id);
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            if (document.getElementById('main-app')) {
                document.getElementById('main-app').classList.add('active');
                document.getElementById('header-user-name').textContent = user.name;
                updateNavigation();
                renderAllScreens();
                showScreen('my-submissions');
            }
        } else {
            // User not found, redirect to login
            window.location.href = 'login.html';
        }
    } else {
        // No saved user, redirect to login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
}

function loadFromStorage() {
    const saved = localStorage.getItem('workflowData');
    if (saved) {
        const data = JSON.parse(saved);
        // Load users from storage
        if (data.users && data.users.length > 0) {
            users = data.users;
        }
        // ALWAYS ensure default admin and lecturer have correct credentials
        const adminIndex = users.findIndex(u => u.id === 1);
        if (adminIndex >= 0) {
            users[adminIndex] = { ...users[adminIndex], email: 'admin@test.com', password: '12345', role: 'ADMIN', name: users[adminIndex].name || 'Dr. John Smith' };
        } else {
            users.unshift({ id: 1, name: "Dr. John Smith", email: "admin@test.com", password: "12345", role: "ADMIN" });
        }
        
        const lecturerIndex = users.findIndex(u => u.id === 2);
        if (lecturerIndex >= 0) {
            users[lecturerIndex] = { ...users[lecturerIndex], email: 'lecturer@test.com', password: '12345', role: 'LECTURER', name: users[lecturerIndex].name || 'Dr. Emily Wang' };
        } else {
            const adminPos = users.findIndex(u => u.id === 1);
            users.splice(adminPos >= 0 ? adminPos + 1 : 0, 0, { id: 2, name: "Dr. Emily Wang", email: "lecturer@test.com", password: "12345", role: "LECTURER" });
        }
        
        schools = data.schools || schools;
        courses = data.courses || courses;
        courseAssignments = data.courseAssignments || courseAssignments;
        facultyRoleMap = data.facultyRoleMap || facultyRoleMap;
        submissions = data.submissions || submissions;
        auditLogs = data.auditLogs || auditLogs;
        assignmentHistory = data.assignmentHistory || assignmentHistory;
    }
}

function logAudit(action, details, userId) {
    auditLogs.push({
        id: auditLogs.length + 1,
        timestamp: new Date().toISOString(),
        userId: userId || (currentUser ? currentUser.id : null),
        action: action,
        details: details
    });
    // Keep only last 1000 logs
    if (auditLogs.length > 1000) {
        auditLogs = auditLogs.slice(-1000);
    }
    saveToStorage();
}

function logAssignmentHistory(courseId, coordinatorId, deputyDeanId, action, userId) {
    assignmentHistory.push({
        id: assignmentHistory.length + 1,
        timestamp: new Date().toISOString(),
        courseId,
        coordinatorId,
        deputyDeanId,
        action,
        userId: userId || (currentUser ? currentUser.id : null)
    });
    saveToStorage();
}

function findDeputyDeanForCourse(courseId) {
    // First try course-level assignment
    const courseAssignment = courseAssignments.find(a => a.courseId === courseId && a.active);
    if (courseAssignment && courseAssignment.deputyDeanId) {
        return courseAssignment.deputyDeanId;
    }

    // Fallback to faculty-level assignment
    const course = courses.find(c => c.id === courseId);
    if (course && course.schoolId) {
        const facultyAssignment = facultyRoleMap.find(a => a.facultyId === course.schoolId && a.active);
        if (facultyAssignment && facultyAssignment.deputyDeanId) {
            return facultyAssignment.deputyDeanId;
        }
    }

    return null;
}

function saveToStorage() {
    localStorage.setItem('workflowData', JSON.stringify({
        users,
        schools,
        courses,
        courseAssignments,
        facultyRoleMap,
        submissions,
        auditLogs,
        assignmentHistory
    }));
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify({ id: currentUser.id }));
    }
}

function updateNavigation() {
    if (!currentUser) return;
    
    const hasAdmin = currentUser.role === 'ADMIN';

    document.querySelectorAll('.nav-link').forEach(link => {
        const screen = link.getAttribute('data-screen');
        if (screen === 'admin-queue' || screen === 'admin-panel') {
            link.classList.toggle('hidden', !hasAdmin);
        } else if (screen === 'user-management' || screen === 'course-management' || screen === 'school-management') {
            link.classList.toggle('hidden', !hasAdmin);
        }
    });
}

function showScreen(screenId) {
    if (!isLoggedIn) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    const navLink = document.querySelector(`[data-screen="${screenId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    renderAllScreens();
}

function renderAllScreens() {
    renderMySubmissions();
    renderSubmitDocument();
    renderAdminQueue();
    renderAdminPanel();
    renderUserManagement();
    renderCourseManagement();
    renderSchoolManagement();
}

function renderSubmitDocument() {
    // Populate course dropdown
    const courseSelect = document.getElementById('submit-course');
    courseSelect.innerHTML = '<option value="">Select a course</option>';
    courses.forEach(course => {
        const school = schools.find(s => s.id === course.schoolId);
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.id} - ${course.name}${school ? ` (${school.name})` : ''}`;
        courseSelect.appendChild(option);
    });
}

function renderMySubmissions() {
    if (!currentUser) return;
    
    const userSubmissions = submissions.filter(s => s.submittedBy === currentUser.id);
    const drafts = userSubmissions.filter(s => s.status === 'DRAFT').length;
    const pending = userSubmissions.filter(s => s.status === 'SUBMITTED').length;
    const approved = userSubmissions.filter(s => s.status === 'APPROVED').length;

    document.getElementById('my-submissions-count').textContent = userSubmissions.length;
    document.getElementById('drafts-count').textContent = drafts;
    document.getElementById('pending-review-count').textContent = pending;
    document.getElementById('approved-count').textContent = approved;

    // Render submissions table
    const tbody = document.querySelector('#lecturer-submissions-table tbody');
    tbody.innerHTML = '';
    userSubmissions.forEach(sub => {
        const course = courses.find(c => c.id === sub.courseId);
        const docCount = sub.documents ? sub.documents.length : 0;
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${sub.title}${docCount > 0 ? ` <span style="color: var(--primary); font-size: 0.9em;">(${docCount} file${docCount > 1 ? 's' : ''})</span>` : ''}</td>
            <td>${course ? `${course.id} - ${course.name}` : sub.courseId}</td>
            <td><span class="badge status ${sub.status.toLowerCase()}">${sub.status}</span></td>
            <td>${sub.submittedDate}</td>
            <td>
                ${sub.status === 'DRAFT' ? `<button class="btn btn-success btn-small" onclick="markAsFinal(${sub.id})">Mark as Final</button>` : ''}
                ${sub.status === 'SUBMITTED' ? '<span style="color: var(--text-light);">Awaiting admin review</span>' : ''}
                ${sub.status === 'APPROVED' ? '<span style="color: var(--success);">✓ Approved</span>' : ''}
                ${sub.status === 'REJECTED' ? '<span style="color: var(--danger);">✗ Rejected</span>' : ''}
            </td>
        `;
    });
}

function renderAdminQueue() {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    // Only show final submissions (status = SUBMITTED, not DRAFT)
    const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED');

    document.getElementById('admin-pending-count').textContent = pendingSubmissions.length;

    const tbody = document.querySelector('#admin-queue-table tbody');
    tbody.innerHTML = '';
    if (pendingSubmissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">No submissions pending review</td></tr>';
    } else {
        pendingSubmissions.forEach(sub => {
            const course = courses.find(c => c.id === sub.courseId);
            const submitter = users.find(u => u.id === sub.submittedBy);
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${sub.title}</td>
                <td>${course ? `${course.id} - ${course.name}` : sub.courseId}</td>
                <td>${submitter ? submitter.name : 'Unknown'}</td>
                <td><span class="badge status ${sub.status.toLowerCase()}">${sub.status}</span></td>
                <td>${sub.submittedDate}</td>
                <td class="action-buttons">
                    <button class="btn btn-success" onclick="approveSubmission(${sub.id})">Approve</button>
                    <button class="btn btn-danger" onclick="rejectSubmission(${sub.id})">Reject</button>
                </td>
            `;
        });
    }
}

function renderAdminPanel() {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    // Render audit log
    const auditTbody = document.querySelector('#audit-log-table tbody');
    auditTbody.innerHTML = '';
    const recentLogs = auditLogs.slice().reverse().slice(0, 100); // Last 100 logs
    recentLogs.forEach(log => {
        const user = users.find(u => u.id === log.userId);
        const row = auditTbody.insertRow();
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${user ? user.name : 'Unknown'}</td>
            <td><span class="badge admin">${log.action}</span></td>
            <td style="font-size: 0.9em; color: #666;">${JSON.stringify(log.details).substring(0, 100)}${JSON.stringify(log.details).length > 100 ? '...' : ''}</td>
        `;
    });

    // Render users table
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const roleBadge = user.role === 'ADMIN' ? '<span class="badge admin">Admin</span>' : '<span class="badge lecturer">Lecturer</span>';
        const row = tbody.insertRow();
        row.setAttribute('data-user-id', user.id);
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${roleBadge}</td>
            <td><div class="scope-info">${user.role === 'ADMIN' ? 'Full system access' : 'Can submit documents'}</div></td>
            <td>
                <button class="btn btn-primary" onclick="toggleUserRole(${user.id})">Toggle Role</button>
            </td>
        `;
    });
}

function getAssignedScope(userId) {
    const coordinatorCourses = courseAssignments.filter(a => a.coordinatorId === userId && a.active).map(a => a.courseId);
    const deanCourses = courseAssignments.filter(a => a.deputyDeanId === userId && a.active).map(a => a.courseId);
    const scopes = [];
    if (coordinatorCourses.length > 0) {
        scopes.push(`Coordinator: ${coordinatorCourses.join(', ')}`);
    }
    if (deanCourses.length > 0) {
        scopes.push(`Deputy Dean: ${deanCourses.join(', ')}`);
    }
    return scopes.length > 0 ? scopes.join(' | ') : 'None';
}

// These functions are no longer needed in simplified role model

function toggleUserRole(userId) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showAlert('Only admins can change user roles', 'error');
        return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.id === currentUser.id) {
        showAlert('You cannot change your own role', 'error');
        return;
    }

    const newRole = user.role === 'ADMIN' ? 'LECTURER' : 'ADMIN';
    const oldRole = user.role;
    user.role = newRole;

    logAudit('USER_ROLE_CHANGED', {
        userId: userId,
        userName: user.name,
        oldRole: oldRole,
        newRole: newRole
    });

    saveToStorage();
    renderAdminPanel();
    showAlert(`User role changed to ${newRole}`, 'success');
}

function saveCourseAssignment() {
    const courseId = document.getElementById('assign-course').value;
    const coordinatorId = parseInt(document.getElementById('assign-coordinator').value);
    const deputyDeanId = parseInt(document.getElementById('assign-deputy-dean').value);

    if (!courseId) {
        showAlert('Please select a course', 'error');
        return;
    }

    if (!coordinatorId) {
        showAlert('Please select a coordinator', 'error');
        return;
    }

    // Validate coordinator has privilege
    const coordinator = users.find(u => u.id === coordinatorId);
    if (!coordinator || !coordinator.privileges.includes('COORDINATOR')) {
        showAlert('Selected user does not have Coordinator privilege', 'error');
        return;
    }

    // Validate deputy dean if provided
    if (deputyDeanId) {
        const deputyDean = users.find(u => u.id === deputyDeanId);
        if (!deputyDean || !deputyDean.privileges.includes('DEPUTY_DEAN')) {
            showAlert('Selected user does not have Deputy Dean privilege', 'error');
            return;
        }
    }

    // Prevent circular assignment: coordinator and deputy dean cannot be the same
    if (coordinatorId === deputyDeanId) {
        showAlert('Coordinator and Deputy Dean cannot be the same user', 'error');
        return;
    }

    const existing = courseAssignments.findIndex(a => a.courseId === courseId);
    const oldAssignment = existing > -1 ? { ...courseAssignments[existing] } : null;
    
    if (existing > -1) {
        courseAssignments[existing] = { courseId, coordinatorId, deputyDeanId, active: true };
        logAssignmentHistory(courseId, coordinatorId, deputyDeanId, 'UPDATED');
    } else {
        courseAssignments.push({ courseId, coordinatorId, deputyDeanId, active: true });
        logAssignmentHistory(courseId, coordinatorId, deputyDeanId, 'CREATED');
    }

    logAudit('COURSE_ASSIGNMENT_CHANGED', {
        courseId: courseId,
        oldCoordinator: oldAssignment?.coordinatorId || null,
        newCoordinator: coordinatorId,
        oldDeputyDean: oldAssignment?.deputyDeanId || null,
        newDeputyDean: deputyDeanId,
        action: existing > -1 ? 'UPDATED' : 'CREATED'
    });

    saveToStorage();
    renderAdminPanel();
    showAlert('Course assignment saved successfully', 'success');

    // Clear form
    document.getElementById('assign-course').value = '';
    document.getElementById('assign-coordinator').value = '';
    document.getElementById('assign-deputy-dean').value = '';
}

function toggleAssignment(courseId) {
    const assignment = courseAssignments.find(a => a.courseId === courseId);
    if (assignment) {
        assignment.active = !assignment.active;
        logAudit('COURSE_ASSIGNMENT_TOGGLED', {
            courseId: courseId,
            active: assignment.active
        });
        saveToStorage();
        renderAdminPanel();
        showAlert('Assignment status updated', 'success');
    }
}

function saveFacultyAssignment() {
    const facultyId = parseInt(document.getElementById('assign-faculty-school').value);
    const deputyDeanId = parseInt(document.getElementById('assign-faculty-deputy-dean').value);

    if (!facultyId) {
        showAlert('Please select a school/faculty', 'error');
        return;
    }

    if (!deputyDeanId) {
        showAlert('Please select a deputy dean', 'error');
        return;
    }

    // Validate deputy dean has privilege
    const deputyDean = users.find(u => u.id === deputyDeanId);
    if (!deputyDean || !deputyDean.privileges.includes('DEPUTY_DEAN')) {
        showAlert('Selected user does not have Deputy Dean privilege', 'error');
        return;
    }

    const existing = facultyRoleMap.findIndex(a => a.facultyId === facultyId);
    const oldAssignment = existing > -1 ? { ...facultyRoleMap[existing] } : null;

    if (existing > -1) {
        facultyRoleMap[existing] = { facultyId, deputyDeanId, active: true };
    } else {
        facultyRoleMap.push({ facultyId, deputyDeanId, active: true });
    }

    logAudit('FACULTY_ASSIGNMENT_CHANGED', {
        facultyId: facultyId,
        oldDeputyDean: oldAssignment?.deputyDeanId || null,
        newDeputyDean: deputyDeanId,
        action: existing > -1 ? 'UPDATED' : 'CREATED'
    });

    saveToStorage();
    renderAdminPanel();
    showAlert('Faculty assignment saved successfully', 'success');

    // Clear form
    document.getElementById('assign-faculty-school').value = '';
    document.getElementById('assign-faculty-deputy-dean').value = '';
}

function toggleFacultyAssignment(facultyId) {
    const assignment = facultyRoleMap.find(a => a.facultyId === facultyId);
    if (assignment) {
        assignment.active = !assignment.active;
        logAudit('FACULTY_ASSIGNMENT_TOGGLED', {
            facultyId: facultyId,
            active: assignment.active
        });
        saveToStorage();
        renderAdminPanel();
        showAlert('Faculty assignment status updated', 'success');
    }
}

function deleteFacultyAssignment(facultyId) {
    if (confirm('Are you sure you want to delete this faculty assignment?')) {
        const assignment = facultyRoleMap.find(a => a.facultyId === facultyId);
        if (assignment) {
            logAudit('FACULTY_ASSIGNMENT_DELETED', {
                facultyId: facultyId,
                deputyDeanId: assignment.deputyDeanId
            });
            facultyRoleMap = facultyRoleMap.filter(a => a.facultyId !== facultyId);
            saveToStorage();
            renderAdminPanel();
            showAlert('Faculty assignment deleted', 'success');
        }
    }
}

function deleteAssignment(courseId) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        const assignment = courseAssignments.find(a => a.courseId === courseId);
        if (assignment) {
            logAudit('COURSE_ASSIGNMENT_DELETED', {
                courseId: courseId,
                coordinatorId: assignment.coordinatorId,
                deputyDeanId: assignment.deputyDeanId
            });
            courseAssignments.splice(courseAssignments.findIndex(a => a.courseId === courseId), 1);
            saveToStorage();
            renderAdminPanel();
            showAlert('Assignment deleted', 'success');
        }
    }
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        const document = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            file: file
        };
        selectedDocuments.push(document);
    });
    renderDocumentsList();
    event.target.value = ''; // Reset input to allow selecting same file again
}

function removeDocument(documentId) {
    selectedDocuments = selectedDocuments.filter(doc => doc.id !== documentId);
    renderDocumentsList();
}

function renderDocumentsList() {
    const listContainer = document.getElementById('documents-list');
    const noDocumentsMsg = document.getElementById('no-documents-msg');
    
    if (selectedDocuments.length === 0) {
        listContainer.innerHTML = '<div class="no-documents" id="no-documents-msg">No documents attached</div>';
        return;
    }

    noDocumentsMsg?.remove();
    listContainer.innerHTML = selectedDocuments.map(doc => `
        <div class="document-item">
            <div class="document-item-info">
                <div class="document-icon">📄</div>
                <div class="document-name">${doc.name}</div>
                <div class="document-size">${doc.size}</div>
            </div>
            <button class="document-remove" onclick="removeDocument(${doc.id})">Remove</button>
        </div>
    `).join('');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function submitDocument() {
    if (!currentUser) {
        showAlert('Please login first', 'error');
        return;
    }

    const courseId = document.getElementById('submit-course').value;
    const title = document.getElementById('submit-title').value;
    const description = document.getElementById('submit-description').value;
    const isFinalSubmission = document.getElementById('final-submission') ? document.getElementById('final-submission').checked : false;

    if (!courseId || !title) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    const newSubmission = {
        id: submissions.length + 1,
        title,
        description,
        courseId,
        submittedBy: currentUser.id,
        status: isFinalSubmission ? 'SUBMITTED' : 'DRAFT',
        isFinalSubmission: isFinalSubmission,
        submittedDate: new Date().toISOString().split('T')[0],
        documents: selectedDocuments.map(doc => ({
            id: doc.id,
            name: doc.name,
            size: doc.size
        }))
    };

    submissions.push(newSubmission);
    
    logAudit('DOCUMENT_SUBMITTED', {
        submissionId: newSubmission.id,
        title: title,
        courseId: courseId,
        submitterId: currentUser.id,
        isFinalSubmission: isFinalSubmission,
        status: newSubmission.status
    });

    saveToStorage();
    renderMySubmissions();
    renderAdminQueue();
    renderSubmitDocument();
    showAlert(isFinalSubmission ? 'Document submitted for review successfully' : 'Document saved as draft', 'success');

    // Clear form
    document.getElementById('submit-course').value = '';
    document.getElementById('submit-title').value = '';
    document.getElementById('submit-description').value = '';
    if (document.getElementById('final-submission')) {
        document.getElementById('final-submission').checked = false;
    }
    selectedDocuments = [];
    renderDocumentsList();
}

function approveSubmission(submissionId) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showAlert('Only admins can approve submissions', 'error');
        return;
    }

    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    submission.status = 'APPROVED';
    
    logAudit('SUBMISSION_APPROVED', {
        submissionId: submission.id,
        title: submission.title,
        courseId: submission.courseId,
        adminId: currentUser.id
    });

    saveToStorage();
    renderAdminQueue();
    renderMySubmissions();
    showAlert('Submission approved successfully', 'success');
}

function rejectSubmission(submissionId) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showAlert('Only admins can reject submissions', 'error');
        return;
    }

    if (confirm('Are you sure you want to reject this submission?')) {
        const submission = submissions.find(s => s.id === submissionId);
        if (!submission) return;

        submission.status = 'REJECTED';
        
        logAudit('SUBMISSION_REJECTED', {
            submissionId: submission.id,
            title: submission.title,
            courseId: submission.courseId,
            rejectedBy: currentUser.id
        });

        saveToStorage();
        renderAdminQueue();
        renderMySubmissions();
        showAlert('Submission rejected', 'info');
    }
}

function markAsFinal(submissionId) {
    if (!currentUser) {
        showAlert('Please login first', 'error');
        return;
    }

    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Only allow the submitter to mark as final
    if (submission.submittedBy !== currentUser.id) {
        showAlert('You can only mark your own submissions as final', 'error');
        return;
    }

    if (submission.status !== 'DRAFT') {
        showAlert('Only draft submissions can be marked as final', 'error');
        return;
    }

    if (confirm('Are you sure you want to mark this as final submission? Once marked, it will be sent to admin for review and you cannot change it back to draft.')) {
        submission.status = 'SUBMITTED';
        submission.isFinalSubmission = true;
        
        logAudit('SUBMISSION_MARKED_AS_FINAL', {
            submissionId: submission.id,
            title: submission.title,
            courseId: submission.courseId,
            submitterId: currentUser.id
        });

        saveToStorage();
        renderMySubmissions();
        renderAdminQueue();
        showAlert('Submission marked as final and sent for admin review', 'success');
    }
}

function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function showAlert(message, type) {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(a => a.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// User Management Functions
function renderUserManagement() {
    const tbody = document.querySelector('#user-management-table tbody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const roleBadge = user.role === 'ADMIN' ? '<span class="badge admin">Admin</span>' : '<span class="badge lecturer">Lecturer</span>';
        const row = tbody.insertRow();
        row.setAttribute('data-user-id', user.id);
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${roleBadge}</td>
            <td>
                <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
    });
}

function addUser() {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showAlert('Only admins can add users', 'error');
        return;
    }

    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();

    if (!name || !email) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (users.find(u => u.email === email)) {
        showAlert('User with this email already exists', 'error');
        return;
    }

    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    users.push({
        id: newId,
        name,
        email,
        password: '12345', // Default password
        role: 'LECTURER' // Default role
    });

    saveToStorage();
    renderUserManagement();
    showAlert('User added successfully (default password: 12345)', 'success');

    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-email').value = '';
}

function deleteUser(userId) {
    if (users.length <= 1) {
        showAlert('Cannot delete the last user', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.id !== userId);
        saveToStorage();
        renderUserManagement();
        showAlert('User deleted successfully', 'success');
    }
}

function filterUsersManagement() {
    const searchTerm = document.getElementById('user-mgmt-search').value.toLowerCase();
    const rows = document.querySelectorAll('#user-management-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Course Management Functions
function renderCourseManagement() {
    const tbody = document.querySelector('#course-management-table tbody');
    tbody.innerHTML = '';
    courses.forEach(course => {
        const school = schools.find(s => s.id === course.schoolId);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${course.id}</td>
            <td>${course.name}</td>
            <td>${school ? school.name : 'N/A'}</td>
            <td>
                <button class="btn btn-danger btn-small" onclick="deleteCourse('${course.id}')">Delete</button>
            </td>
        `;
    });

    // Populate school dropdown
    const schoolSelect = document.getElementById('new-course-school');
    schoolSelect.innerHTML = '<option value="">Select school</option>';
    schools.forEach(school => {
        const option = document.createElement('option');
        option.value = school.id;
        option.textContent = `${school.code} - ${school.name}`;
        schoolSelect.appendChild(option);
    });
}

function addCourse() {
    const code = document.getElementById('new-course-code').value.trim().toUpperCase();
    const name = document.getElementById('new-course-name').value.trim();
    const schoolId = parseInt(document.getElementById('new-course-school').value);

    if (!code || !name || !schoolId) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (courses.find(c => c.id === code)) {
        showAlert('Course with this code already exists', 'error');
        return;
    }

    courses.push({
        id: code,
        name,
        schoolId
    });

    saveToStorage();
    renderCourseManagement();
            renderSubmitDocument();
    renderAdminPanel();
    showAlert('Course added successfully', 'success');

    document.getElementById('new-course-code').value = '';
    document.getElementById('new-course-name').value = '';
    document.getElementById('new-course-school').value = '';
}

function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        courses = courses.filter(c => c.id !== courseId);
        courseAssignments = courseAssignments.filter(a => a.courseId !== courseId);
        saveToStorage();
        renderCourseManagement();
            renderSubmitDocument();
        renderAdminPanel();
        showAlert('Course deleted successfully', 'success');
    }
}

function filterCourses() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase();
    const rows = document.querySelectorAll('#course-management-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// School Management Functions
function renderSchoolManagement() {
    const tbody = document.querySelector('#school-management-table tbody');
    tbody.innerHTML = '';
    schools.forEach(school => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${school.code}</td>
            <td>${school.name}</td>
            <td>
                <button class="btn btn-danger btn-small" onclick="deleteSchool(${school.id})">Delete</button>
            </td>
        `;
    });
}

function addSchool() {
    const code = document.getElementById('new-school-code').value.trim().toUpperCase();
    const name = document.getElementById('new-school-name').value.trim();

    if (!code || !name) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (schools.find(s => s.code === code || s.name === name)) {
        showAlert('School with this code or name already exists', 'error');
        return;
    }

    const newId = Math.max(...schools.map(s => s.id), 0) + 1;
    schools.push({
        id: newId,
        code,
        name
    });

    saveToStorage();
    renderSchoolManagement();
    renderCourseManagement();
    showAlert('School/Faculty added successfully', 'success');

    document.getElementById('new-school-code').value = '';
    document.getElementById('new-school-name').value = '';
}

function deleteSchool(schoolId) {
    const school = schools.find(s => s.id === schoolId);
    if (courses.some(c => c.schoolId === schoolId)) {
        showAlert('Cannot delete school with existing courses. Please delete courses first.', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this school/faculty?')) {
        schools = schools.filter(s => s.id !== schoolId);
        saveToStorage();
        renderSchoolManagement();
        renderCourseManagement();
        showAlert('School/Faculty deleted successfully', 'success');
    }
}

function filterSchools() {
    const searchTerm = document.getElementById('school-search').value.toLowerCase();
    const rows = document.querySelectorAll('#school-management-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterAuditLog() {
    const searchTerm = document.getElementById('audit-search').value.toLowerCase();
    const rows = document.querySelectorAll('#audit-log-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Duplicate removed - updateNavigation is defined earlier

// Initialize on load
init();
