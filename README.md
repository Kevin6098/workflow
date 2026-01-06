# QP Repository Workflow System

A document workflow system for academic institutions to manage course-related documents with multi-level approval workflow.

## 🚀 Quick Start Guide

### Prerequisites

1. **XAMPP** - For MySQL database
   - Download from: https://www.apachefriends.org/
   - Start Apache and MySQL services
   
2. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

### Step 1: Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Import the database:
   - Click "Import" tab
   - Choose file: `database/schema.sql`
   - Click "Go"
   - This will create `workflow_system` database with sample data

**Default Login Credentials:**
- Admin: `admin@test.com` / `admin123`
- Lecturer: `lecturer@test.com` / `admin123`

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
copy env.example .env

# Edit .env file and update if needed:
# DB_PASSWORD= (leave empty for default XAMPP)
# JWT_SECRET=your_secret_key_here

# Start the server
npm run dev
```

The backend will run on **http://localhost:5000**

### Step 3: Frontend Setup

Open a NEW terminal window:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on **http://localhost:5173**

### Step 4: Access the System

1. Open browser: **http://localhost:5173**
2. Login with:
   - Email: `admin@test.com`
   - Password: `admin123`

---

## 📁 Project Structure

```
workflow/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Global styles
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, upload, etc.
│   ├── routes/             # API routes
│   ├── uploads/            # File storage
│   ├── app.js              # Express app
│   └── server.js           # Server entry point
│
├── database/
│   └── schema.sql          # MySQL database schema
│
├── SYSTEM_DESIGN.md        # System design document
└── README.md               # This file
```

---

## 🔑 Key Features

### 1. Document Submission (Lecturer)
- Submit QP repository documents
- Upload multiple document types (QP004, QP005 series)
- Save as draft or submit for review
- Track submission status

### 2. Coordinator Review
- Review submitted documents
- Approve or reject submissions
- Forward approved submissions to Deputy Dean

### 3. Deputy Dean Endorsement
- Review coordinator-approved submissions
- Endorse or reject submissions
- Final approval in workflow

### 4. Admin Management
- User management with privilege system
- Session management (A251, A252, etc.)
- Department management (OYAGSB, SBM, etc.)
- Course management
- Course role mapping (assign coordinators & deputy deans)
- Audit log viewer

### 5. Review Dashboard
- Table view of all submissions
- Filter by status, course, department
- Document completion indicators
- Export-ready format

---

## 📝 Document Types

### QP004 Series (Examination)
- Test Specification Table
- Final Examination Question
- Final Examination Answer Scheme

### QP005 Series (Course Documents)
- Lecturer's Appointment Letter
- Teaching Schedule & Consultation Time
- Course Syllabus
- Scheme of Work (SOW)
- Assignment (optional)
- Tutorial (optional)
- Quiz (optional)
- Mid Semester Exam Question
- Mid Semester Exam Answer
- AOL File (optional)

### GROUP Section
- Final Exam Mark
- List of Students
- Attendance Record
- Assignments 1, 2, 3
- CM1, CM2, CM3

---

## 🔐 User Roles & Privileges

| Role | Description | Can Do |
|------|-------------|--------|
| **Lecturer** | Default for all users | Submit documents, view own submissions |
| **Coordinator** | Additional privilege | Review & approve submissions for assigned courses |
| **Deputy Dean** | Additional privilege | Endorse submissions for assigned courses |
| **Admin** | Additional privilege | Manage users, sessions, departments, courses, mappings |

> **Note:** Users can have multiple privileges (e.g., a user can be Lecturer + Coordinator + Admin)

---

## 🔄 Workflow States

```
DRAFT → SUBMITTED → COORDINATOR_APPROVED → DEAN_ENDORSED
           ↓                    ↓
       REJECTED             REJECTED
```

1. **DRAFT**: Lecturer is still working on submission
2. **SUBMITTED**: Submitted to Coordinator for review
3. **COORDINATOR_APPROVED**: Coordinator approved, sent to Deputy Dean
4. **DEAN_ENDORSED**: Final approval, workflow complete
5. **REJECTED**: Rejected by Coordinator or Deputy Dean

---

## 🛠️ Troubleshooting

### Backend Issues

**Error: "Database connection failed"**
- Ensure XAMPP MySQL is running
- Check port 3306 is not blocked
- Verify database credentials in `.env`

**Error: "Port 5000 already in use"**
- Change `PORT=5001` in `.env` file
- Update `VITE_API_URL` in client if needed

### Frontend Issues

**Error: "Cannot connect to API"**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API base URL in `client/src/services/api.js`

**Error: "Login failed"**
- Check database has sample users
- Verify password is `admin123` (hashed in DB)
- Check browser console for error messages

### File Upload Issues

**Error: "File upload failed"**
- Ensure `server/uploads` directory exists
- Check file size (default limit: 50MB)
- Verify allowed file types in `middleware/upload.js`

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database (XAMPP default)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=workflow_system

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Submissions
- `GET /api/submissions` - Get my submissions
- `POST /api/submissions` - Create submission
- `PUT /api/submissions/:id` - Update submission
- `POST /api/submissions/:id/submit` - Submit for review
- `POST /api/submissions/:id/documents` - Upload document
- `DELETE /api/submissions/:id` - Delete submission

### Reviews
- `GET /api/reviews/coordinator/queue` - Coordinator queue
- `POST /api/reviews/coordinator/submissions/:id/approve` - Approve
- `POST /api/reviews/coordinator/submissions/:id/reject` - Reject
- `GET /api/reviews/dean/queue` - Deputy Dean queue
- `POST /api/reviews/dean/submissions/:id/endorse` - Endorse
- `POST /api/reviews/dean/submissions/:id/reject` - Reject

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/sessions` - List sessions
- `POST /api/admin/sessions` - Create session
- `GET /api/admin/departments` - List departments
- `POST /api/admin/departments` - Create department
- `GET /api/admin/courses` - List courses
- `POST /api/admin/courses` - Create course
- `GET /api/admin/course-roles` - List course role mappings
- `POST /api/admin/course-roles` - Save course role mapping
- `GET /api/admin/audit-logs` - View audit logs

---

## 🎨 UI/UX Notes

- **Color Scheme**: Dark red (#8B0000) primary, gold (#D4AF37) accent
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional academic interface
- **Form Validation**: Client-side and server-side validation
- **Real-time Feedback**: Alert messages for all actions

---

## 📈 Future Enhancements

- [ ] Email notifications for workflow transitions
- [ ] PDF export of submissions
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Multi-language support (English/Malay)

---

## 📄 License

This project is for academic use.

---

## 💬 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review SYSTEM_DESIGN.md for technical details
3. Check browser console and server logs for errors

---

**Built with React, Node.js, Express, and MySQL**

