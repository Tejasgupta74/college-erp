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

  test('12. Attendance: Future Date Rejection & Non-Destructive Multi-Session Creation', async () => {
    // Fetch a course to test with
    const coursesRes = await fetch(`${BASE_URL}/academics/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coursesData = await coursesRes.json();
    assert.ok(coursesData.data.length > 0);
    const course = coursesData.data[0];

    // Fetch enrolled students for this course's dept & semester
    const rosterRes = await fetch(
      `${BASE_URL}/students/roster?department=${course.department._id || course.department}&semester=${course.semester}&section=A`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const rosterData = await rosterRes.json();
    assert.ok(rosterData.data.length > 0);
    const studentUser = rosterData.data[0].user._id || rosterData.data[0].user;

    // 1. Future date attendance (2030) must be rejected with 400
    const futureDateRes = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        courseId: course._id,
        departmentId: course.department._id || course.department,
        semester: course.semester,
        section: 'A',
        date: '2030-01-01',
        topicCovered: 'Future Lecture',
        records: [{ student: studentUser, status: 'Present' }],
      }),
    });
    assert.equal(futureDateRes.status, 400, 'Future attendance dates must return 400');
    const futureDateData = await futureDateRes.json();
    assert.match(futureDateData.message, /future dates/i);

    // 2. Mark session 1: "Lecture 1"
    const todayStr = new Date().toISOString().slice(0, 10);
    const session1Res = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        courseId: course._id,
        departmentId: course.department._id || course.department,
        semester: course.semester,
        section: 'A',
        date: todayStr,
        topicCovered: 'Lecture 1',
        records: [{ student: studentUser, status: 'Present' }],
      }),
    });
    assert.ok([200, 201].includes(session1Res.status));
    const session1Data = await session1Res.json();
    const id1 = session1Data.data._id;

    // 3. Mark session 2 on same day: "Lecture 2"
    const session2Res = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        courseId: course._id,
        departmentId: course.department._id || course.department,
        semester: course.semester,
        section: 'A',
        date: todayStr,
        topicCovered: 'Lecture 2',
        records: [{ student: studentUser, status: 'Present' }],
      }),
    });
    assert.ok([200, 201].includes(session2Res.status));
    const session2Data = await session2Res.json();
    const id2 = session2Data.data._id;

    // Must be two distinct sessions, session 2 did not overwrite session 1
    assert.notEqual(id1, id2, 'Second session on the same day must not overwrite the first session');
  });

  test('13. Fee Invoices: Non-Positive Amount Rejection, Student-Only Billing & Method Validation', async () => {
    // Fetch departments and admin profile
    const deptsRes = await fetch(`${BASE_URL}/academics/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deptsData = await deptsRes.json();
    const deptId = deptsData.data[0]._id;

    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    const adminUserId = meData.user._id;

    // 1. Negative amount must be rejected with 400
    const negRes = await fetch(`${BASE_URL}/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: adminUserId,
        departmentId: deptId,
        totalAmount: -500,
      }),
    });
    assert.equal(negRes.status, 400, 'Negative invoice amount must return 400');

    // 2. Zero amount must be rejected with 400
    const zeroRes = await fetch(`${BASE_URL}/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: adminUserId,
        departmentId: deptId,
        totalAmount: 0,
      }),
    });
    assert.equal(zeroRes.status, 400, 'Zero invoice amount must return 400');

    // 3. Billing to non-student (admin) must be rejected with 400
    const adminBillRes = await fetch(`${BASE_URL}/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        studentId: adminUserId,
        departmentId: deptId,
        totalAmount: 5000,
      }),
    });
    assert.equal(adminBillRes.status, 400, 'Billing an invoice to an admin user must return 400');
    const adminBillData = await adminBillRes.json();
    assert.match(adminBillData.message, /student accounts/i);

    // 4. Unknown payment method ("Bitcoin") must be rejected with 400
    const feesRes = await fetch(`${BASE_URL}/fees?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const feesData = await feesRes.json();
    if (feesData.data.length > 0) {
      const feeId = feesData.data[0]._id;
      const invalidPayRes = await fetch(`${BASE_URL}/fees/${feeId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ amount: 100, method: 'Bitcoin' }),
      });
      assert.equal(invalidPayRes.status, 400, 'Unknown payment method must return 400');
      const invalidPayData = await invalidPayRes.json();
      assert.match(invalidPayData.message, /Invalid payment method/i);
    }
  });

  test('14. Exams Module: Reject Blank or Null Marks (No Silent 0/F Assignment)', async () => {
    const examsRes = await fetch(`${BASE_URL}/exams?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const examsData = await examsRes.json();
    if (examsData.data.length > 0) {
      const exam = examsData.data[0];
      const rosterRes = await fetch(
        `${BASE_URL}/students/roster?department=${exam.department._id || exam.department}&semester=${exam.semester}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const rosterData = await rosterRes.json();
      if (rosterData.data.length > 0) {
        const studentId = rosterData.data[0].user._id || rosterData.data[0].user;

        // Submitting null marks must return 400
        const nullMarksRes = await fetch(`${BASE_URL}/exams/${exam._id}/marks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            results: [{ studentId, marksObtained: null }],
          }),
        });
        assert.equal(nullMarksRes.status, 400, 'Null marks must be rejected with 400');

        // Submitting empty string marks must return 400
        const blankMarksRes = await fetch(`${BASE_URL}/exams/${exam._id}/marks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            results: [{ studentId, marksObtained: '' }],
          }),
        });
        assert.equal(blankMarksRes.status, 400, 'Blank marks must be rejected with 400');
      }
    }
  });

  test('15. Bad Input Resilience (Graceful 400s Instead of 500 Internal Server Errors)', async () => {
    // 1. roster?courseId=zzz -> 400
    const badCourseRes = await fetch(`${BASE_URL}/students/roster?courseId=zzz`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(badCourseRes.status, 400, 'Invalid courseId should return 400');

    // 2. /students?semester=abc -> 400
    const badSemRes = await fetch(`${BASE_URL}/students?semester=abc`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(badSemRes.status, 400, 'Invalid semester should return 400');

    // 3. /students?search[$ne]=x -> 400
    const badSearchRes = await fetch(`${BASE_URL}/students?search[$ne]=x`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(badSearchRes.status, 400, 'Object search param should return 400');

    // 4. /fees?studentId=notanid -> 400
    const badFeeStudentRes = await fetch(`${BASE_URL}/fees?studentId=notanid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(badFeeStudentRes.status, 400, 'Invalid studentId query should return 400');

    // 5. POST /auth/login with object as email -> 400
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $gt: '' }, password: 'password123' }),
    });
    assert.equal(badLoginRes.status, 400, 'Non-string email in login must return 400');

    // 6. GET /students/roster by Accountant -> 403 Forbidden
    const accountantRosterRes = await fetch(`${BASE_URL}/students/roster`, {
      headers: { Authorization: `Bearer ${accountantToken}` },
    });
    assert.equal(accountantRosterRes.status, 403, 'Accountants must not be authorized on /roster');
  });

  test('16. Course Instructor RBAC: Reject Student/Non-Faculty as Instructor on Create & Update', async () => {
    // 1. Fetch departments to get a valid deptId
    const deptsRes = await fetch(`${BASE_URL}/academics/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deptsData = await deptsRes.json();
    const deptId = deptsData.data[0]._id;

    // 2. Fetch student user ID
    const studentsRes = await fetch(`${BASE_URL}/students?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const studentsData = await studentsRes.json();
    const studentUserId = studentsData.data[0].user._id || studentsData.data[0].user;

    // 3. Attempt to create course with a student assigned as faculty instructor
    const createWithStudentRes = await fetch(`${BASE_URL}/academics/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Invalid Instructor Course',
        code: `INV${Date.now().toString().slice(-4)}`,
        credits: 3,
        department: deptId,
        semester: 1,
        faculty: studentUserId,
      }),
    });
    assert.equal(createWithStudentRes.status, 400, 'Assigning a student as course instructor must return 400');
    const createData = await createWithStudentRes.json();
    assert.match(createData.message, /faculty role/i);

    // 4. Attempt to update an existing course with a student assigned as faculty instructor
    const coursesRes = await fetch(`${BASE_URL}/academics/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const coursesData = await coursesRes.json();
    const courseId = coursesData.data[0]._id;

    const updateWithStudentRes = await fetch(`${BASE_URL}/academics/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        faculty: studentUserId,
      }),
    });
    assert.equal(updateWithStudentRes.status, 400, 'Updating a course with a student as instructor must return 400');
    const updateData = await updateWithStudentRes.json();
    assert.match(updateData.message, /faculty role/i);
  });

  test('17. Strict Pagination Validation (limit=1.5, limit=abc, limit=0, page=0 return 400)', async () => {
    // 1. limit=1.5 must return 400
    const limitFloatRes = await fetch(`${BASE_URL}/students?limit=1.5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(limitFloatRes.status, 400, 'limit=1.5 must return 400');

    // 2. limit=abc must return 400
    const limitAlphaRes = await fetch(`${BASE_URL}/students?limit=abc`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(limitAlphaRes.status, 400, 'limit=abc must return 400');

    // 3. limit=0 must return 400
    const limitZeroRes = await fetch(`${BASE_URL}/students?limit=0`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(limitZeroRes.status, 400, 'limit=0 must return 400');

    // 4. page=0 must return 400
    const pageZeroRes = await fetch(`${BASE_URL}/students?page=0`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(pageZeroRes.status, 400, 'page=0 must return 400');
  });

  test('18. File Upload Real Magic Byte Verification & 11 MB JSON Body 413 Rejection', async () => {
    // 1. Upload file with HTML content named fake.png -> must be rejected with 400
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakeFileContent = '<html><body><h1>Not an image</h1></body></html>';
    const multipartBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="fake.png"',
      'Content-Type: image/png',
      '',
      fakeFileContent,
      `--${boundary}--`,
    ].join('\r\n');

    const fakeUploadRes = await fetch(`${BASE_URL}/upload/file`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: multipartBody,
    });
    assert.equal(fakeUploadRes.status, 400, 'Uploading HTML disguised as PNG must be rejected with 400');
    const fakeUploadData = await fakeUploadRes.json();
    assert.match(fakeUploadData.message, /Invalid file signature/i);

    // 2. 11 MB JSON body must return 413 Payload Too Large
    const elevenMbString = 'A'.repeat(11 * 1024 * 1024);
    const hugeBodyRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123', payload: elevenMbString }),
    });
    assert.equal(hugeBodyRes.status, 413, '11 MB JSON body must return 413 Payload Too Large');
  });

  after(async () => {
    if (spawnedServer) {
      console.log('[Test Teardown] Stopping test backend server process...');
      spawnedServer.kill('SIGINT');
    }
  });
});
