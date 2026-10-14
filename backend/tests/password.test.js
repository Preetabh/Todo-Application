const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const {
  encryptPassword,
  decryptPassword,
  evaluatePasswordStrength,
} = require('../src/utils/crypto.util');

describe('Password Manager Cryptography & Security', () => {
  it('AES-256-GCM properly encrypts and decrypts passwords', () => {
    const rawSecret = 'MySuper$ecretP@ssw0rd!2026';
    const { encrypted, iv, authTag } = encryptPassword(rawSecret);

    assert.ok(encrypted);
    assert.ok(iv);
    assert.ok(authTag);
    assert.notStrictEqual(encrypted, rawSecret);

    const decrypted = decryptPassword(encrypted, iv, authTag);
    assert.strictEqual(decrypted, rawSecret);
  });

  it('Different encryptions of same password produce unique IVs (semantic security)', () => {
    const rawSecret = 'IdenticalPassword123!';
    const enc1 = encryptPassword(rawSecret);
    const enc2 = encryptPassword(rawSecret);

    assert.notStrictEqual(enc1.iv, enc2.iv);
    assert.notStrictEqual(enc1.encrypted, enc2.encrypted);

    assert.strictEqual(decryptPassword(enc1.encrypted, enc1.iv, enc1.authTag), rawSecret);
    assert.strictEqual(decryptPassword(enc2.encrypted, enc2.iv, enc2.authTag), rawSecret);
  });

  it('Evaluating password strength categorizes properly', () => {
    const weak = evaluatePasswordStrength('12345');
    assert.strictEqual(weak.label, 'Weak');

    const strong = evaluatePasswordStrength('K9#mQ8$wL2!vP4');
    assert.ok(['Strong', 'Very Strong'].includes(strong.label));
  });
});

describe('Password Vault API Route Protection', () => {
  it('GET /api/passwords requires authentication (401)', async () => {
    const res = await request(app).get('/api/passwords');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/passwords requires authentication (401)', async () => {
    const res = await request(app)
      .post('/api/passwords')
      .send({ title: 'Google', password: 'secretpassword' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('PATCH /api/passwords/:id requires authentication (401)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/passwords/${fakeId}`)
      .send({ title: 'Google Updated' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('DELETE /api/passwords/:id requires authentication (401)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/passwords/${fakeId}`);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});
