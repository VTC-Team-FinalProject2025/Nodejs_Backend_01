import request from 'supertest';
import app from '../index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Server } from 'http';
let server: Server;

beforeAll(() => {
    server = app.listen();
});

afterAll(() => {
    server.close();
});

describe('NotificationController API Tests', () => {
    let authToken = '';
    let notificationId = '';

    // Login before tests
    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                input: 'test@gmail.com',
                password: 'test@'
            });
        authToken = res.body.token;
    });

    it('should get user notifications', async () => {
        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('should mark notification as read', async () => {
        const res = await request(app)
            .put(`/api/notifications/${notificationId}/read`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Notification marked as read');
    });

    it('should mark all notifications as read', async () => {
        const res = await request(app)
            .put('/api/notifications/read-all')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'All notifications marked as read');
    });

    it('should delete notification', async () => {
        const res = await request(app)
            .delete(`/api/notifications/${notificationId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Notification deleted successfully');
    });

    it('should delete all notifications', async () => {
        const res = await request(app)
            .delete('/api/notifications')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'All notifications deleted successfully');
    });

    it('should get unread notification count', async () => {
        const res = await request(app)
            .get('/api/notifications/unread-count')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('count');
        expect(typeof res.body.count).toBe('number');
    });

    it('should get notification settings', async () => {
        const res = await request(app)
            .get('/api/notifications/settings')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('settings');
    });

    it('should update notification settings', async () => {
        const res = await request(app)
            .put('/api/notifications/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                email: true,
                push: true,
                inApp: true,
                types: {
                    friendRequests: true,
                    messages: true,
                    mentions: true,
                    serverInvites: true
                }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Notification settings updated successfully');
    });
}); 