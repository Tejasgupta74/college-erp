import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 8000;
const BASE_URL = `http://localhost:${PORT}/api`;

let spawnedServer = null;

const checkServerHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'online';
    }
  } catch {
    return false;
  }
  return false;
};

describe('College ERP Production Architecture & API Test Suite', () => {
  let adminToken = '';
  let facultyToken = '';
  let studentToken = '';
  let accountantToken = '';

  before(async () => {
    let isOnline = await checkServerHealth();
    if (!isOnline) {
      console.log(`[Test Setup] Backend server offline. Starting node server.js on port ${PORT}...`);
      spawnedServer = spawn('node', ['server.js'], {
        cwd: backendDir,
        env: { ...process.env, PORT: String(PORT) },
        stdio: 'inherit',
      });

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        isOnline = await checkServerHealth();
        if (isOnline) break;
      }

      if (!isOnline) {
        if (spawnedServer) spawnedServer.kill('SIGINT');
        throw new Error(`[Test Setup] Failed to boot backend server on ${BASE_URL}`);
      }
      console.log('[Test Setup] Backend server is online and ready for tests.');
    }

    // 1. Authenticate Admin
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' }),
    });
    const adminData = await adminRes.json();
    assert.equal(adminRes.status, 200, `Admin login failed: ${JSON.stringify(adminData)}`);
    adminToken = adminData.token;

    // 2. Authenticate Faculty
    const facultyRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'prof.sharma@college.edu', password: 'Faculty@123' }),
    });
    const facultyData = await facultyRes.json();
    assert.equal(facultyRes.status, 200, `Faculty login failed: ${JSON.stringify(facultyData)}`);
    facultyToken = facultyData.token;

    // 3. Authenticate Student
    const studentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' }),
    });
    const studentData = await studentRes.json();
    assert.equal(studentRes.status, 200, `Student login failed: ${JSON.stringify(studentData)}`);
    studentToken = studentData.token;

    // 4. Authenticate Accountant
    const accRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'accountant@college.edu', password: 'Accountant@123' }),
    });
    const accData = await accRes.json();
    assert.equal(accRes.status, 200, `Accountant login failed: ${JSON.stringify(accData)}`);
    accountantToken = accData.token;
  });

  test('1. Health Check Endpoint & Correlation ID Injection', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'online');
    assert.ok(data.requestId, 'Response should contain correlation requestId');
    assert.ok(res.headers.get('x-request-id'), 'Headers should include X-Request-Id');
  });

  test('2. Authentication Flow & Token Validation', async () => {
    assert.ok(adminToken, 'Admin token should be successfully generated');
    assert.ok(facultyToken, 'Faculty token should be successfully generated');
    assert.ok(studentToken, 'Student token should be successfully generated');
    assert.ok(accountantToken, 'Accountant token should be successfully generated');

    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.role, 'admin');
  });

  test('3. RBAC & Permissions Enforcement (Admin vs Student)', async () => {
    // Admin can access metrics telemetry
    const adminMetrics = await fetch(`${BASE_URL}/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminMetrics.status, 200);

    // Student should be forbidden from accessing metrics telemetry
    const studentMetrics = await fetch(`${BASE_URL}/metrics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(studentMetrics.status, 403);
  });

  test('4. In-Memory / Redis Caching Layer Verification', async () => {
    // First request - prime cache
    const res1 = await fetch(`${BASE_URL}/academics/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res1.status, 200);

    // Second request - should yield cache HIT
    const res2 = await fetch(`${BASE_URL}/academics/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('x-cache'), 'HIT');
  });

  test('5. Metrics & Telemetry Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.data.system.uptimeSeconds >= 0);
    assert.ok(data.data.memoryUsageMb.heapUsed > 0);
    assert.equal(data.data.database.status, 'CONNECTED');
    assert.ok(data.data.cache.hits >= 1);
  });

  test('6. In-App Notifications API & Mark All As Read', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(Array.isArray(data.data));

    const readAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(readAllRes.status, 200);
    const readAllData = await readAllRes.json();
    assert.equal(readAllData.success, true);
  });

  test('7. Attendance Module: Fetch Dossier & Eligibility', async () => {
    const res = await fetch(`${BASE_URL}/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(Array.isArray(data.data));
  });

  test('8. Exams & Grades Module: Fetch Report Card', async () => {
    const res = await fetch(`${BASE_URL}/exams/report-card/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(Array.isArray(data.data));
  });

  test('9. Fees Module: Invoices, Atomic Payments & Status Aggregation Pipeline', async () => {
    const res = await fetch(`${BASE_URL}/fees?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${accountantToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(data.total >= 0);
    assert.ok(Array.isArray(data.data));

    if (data.data.length > 0) {
      const targetInvoice = data.data.find((f) => f.paidAmount < f.totalAmount);
      if (targetInvoice) {
        const remaining = targetInvoice.totalAmount - targetInvoice.paidAmount;
        const payChunk = Math.min(100, remaining);

        // Record partial payment atomically via aggregation pipeline
        const payRes = await fetch(`${BASE_URL}/fees/${targetInvoice._id}/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accountantToken}`,
          },
          body: JSON.stringify({ amount: payChunk, method: 'UPI' }),
        });
        assert.equal(payRes.status, 200);
        const payData = await payRes.json();
        assert.ok(payData.success);
        assert.ok(payData.receipt?.receiptNo);
        assert.ok(['Partial', 'Paid'].includes(payData.data.status));
      }
    }
  });

  test('10. Cryptographic Token Password Reset Flow & Account Takeover Prevention', async () => {
    // 1. Request password reset token
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu' }),
    });
    assert.equal(forgotRes.status, 200);
    const forgotData = await forgotRes.json();
    assert.ok(forgotData.success);
    assert.ok(forgotData.resetToken, 'Non-production environment should supply reset token for testing');

    // 2. Unauthenticated direct reset without token must fail
    const directFailRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', newPassword: 'HackedAdmin@123' }),
    });
    assert.equal(directFailRes.status, 400, 'Direct password reset without token must be blocked');

    // 3. Reset password using valid cryptographic token
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotData.resetToken,
        newPassword: 'Student@123',
      }),
    });
    assert.equal(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.ok(resetData.success);
    assert.match(resetData.message, /Password reset successfully/i);
  });

  test('11. Student Cohort Roster API for Attendance & Examination Grading', async () => {
    // 1. Fetch full roster as admin
    const rosterRes = await fetch(`${BASE_URL}/students/roster`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(rosterRes.status, 200);
    const rosterData = await rosterRes.json();
    assert.ok(rosterData.success);
    assert.ok(Array.isArray(rosterData.data));
    assert.ok(rosterData.count >= 0);

    // 2. Fetch roster with section filter
    const sectionRosterRes = await fetch(`${BASE_URL}/students/roster?section=A`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(sectionRosterRes.status, 200);
    const sectionRosterData = await sectionRosterRes.json();
    assert.ok(sectionRosterData.success);
    assert.ok(Array.isArray(sectionRosterData.data));

    // 3. Unauthorized access by student must be rejected
    const freshStudentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' }),
    });
    const freshStudentData = await freshStudentLogin.json();
    const freshStudentToken = freshStudentData.token;

    const studentFailRes = await fetch(`${BASE_URL}/students/roster`, {
      headers: { Authorization: `Bearer ${freshStudentToken}` },
    });
    assert.equal(studentFailRes.status, 403, 'Students must not access cohort rosters');
  });

  after(async () => {
    if (spawnedServer) {
      console.log('[Test Teardown] Stopping test backend server process...');
      spawnedServer.kill('SIGINT');
    }
  });
});
