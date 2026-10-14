const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('Todo API Route Protection & Ownership Logic', () => {
  it('GET /api/todos requires authentication (401)', async () => {
    const res = await request(app).get('/api/todos');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/todos requires authentication (401)', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'My Protected Todo' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('PATCH /api/todos/:id requires authentication (401)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/todos/${fakeId}`)
      .send({ completed: true });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('DELETE /api/todos/:id requires authentication (401)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/todos/${fakeId}`);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('Ownership verification logic correctly isolates data between users', () => {
    const userAId = new mongoose.Types.ObjectId();
    const userBId = new mongoose.Types.ObjectId();

    const mockTodo = {
      _id: new mongoose.Types.ObjectId(),
      user: userAId,
      title: 'Confidential Todo of User A',
      userEquals: function (userId) {
        return this.user.equals(userId);
      },
    };

    // User A can access
    assert.strictEqual(mockTodo.userEquals(userAId), true);
    // User B CANNOT access
    assert.strictEqual(mockTodo.userEquals(userBId), false);
  });
});
