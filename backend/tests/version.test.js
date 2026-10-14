const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('App Version API', () => {
  it('GET /api/app-version returns 200 with required version payload', async () => {
    const res = await request(app).get('/api/app-version');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.latestVersion === 'string');
    assert.ok(typeof res.body.minimumVersion === 'string');
    assert.ok(typeof res.body.apkUrl === 'string');
    assert.ok(typeof res.body.updateMessage === 'string');
    assert.strictEqual(typeof res.body.forceUpdate, 'boolean');
    assert.ok(res.body.apkUrl.startsWith('https://'));
  });
});
