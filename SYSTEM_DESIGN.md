# QP Repository Workflow System - Design Document

## 1. Project Overview

A document workflow system for academic institutions to manage course-related documents (Question Papers, Teaching Materials, etc.) with a multi-level approval workflow.

### Workflow Flow
```
Lecturer → Course Coordinator → Deputy Dean (Academic) → Endorsed
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MySQL (via XAMPP) |
| File Storage | Server filesystem (`./uploads/`) |
| Authentication | JWT (JSON Web Tokens) |

---

## 3. Database Schema

### 3.1 `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| name | VARCHAR(255) | Full name |
| email | VARCHAR(255) UNIQUE | Login email |
| password | VARCHAR(255) | Hashed password |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update |

### 3.2 `user_privileges`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| user_id | INT (FK → users) | User reference |
| privilege | ENUM('COORDINATOR', 'DEPUTY_DEAN', 'ADMIN') | Privilege type |
| active | BOOLEAN | Is privilege active |
| created_at | TIMESTAMP | When granted |

> Note: All users are Lecturers by default (implicit privilege).

### 3.3 `departments`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| code | VARCHAR(50) UNIQUE | e.g., "OYAGSB" |
| name | VARCHAR(255) | e.g., "Graduate School of Business" |
| active | BOOLEAN | Is department active |
| created_at | TIMESTAMP | Creation date |

### 3.4 `sessions`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| code | VARCHAR(20) UNIQUE | e.g., "A251", "A252" |
| name | VARCHAR(100) | e.g., "Semester 1 2025/2026" |
| active | BOOLEAN | Is session active |
| created_at | TIMESTAMP | Creation date |

### 3.5 `courses`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| code | VARCHAR(50) UNIQUE | e.g., "BPMN3123" |
| name | VARCHAR(255) | Course name |
| department_id | INT (FK → departments) | Department reference |
| active | BOOLEAN | Is course active |
| created_at | TIMESTAMP | Creation date |

### 3.6 `course_role_map`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| course_id | INT (FK → courses) | Course reference |
| coordinator_user_id | INT (FK → users) | Assigned coordinator |
| deputy_dean_user_id | INT (FK → users) | Assigned deputy dean |
| active | BOOLEAN | Is assignment active |
| created_at | TIMESTAMP | Creation date |

### 3.7 `submissions`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| lecturer_user_id | INT (FK → users) | Submitter |
| session_id | INT (FK → sessions) | Academic session |
| department_id | INT (FK → departments) | Department |
| course_id | INT (FK → courses) | Course |
| type_of_study | ENUM('Undergraduate', 'Postgraduate') | Study type |
| status | ENUM('DRAFT', 'SUBMITTED', 'COORDINATOR_APPROVED', 'DEAN_ENDORSED', 'REJECTED') | Current status |
| current_assignee_id | INT (FK → users) | Who needs to act next |
| submitted_at | TIMESTAMP | When submitted |
| coordinator_approved_at | TIMESTAMP | When coordinator approved |
| dean_endorsed_at | TIMESTAMP | When dean endorsed |
| rejected_at | TIMESTAMP | When rejected (if applicable) |
| rejection_reason | TEXT | Reason for rejection |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

### 3.8 `submission_documents`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| submission_id | INT (FK → submissions) | Parent submission |
| document_type | VARCHAR(100) | Type code (see Document Types below) |
| file_name | VARCHAR(255) | Original filename |
| file_path | VARCHAR(500) | Server path to file |
| file_size | INT | File size in bytes |
| not_applicable | BOOLEAN | Marked as N/A |
| uploaded_at | TIMESTAMP | Upload timestamp |

### 3.9 `submission_groups`
For GROUP section (multiple rows per submission)

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| submission_id | INT (FK → submissions) | Parent submission |
| group_name | VARCHAR(100) | Group identifier |
| final_exam_mark_file | VARCHAR(500) | File path |
| student_list_file | VARCHAR(500) | File path |
| attendance_record_file | VARCHAR(500) | File path |
| assignment1_file | VARCHAR(500) | File path |
| assignment2_file | VARCHAR(500) | File path |
| assignment3_file | VARCHAR(500) | File path |
| cm1_file | VARCHAR(500) | CM1 file path |
| cm2_file | VARCHAR(500) | CM2 file path |
| cm3_file | VARCHAR(500) | CM3 file path |
| created_at | TIMESTAMP | Creation date |

### 3.10 `audit_logs`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| user_id | INT (FK → users) | Who performed action |
| action | VARCHAR(100) | Action type |
| entity_type | VARCHAR(50) | e.g., "submission", "user" |
| entity_id | INT | ID of affected entity |
| details | JSON | Additional details |
| created_at | TIMESTAMP | When action occurred |

---

## 4. Document Types

### QP004 Series (Examination Documents)
| Code | Name | Required |
|------|------|----------|
| QP004_TEST_SPEC | Test Specification Table | Yes |
| QP004_FINAL_QUESTION | Final Examination's Question | Yes |
| QP004_FINAL_ANSWER | Final Examination's Answer Scheme | Yes |

### QP005 Series (Course Documents)
| Code | Name | Required |
|------|------|----------|
| QP005_APPOINTMENT | Lecturer's Appointment Letter | Yes |
| QP005_SCHEDULE | Teaching Schedule and Consultation Time | Yes |
| QP005_SYLLABUS | Course Syllabus | Yes |
| QP005_SOW | Scheme of Work (SOW) | Yes |
| QP005_ASSIGNMENT | Assignment | Optional (N/A allowed) |
| QP005_TUTORIAL | Tutorial | Optional (N/A allowed) |
| QP005_QUIZ | Quiz | Optional (N/A allowed) |
| QP005_MIDSEM_QUESTION | Mid Semester Exam (Question) | Yes |
| QP005_MIDSEM_ANSWER | Mid Semester Exam (Answer) | Yes |
| QP005_AOL | AOL File | Optional (N/A allowed) |

### GROUP Section (Per Group)
| Code | Name |
|------|------|
| GROUP_FINAL_MARK | Final Exam Mark |
| GROUP_STUDENT_LIST | List of Students |
| GROUP_ATTENDANCE | Attendance Record |
| GROUP_ASSIGN_1 | Assignment 1 |
| GROUP_ASSIGN_2 | Assignment 2 |
| GROUP_ASSIGN_3 | Assignment 3 |
| GROUP_CM1 | CM1 |
| GROUP_CM2 | CM2 |
| GROUP_CM3 | CM3 |

---

## 5. API Endpoints

### 5.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| GET | `/api/auth/me` | Get current user info |

### 5.2 Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| POST | `/api/users/:id/privileges` | Grant privilege |
| DELETE | `/api/users/:id/privileges/:privilege` | Revoke privilege |

### 5.3 Sessions (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions` | Create new session |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |

### 5.4 Departments (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Create new department |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |

### 5.5 Courses (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses?department_id=X` | Filter by department |
| POST | `/api/courses` | Create new course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |

### 5.6 Course Role Mapping (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/course-roles` | List all mappings |
| POST | `/api/course-roles` | Create/update mapping |
| DELETE | `/api/course-roles/:id` | Delete mapping |

### 5.7 Submissions (Lecturer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List my submissions |
| GET | `/api/submissions/:id` | Get submission details |
| POST | `/api/submissions` | Create new submission |
| PUT | `/api/submissions/:id` | Update draft submission |
| POST | `/api/submissions/:id/submit` | Mark as final & submit |
| DELETE | `/api/submissions/:id` | Delete draft submission |

### 5.8 Document Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions/:id/documents` | Upload document |
| DELETE | `/api/submissions/:id/documents/:docId` | Remove document |
| GET | `/api/documents/:id/download` | Download document |

### 5.9 Review Queue (Coordinator)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coordinator/queue` | List pending reviews |
| POST | `/api/coordinator/submissions/:id/approve` | Approve submission |
| POST | `/api/coordinator/submissions/:id/reject` | Reject submission |

### 5.10 Endorsement Queue (Deputy Dean)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dean/queue` | List pending endorsements |
| POST | `/api/dean/submissions/:id/endorse` | Endorse submission |
| POST | `/api/dean/submissions/:id/reject` | Reject submission |

### 5.11 Dashboard Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get counts for dashboard |
| GET | `/api/dashboard/submissions` | Get all submissions (for review dashboard) |

---

## 6. Frontend Pages & Components

### 6.1 Page Structure

```
/                           → Redirect to /login or /dashboard
/login                      → Login page
/dashboard                  → Main dashboard (role-based content)
/submit                     → Submit Document form
/submissions                → My Submissions list
/submissions/:id            → View submission details
/coordinator/queue          → Coordinator review queue
/dean/queue                 → Deputy Dean endorsement queue
/admin/users                → User management
/admin/sessions             → Session management
/admin/departments          → Department management
/admin/courses              → Course management
/admin/course-roles         → Course role mapping
/admin/audit-log            → Audit log viewer
```

### 6.2 Submit Document Form (Main Feature)

**Header Section:**
- Institution Logo + Name: "Othman Yeop Abdullah Graduate School of Business (OYAGSB)"
- Form Title: "QP Repository Information Form"

**Course Information Section:**
| Field | Type | Source |
|-------|------|--------|
| Lecturer's Name | Auto-filled (readonly) | Current logged-in user |
| Session | Dropdown | From `sessions` table |
| Department | Dropdown | From `departments` table |
| Course Code | Dropdown (filtered) | From `courses` table (filtered by department) |
| Type of Study | Dropdown | Undergraduate / Postgraduate |

**QP File Data Section:**

Each row has:
- Label (e.g., "QP004: Test Specification Table")
- File upload button ("Click here to attach a file")
- Checkbox for optional items ("Not Applicable? ☐ tick if yes")

**GROUP Section:**
- "Insert Item" button to add new group rows
- Each group row contains file uploads for:
  - Final Exam Mark
  - List of Students
  - Attendance Record
  - Assignment 1, 2, 3
  - CM1, CM2, CM3

**Form Actions:**
- Save as Draft
- Submit for Review

### 6.3 Review Dashboard (Coordinator & Deputy Dean)

**Table Columns:**
| Column | Description |
|--------|-------------|
| Type | Document icon |
| File Name | Submission identifier |
| Created By | Lecturer name |
| Created At | Submission date |
| Session | Academic session code |
| Subject Code | Course code |
| Type of Study | Undergraduate/Postgraduate |
| Final Examination Question | Yes/No indicator |
| Lecturer Appointment Letter | Yes/No indicator |
| Teaching Schedule | Yes/No indicator |
| Scheme of Work | Yes/No indicator |
| Midsem Exam and Answer | Yes/No indicator |
| Midsem Answer | Yes/No indicator |
| Lecturer | Lecturer name |
| Dept | Department code |
| Course Syllabus | Yes/No indicator |
| Actions | Approve/Reject buttons |

---

## 7. File Storage Structure

```
./uploads/
├── submissions/
│   ├── {submission_id}/
│   │   ├── QP004_TEST_SPEC_{timestamp}_{filename}.pdf
│   │   ├── QP004_FINAL_QUESTION_{timestamp}_{filename}.pdf
│   │   ├── QP005_SYLLABUS_{timestamp}_{filename}.pdf
│   │   └── ...
│   │   └── groups/
│   │       ├── group_1/
│   │       │   ├── final_mark.xlsx
│   │       │   ├── student_list.xlsx
│   │       │   └── ...
│   │       └── group_2/
│   │           └── ...
```

---

## 8. User Roles & Permissions

### 8.1 Role-Based Access

| Feature | Lecturer | Coordinator | Deputy Dean | Admin |
|---------|----------|-------------|-------------|-------|
| Submit documents | ✅ | ✅ | ✅ | ✅ |
| View own submissions | ✅ | ✅ | ✅ | ✅ |
| Review submissions | ❌ | ✅ (assigned) | ❌ | ❌ |
| Endorse submissions | ❌ | ❌ | ✅ (assigned) | ❌ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage sessions | ❌ | ❌ | ❌ | ✅ |
| Manage departments | ❌ | ❌ | ❌ | ✅ |
| Manage courses | ❌ | ❌ | ❌ | ✅ |
| Manage course roles | ❌ | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ✅ |

### 8.2 Navigation Menu Visibility

| Menu Item | Visibility |
|-----------|------------|
| Submit Document | All users |
| My Submissions | All users |
| Coordinator Review Queue | Users with COORDINATOR privilege |
| Deputy Dean Endorsement Queue | Users with DEPUTY_DEAN privilege |
| Admin Panel | Users with ADMIN privilege |

---

## 9. Workflow States

```
┌─────────┐     Submit      ┌───────────┐    Approve    ┌─────────────────────┐    Endorse    ┌───────────────┐
│  DRAFT  │ ──────────────► │ SUBMITTED │ ────────────► │ COORDINATOR_APPROVED │ ────────────► │ DEAN_ENDORSED │
└─────────┘                 └───────────┘               └─────────────────────┘               └───────────────┘
                                  │                              │
                                  │ Reject                       │ Reject
                                  ▼                              ▼
                            ┌──────────┐                   ┌──────────┐
                            │ REJECTED │                   │ REJECTED │
                            └──────────┘                   └──────────┘
```

### State Transitions:
1. **DRAFT → SUBMITTED**: Lecturer marks submission as final
2. **SUBMITTED → COORDINATOR_APPROVED**: Coordinator approves
3. **SUBMITTED → REJECTED**: Coordinator rejects (returns to lecturer)
4. **COORDINATOR_APPROVED → DEAN_ENDORSED**: Deputy Dean endorses
5. **COORDINATOR_APPROVED → REJECTED**: Deputy Dean rejects (returns to lecturer)

---

## 10. Project Folder Structure

```
workflow/
├── client/                          # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Alert.jsx
│   │   │   │   └── FileUpload.jsx
│   │   │   ├── forms/
│   │   │   │   ├── SubmitDocumentForm.jsx
│   │   │   │   └── CourseInfoSection.jsx
│   │   │   └── tables/
│   │   │       ├── SubmissionsTable.jsx
│   │   │       └── ReviewDashboard.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SubmitDocument.jsx
│   │   │   ├── MySubmissions.jsx
│   │   │   ├── CoordinatorQueue.jsx
│   │   │   ├── DeanQueue.jsx
│   │   │   └── admin/
│   │   │       ├── UserManagement.jsx
│   │   │       ├── SessionManagement.jsx
│   │   │       ├── DepartmentManagement.jsx
│   │   │       ├── CourseManagement.jsx
│   │   │       ├── CourseRoleMapping.jsx
│   │   │       └── AuditLog.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js Backend
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── sessionController.js
│   │   ├── departmentController.js
│   │   ├── courseController.js
│   │   ├── submissionController.js
│   │   └── reviewController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Department.js
│   │   ├── Course.js
│   │   ├── Submission.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── sessions.js
│   │   ├── departments.js
│   │   ├── courses.js
│   │   ├── submissions.js
│   │   └── reviews.js
│   ├── uploads/                     # File storage
│   ├── utils/
│   │   └── helpers.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── database/
│   └── schema.sql                   # MySQL schema
│
├── SYSTEM_DESIGN.md                 # This document
├── workflow_admin_module_requirements.md
└── README.md
```

---

## 11. Sample Data (For Testing)

### Default Admin User
```
Email: admin@test.com
Password: admin123
Privileges: ADMIN
```

### Sample Sessions
```
A241 - Semester 1 2024/2025
A242 - Semester 2 2024/2025
A251 - Semester 1 2025/2026
A252 - Semester 2 2025/2026
```

### Sample Departments
```
OYAGSB - Othman Yeop Abdullah Graduate School of Business
SBM - School of Business Management
SEFB - School of Economics, Finance and Banking
```

### Sample Courses
```
BPMN3123 - Strategic Management (OYAGSB)
BWFF2043 - Advanced Financial Management (OYAGSB)
```

---

## 12. UI/UX Design Guidelines

### Color Scheme (Matching Screenshot)
```css
--primary: #8B0000;        /* Dark red (header) */
--primary-light: #A52A2A;  /* Lighter red */
--secondary: #D4AF37;      /* Gold accent */
--bg: #F5F5F5;             /* Light gray background */
--surface: #FFFFFF;        /* White cards */
--border: #E0E0E0;         /* Light borders */
--text: #333333;           /* Dark text */
--text-light: #666666;     /* Secondary text */
--success: #28A745;        /* Green for success */
--danger: #DC3545;         /* Red for errors */
```

### Form Styling
- Section headers with gold/dark red gradient backgrounds
- Clean white form areas
- Blue file upload links
- Checkbox styling for "Not Applicable" options

---

## 13. Next Steps After Approval

1. **Phase 1: Backend Setup**
   - Initialize Node.js project
   - Set up MySQL database schema
   - Implement authentication
   - Create base API endpoints

2. **Phase 2: Frontend Setup**
   - Initialize React + Vite project
   - Set up routing
   - Create authentication flow
   - Build common components

3. **Phase 3: Core Features**
   - Submit Document form
   - My Submissions page
   - File upload functionality

4. **Phase 4: Review Workflow**
   - Coordinator review queue
   - Deputy Dean endorsement queue
   - Status tracking

5. **Phase 5: Admin Features**
   - User management
   - Session/Department/Course management
   - Course role mapping
   - Audit log

6. **Phase 6: Testing & Polish**
   - End-to-end testing
   - UI refinements
   - Performance optimization

---

## 14. Questions/Clarifications Needed

Please confirm:

1. ✅ Session codes managed by admin (e.g., A251, A252)
2. ✅ Departments managed by admin (e.g., OYAGSB)
3. ✅ Type of Study: Undergraduate / Postgraduate only
4. ✅ All QP004/QP005 document types as listed
5. ✅ GROUP section with multiple group rows
6. ✅ File storage in `./uploads/` relative path

**Additional questions:**
- Should rejected submissions be editable by lecturer and resubmitted?
- Should there be email notifications for workflow transitions?
- Is there a maximum file size limit for uploads?
- Should the system support multiple languages (English/Malay)?

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Pending Review

