import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

describe('College ERP Production Architecture & API Test Suite', () => {
  let adminToken = '';
  let studentToken = '';

  before(async () => {
    // Authenticate Admin
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // Authenticate Student
    const studentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' }),
    });
    const studentData = await studentRes.json();
    studentToken = studentData.token;
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
    assert.ok(studentToken, 'Student token should be successfully generated');

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
});
