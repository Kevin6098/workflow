
# Workflow System – Admin Module Requirements

## 1. Purpose of Admin Module

The Admin Module is responsible for managing **user privileges, role scope assignments, and workflow routing rules** for the academic document workflow system.  
The module ensures that documents are routed correctly from **Lecturer → Course Coordinator → Deputy Dean (Academic)** while preserving lecturer-level access for all academic staff.

---

## 2. Role and Privilege Model

### 2.1 Design Principle

- **All users are Lecturers by default**
- Additional responsibilities are granted as **privileges**, not replacements of roles
- A user may hold multiple privileges simultaneously

This design ensures that:
- Coordinators and Deputy Deans retain Lecturer capabilities
- The system remains flexible and scalable

### 2.2 Privilege Types

| Privilege | Description |
|---------|------------|
| Lecturer | Default access for all users (implicit) |
| Coordinator | Can review and approve submissions |
| Deputy Dean | Can endorse or reject approved submissions |
| Admin | Can manage users, privileges, and assignments |

> Lecturer privilege is implicit and does not need to be stored in the database.

---

## 3. Admin Functional Requirements

### 3.1 User Privilege Management

**Admin must be able to:**

- View all users
- Assign or revoke privileges:
  - Coordinator
  - Deputy Dean
  - Admin
- Ensure privilege-based access control

**Restrictions:**
- Users without Coordinator privilege cannot be assigned as coordinators
- Users without Deputy Dean privilege cannot be assigned as deputy deans

---

### 3.2 Scope Assignment Management

Privileges alone do not define workflow routing. Admin must define **who reviews which submissions**.

#### 3.2.1 Course-Based Assignment (Recommended)

Admin assigns:
- One Course Coordinator per course
- One Deputy Dean per course or per faculty (fallback)

**Example:**
- Course: DS101
- Coordinator: User A
- Deputy Dean: User B

All submissions under DS101 follow this approval chain.

---

### 3.2.2 Faculty-Based Default Assignment (Optional)

If no course-level deputy dean is assigned:
- System falls back to faculty-level deputy dean assignment

This simplifies management for large faculties.

---

## 4. Workflow Routing Logic (Admin-Defined)

### 4.1 Submission Routing

When a Lecturer submits a document:

1. System identifies course
2. Finds assigned Course Coordinator
3. Sets:
   - Status = `SUBMITTED`
   - Current Assignee = Coordinator

### 4.2 Approval Routing

When Coordinator approves:

1. System identifies assigned Deputy Dean
2. Sets:
   - Status = `COORDINATOR_APPROVED`
   - Current Assignee = Deputy Dean

### 4.3 Final Endorsement

When Deputy Dean endorses:

- Status = `DEAN_ENDORSED`
- Workflow ends
- No further assignee

---

## 5. Database Design (Admin-Related Tables)

### 5.1 User Privileges Table

**user_privileges**

| Field | Description |
|------|------------|
| id | Primary key |
| user_id | Reference to user |
| privilege | COORDINATOR / DEPUTY_DEAN / ADMIN |
| active | Boolean |
| created_at | Timestamp |

---

### 5.2 Course Role Mapping Table

**course_role_map**

| Field | Description |
|------|------------|
| id | Primary key |
| course_id | Reference to course |
| coordinator_user_id | Assigned coordinator |
| deputy_dean_user_id | Assigned deputy dean |
| active | Boolean |

---

### 5.3 Faculty Role Mapping Table (Optional)

**faculty_role_map**

| Field | Description |
|------|------------|
| id | Primary key |
| faculty_id | Reference to faculty |
| deputy_dean_user_id | Default deputy dean |
| active | Boolean |

---

## 6. Admin User Interface Design

### 6.1 User Management Screen

**Features:**
- Search users
- View current privileges
- Toggle privileges on/off
- View assigned scope (courses/faculty)

---

### 6.2 Course Assignment Screen

**Features:**
- Select course
- Assign coordinator
- Assign deputy dean
- Enable/disable assignment

---

## 7. Navigation and Access Control

### Menu Visibility Rules

| Menu | Visibility |
|-----|-----------|
| Lecturer Dashboard | All users |
| Coordinator Review Queue | Users with Coordinator privilege |
| Deputy Dean Endorsement Queue | Users with Deputy Dean privilege |
| Admin Panel | Users with Admin privilege |

---

## 8. Admin Guardrails and Best Practices

- Prevent circular approval (same user approving and endorsing)
- Log all admin changes for audit purposes
- Validate assignments before saving
- Allow multiple coordinators only if policy permits
- Keep assignment history for traceability

---

## 9. Summary

The Admin Module ensures:
- Clear separation between **privileges** and **workflow scope**
- Coordinators and Deputy Deans retain lecturer access
- Flexible, policy-compliant workflow routing
- Maintainable and auditable role management

This design supports future expansion without breaking existing workflows.
