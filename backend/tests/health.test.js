const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('GET /api/health returns 200 with success status', async () => {
    const res = await request(app).get('/api/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'API is running');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/non-existent returns 404 with error message', async () => {
    const res = await request(app).get('/api/non-existent');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Resource not found/);
  });
});
