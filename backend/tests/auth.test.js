const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { generateToken, verifyToken } = require('../src/utils/jwt');

// Ensure a test JWT secret is set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_super_secret_jwt_key_1234567890';

describe('Authentication & Route Protection', () => {
  it('POST /api/auth/register rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Full name is required/);
  });

  it('POST /api/auth/register rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe', email: 'invalid-email', password: 'password123' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /valid email address/);
  });

  it('POST /api/auth/register rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe', email: 'valid@example.com', password: '123' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /at least 6 characters/);
  });

  it('POST /api/auth/login rejects empty body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /valid email address/);
  });

  it('GET /api/auth/me returns 401 when no authorization header is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /No authentication token provided/);
  });

  it('GET /api/auth/me returns 401 when invalid token format is used', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Invalid authentication token/);
  });

  it('JWT utility generates and correctly verifies tokens', () => {
    const userId = '64e4b5f1234567890abcdef1';
    const token = generateToken(userId);

    assert.ok(token);
    assert.strictEqual(typeof token, 'string');

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id, userId);
  });
});
