const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const AdminAuditLog = require('../src/models/AdminAuditLog');
const { provisionInitialAdmin } = require('../src/services/adminProvision.service');
const { generateToken } = require('../src/utils/jwt');

describe('Admin Provisioning, Authentication & RBAC Protection', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularUserToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Provision initial admin
    adminUser = await provisionInitialAdmin();
    adminToken = generateToken(adminUser._id.toString());

    // Create a regular user for RBAC verification
    const testUserEmail = `testuser_${Date.now()}@example.com`;
    regularUser = await User.create({
      name: 'Regular Test User',
      email: testUserEmail,
      password: 'regularUserPassword123',
      role: 'user',
    });
    regularUserToken = generateToken(regularUser._id.toString());
  });

  after(async () => {
    // Cleanup created test regular user
    if (regularUser) {
      await User.deleteOne({ _id: regularUser._id });
    }
    await mongoose.connection.close();
  });

  it('Verifies initial administrator is provisioned with role admin and mustChangePassword', async () => {
    assert.strictEqual(adminUser.email, 'admin@digenttech.com');
    assert.strictEqual(adminUser.role, 'admin');
    assert.ok(adminUser._id);
  });

  it('Allows administrator to log in with initial credentials (admin@digenttech.com / 1111)', async () => {
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@digenttech.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || '1111',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, 'admin@digenttech.com');
    assert.strictEqual(res.body.user.role, 'admin');

    // Verify audit log entry was created
    const log = await AdminAuditLog.findOne({
      adminEmail: 'admin@digenttech.com',
      action: 'ADMIN_LOGIN',
    });
    assert.ok(log, 'Audit log for ADMIN_LOGIN should exist');
  });

  it('Rejects admin login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@digenttech.com',
        password: 'wrongpassword999',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('Rejects admin login when user has role user even with correct password', async () => {
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: regularUser.email,
        password: 'regularUserPassword123',
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Access denied|privileges/);
  });

  it('Protects admin me endpoint from unauthenticated access', async () => {
    const res = await request(app).get('/api/admin/auth/me');
    assert.strictEqual(res.status, 401);
  });

  it('Protects admin me endpoint from ordinary users with role user', async () => {
    const res = await request(app)
      .get('/api/admin/auth/me')
      .set('Authorization', `Bearer ${regularUserToken}`);

    assert.strictEqual(res.status, 403);
    assert.match(res.body.message, /Forbidden|Administrator privileges required/);
  });

  it('Allows verified admin to access admin me endpoint', async () => {
    const res = await request(app)
      .get('/api/admin/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'admin');
  });
});
