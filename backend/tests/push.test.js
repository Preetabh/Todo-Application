const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const DevicePushToken = require('../src/models/DevicePushToken');
const NotificationCampaign = require('../src/models/NotificationCampaign');
const { generateToken } = require('../src/utils/jwt');

describe('Push Notification Registration & Admin Campaign Management', () => {
  let adminUser;
  let adminToken;
  let regularUser;
  let regularUserToken;
  let testCampaignId;

  const validExpoToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Find or create test admin
    adminUser = await User.findOne({ email: 'admin@digenttech.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'DIGENT Admin',
        email: 'admin@digenttech.com',
        password: '1111',
        role: 'admin',
      });
    }
    adminToken = generateToken(adminUser._id.toString());

    // Create test regular user
    regularUser = await User.create({
      name: 'Push Test Mobile User',
      email: `mobile_push_${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
    });
    regularUserToken = generateToken(regularUser._id.toString());
  });

  after(async () => {
    if (regularUser) {
      await DevicePushToken.deleteMany({ userId: regularUser._id });
      await User.deleteOne({ _id: regularUser._id });
    }
    if (testCampaignId) {
      await NotificationCampaign.deleteOne({ _id: testCampaignId });
    }
    await mongoose.connection.close();
  });

  it('POST /api/push/register rejects invalid push token format', async () => {
    const res = await request(app)
      .post('/api/push/register')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        expoPushToken: 'invalid_token_12345',
        platform: 'android',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /valid Expo Push Token/);
  });

  it('POST /api/push/register registers a valid Expo push token', async () => {
    const res = await request(app)
      .post('/api/push/register')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        expoPushToken: validExpoToken,
        platform: 'android',
        deviceName: 'Pixel 8 Pro Test',
        appVersion: '1.1.1',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.expoPushToken, validExpoToken);
    assert.strictEqual(res.body.data.isActive, true);

    const tokenDoc = await DevicePushToken.findOne({ expoPushToken: validExpoToken });
    assert.ok(tokenDoc);
    assert.strictEqual(tokenDoc.userId.toString(), regularUser._id.toString());
  });

  it('DELETE /api/push/unregister deactivates the user token', async () => {
    const res = await request(app)
      .delete('/api/push/unregister')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        expoPushToken: validExpoToken,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const tokenDoc = await DevicePushToken.findOne({ expoPushToken: validExpoToken });
    assert.strictEqual(tokenDoc.isActive, false);
  });

  it('GET /api/admin/push/stats rejects regular user access with 403', async () => {
    const res = await request(app)
      .get('/api/admin/push/stats')
      .set('Authorization', `Bearer ${regularUserToken}`);

    assert.strictEqual(res.status, 403);
  });

  it('GET /api/admin/push/stats returns accurate real statistics for admin', async () => {
    const res = await request(app)
      .get('/api/admin/push/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.stats);
    assert.ok(typeof res.body.stats.totalUsers === 'number');
    assert.ok(typeof res.body.stats.usersWithActiveTokens === 'number');
    assert.ok(typeof res.body.stats.totalCampaigns === 'number');
    assert.ok(res.body.stats.platformBreakdown);
  });

  it('POST /api/admin/push/send schedules a future campaign', async () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/admin/push/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Flash Sale Reminder',
        message: 'Exclusive weekend deal is live now!',
        recipientType: 'all',
        deliverySchedule: 'later',
        scheduledAt: futureDate,
        deepLink: 'myfirstapp://home',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.campaign.status, 'scheduled');
    testCampaignId = res.body.campaign.id;
  });

  it('POST /api/admin/push/campaigns/:id/cancel cancels a scheduled campaign', async () => {
    assert.ok(testCampaignId);
    const res = await request(app)
      .post(`/api/admin/push/campaigns/${testCampaignId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.campaign.status, 'cancelled');
  });
});
