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

describe('FriendController API Tests', () => {
    let authToken = '';
    let friendId = '';

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

    it('should send friend request', async () => {
        const res = await request(app)
            .post('/api/friends/request')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                userId: 'target-user-id'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Friend request sent successfully');
    });

    it('should get friend requests', async () => {
        const res = await request(app)
            .get('/api/friends/requests')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.requests)).toBe(true);
    });

    it('should accept friend request', async () => {
        const res = await request(app)
            .post('/api/friends/accept')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                requestId: 'friend-request-id'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Friend request accepted');
        friendId = res.body.friendId;
    });

    it('should reject friend request', async () => {
        const res = await request(app)
            .post('/api/friends/reject')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                requestId: 'friend-request-id'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Friend request rejected');
    });

    it('should get friends list', async () => {
        const res = await request(app)
            .get('/api/friends')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.friends)).toBe(true);
    });

    it('should get friend status', async () => {
        const res = await request(app)
            .get(`/api/friends/status/${friendId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status');
    });

    it('should block friend', async () => {
        const res = await request(app)
            .post(`/api/friends/${friendId}/block`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'User blocked successfully');
    });

    it('should unblock friend', async () => {
        const res = await request(app)
            .post(`/api/friends/${friendId}/unblock`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'User unblocked successfully');
    });

    it('should remove friend', async () => {
        const res = await request(app)
            .delete(`/api/friends/${friendId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Friend removed successfully');
    });

    it('should get blocked users', async () => {
        const res = await request(app)
            .get('/api/friends/blocked')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.blockedUsers)).toBe(true);
    });
}); 