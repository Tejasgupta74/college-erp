# College ERP System (Production Architecture)

An enterprise-grade Institutional Resource Planning (ERP) platform built with the MERN stack (Node.js, Express.js, React 18 with Vite, TailwindCSS, and MongoDB). Designed for high reliability, role-based access security, academic administration, attendance logging, grade publishing, and fee collection.

---

## 🚀 Key Modules & Capabilities

- **Institutional Identity & Branding**: Unified under "College ERP System".
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Super Admin`, `Faculty`, `Student`, and `Accountant`.
- **Student Desk & Dossier**: Complete enrollment tracking, parent/guardian contact records, sections, and semesters.
- **Faculty & Course Allocation**: Faculty course assignments, departmental mapping, and qualification profiles.
- **Attendance Management**: Lecture tracking with live percentage calculators and automated shortage warnings (<75%).
- **Examinations & Grading**: Evaluation engine supporting automated letter grades (`A+` to `F`), cumulative percentages, and digital grade cards.
- **Fee Management**: Tuition and lab fee invoice generation, status tracking (`Paid`, `Partial`, `Pending`), and downloadable receipts.
- **Digital PDF & Excel Export**: Client-side PDF generation for Fee Receipts and Marksheets (`jspdf`), alongside Excel/CSV roster downloads (`xlsx`).
- **Institutional Bulletins & Real-Time Alerts**: Pinned, priority-ranked notices with in-app notification alerts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (ESM), Express.js 4.x, Mongoose 8.x, Winston Logger, Morgan, Helmet, Express-Rate-Limit, Express-Mongo-Sanitize, Cookie-Parser |
| **Database** | MongoDB Atlas / MongoDB Enterprise Replica Set with Compound Indexes |
| **Caching** | Redis-ready caching layer with fallback in-memory TTL store |
| **Frontend** | React 18, Vite, React Router DOM 6, TailwindCSS, Lucide Icons, Recharts, jsPDF, XLSX |
| **DevOps & Containers** | Docker (multi-stage builds), Docker Compose, GitHub Actions CI Pipeline |

---

## 📁 Project Structure

```
college-erp/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI automated build & test pipeline
├── backend/
│   ├── config/
│   │   ├── cache.js               # Redis / In-memory caching engine
│   │   ├── db.js                  # MongoDB connection with error recovery
│   │   ├── logger.js              # Winston log transports (file + console)
│   │   └── storage.js             # Multer upload limits and file filters
│   ├── controllers/               # Business logic controllers
│   ├── middlewares/
│   │   ├── asyncHandler.js        # Async wrapper for unhandled rejections
│   │   ├── auth.js                # JWT & HttpOnly cookie verification, RBAC
│   │   ├── errorHandler.js        # Centralized JSON error formatting
│   │   ├── rateLimiter.js         # API and brute-force auth rate limiters
│   │   └── requestId.js           # Distributed correlation ID injection
│   ├── models/                    # Mongoose schemas with compound indexes
│   ├── routes/                    # Protected REST endpoint routing
│   ├── tests/
│   │   └── api.test.js            # Node test suite (9 integration suites)
│   ├── utils/                     # Token generators and audit log helpers
│   ├── Dockerfile                 # Multi-stage production container
│   ├── seeder.js                  # Dev-only database seeder (blocked in prod)
│   ├── server.js                  # Express application & graceful shutdown
│   └── .env.example               # Backend environment variable template
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios client with interceptors
│   │   ├── components/            # Reusable UI widgets & Modals
│   │   ├── context/               # AuthContext session provider
│   │   ├── layouts/               # Dashboard layout with sidebar navigation
│   │   ├── pages/                 # Code-split ERP views
│   │   └── utils/
│   │       └── exportUtils.js     # Institutional PDF and Excel generator
│   ├── Dockerfile                 # Multi-stage NGINX production container
│   ├── nginx.conf                 # NGINX reverse-proxy configuration
│   └── vite.config.js             # Vite build optimizer
├── docker-compose.yml             # Orchestration for MongoDB, Redis, API & Web
└── README.md
```

---

## ⚙️ Environment Variables (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and update values:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | HTTP listening port for Express API | `8000` |
| `NODE_ENV` | Yes | Environment mode (`development` or `production`) | `production` |
| `MONGODB_URI` | Yes | Connection string for MongoDB Atlas or local instance | `mongodb+srv://user:pass@cluster.mongodb.net/college_erp` |
| `JWT_SECRET` | Yes | Secret key for signing session tokens (≥32 chars in prod) | `strong_secret_key_minimum_32_chars_2026` |
| `JWT_EXPIRE` | No | Token lifespan (defaults to `7d`) | `7d` |
| `CORS_ORIGIN` | Yes | Permitted frontend domain for CORS headers | `http://localhost:3000` |
| `CLIENT_URL` | No | Frontend URL for external links and email redirects | `http://localhost:3000` |
| `LOG_LEVEL` | No | Minimum Winston logging level (`info`, `warn`, `error`) | `info` |

---

## 🏃 Local Setup & Development

### 1. Prerequisites
- Node.js `v20.x` or `v22.x`
- MongoDB local instance or MongoDB Atlas cluster connection

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URI and secrets
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Seeding & Demo Credentials (Development Only)

> [!WARNING]
> The database seeder refuses to run if `NODE_ENV=production`. It is designed strictly for local staging and test environments.

Run the seeder from the backend directory:
```bash
cd backend
npm run seed
```

### Development Demo Accounts
| Role | Institutional Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@college.edu` | `Admin@123` | Full access across all administration, users, and audit logs |
| **Faculty (HOD)** | `prof.sharma@college.edu` | `Faculty@123` | Assigned courses, attendance marking, student grades |
| **Student** | `student@college.edu` | `Student@123` | Self profile, attendance dossier, fee dues, report cards |
| **Accountant** | `accountant@college.edu` | `Accountant@123` | Fee structures, student payment collection, receipt issuing |

*Note: Demo 1-Click Access buttons on the login screen automatically disappear in production mode.*

---

## 📡 Core API Endpoints

### Authentication (`/api/auth`)
- `POST /login`: Authenticates credentials; returns token and sets HTTP-only cookie.
- `POST /logout`: Clears authentication cookie.
- `POST /forgot-password`: Generates secure SHA-256 expiring reset token.
- `POST /reset-password`: Resets password using verified token.
- `GET /me`: Returns profile of the authenticated user.

### Academics & Administration (`/api/academics`)
- `GET /departments`: Lists academic departments (cached).
- `POST /departments`: Creates department (Admin only).
- `GET /courses`: Lists courses with faculty allocations.
- `POST /courses`: Creates academic course (Admin only).

### Student Management (`/api/students`)
- `GET /`: Lists students with roll numbers and pagination (Admin, Faculty, Accountant).
- `GET /:id`: Retrieves complete student dossier including fee and exam history.

### Attendance Module (`/api/attendance`)
- `POST /`: Records or updates class session attendance.
- `GET /student/:studentId`: Returns student course attendance percentages and shortage flags.

### Exams & Marks (`/api/exams`)
- `GET /`: Lists examinations and results with pagination.
- `POST /:id/marks`: Submits marks and generates automated letter grades.
- `GET /report-card/:studentId`: Generates formatted grade sheets.

### Fee Management (`/api/fees`)
- `GET /`: Lists fee invoices with pagination and filters.
- `POST /`: Generates new fee invoices (Admin, Accountant).
- `POST /:id/pay`: Records payment and issues transaction receipt.

---

## 🚢 Production Deployment Checklist

1. **Environment Security**:
   - Ensure `NODE_ENV=production`.
   - Set `JWT_SECRET` to a cryptographically random string (≥ 32 characters).
   - Set `CORS_ORIGIN` to the exact production domain (never `*`).
2. **Database Hardening**:
   - Enable SSL/TLS encryption for MongoDB connections (`retryWrites=true&w=majority`).
   - Create dedicated database user roles with least privilege.
3. **Container Deployment**:
   ```bash
   JWT_SECRET="your_secure_32_char_secret_key" docker compose up -d --build
   ```
4. **Automated Testing**:
   - Execute the test suite before triggering production deployment:
   ```bash
   cd backend && npm test
   cd ../frontend && npm run build
   ```
