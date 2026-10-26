# Apex College ERP System (MERN Stack)

A cloud-ready educational Enterprise Resource Planning (ERP) platform built with **MongoDB, Express.js, React 18, and Node.js**.

---

## 🚀 Key Modules & Capabilities

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin**: System governance, department setup, course catalog, faculty & student onboarding.
   - **Faculty / Instructor**: Subject allocations, attendance recording, examination marks entry.
   - **Student**: Personal profile, course enrollments, lecture attendance stats (with &lt;75% warning), grade cards, and fee receipts.
   - **Accountant / Finance**: Fee structures, invoice issuance, balance collection, transaction history.

2. **Student Information System (SIS)**:
   - Automated roll number & enrollment number tracking, guardian emergency contacts, semester & section mapping.

3. **Academic & Curriculum Engine**:
   - Department directory, syllabus credits, core vs. elective subjects, faculty allocations.

4. **Attendance Management**:
   - Faculty session logger with one-click "Mark All Present/Absent", live attendance percentage calculation, and eligibility warnings.

5. **Financial & Fee Management**:
   - Semester fee schedules, dues tracking, online & offline payment settlement, and instant receipts.

6. **Examinations & Grading**:
   - Assessment scheduling (Internal/Mid-Term, Final/End-Term, Lab), automated grade computation (A+, A, B, C, D, P, F), and digital grade cards.

7. **Campus Notice Board**:
   - Pinned announcements, priority badges (Urgent, Important), and role-targeted messaging.

---

## 🔑 Demo Credentials (Ready-to-Use)

The system is pre-seeded with sample data. You can log in using the credentials below, or click the **Demo 1-Click Access** buttons on the login page:

| Role | Email | Password | Key Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@college.edu` | `Admin@123` | Full administrative control |
| **Faculty (HOD)** | `prof.sharma@college.edu` | `Faculty@123` | Attendance & Grade entry |
| **Student** | `student@college.edu` | `Student@123` | Attendance %, Fees, Grades |
| **Accountant** | `accountant@college.edu` | `Accountant@123` | Fee invoicing & Collections |

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas

### 2. Seeding Data (Already Pre-Seeded)
If you ever want to re-seed the sample dataset:
```bash
cd backend
npm run seed
```

### 3. Running Backend (Port 5000)
```bash
cd backend
npm run dev
```

### 4. Running Frontend (Port 5173)
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.
