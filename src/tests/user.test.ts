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

describe('UserController API Tests', () => {
    let authToken = '';
    let userId = '';

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

    it('should get user profile', async () => {
        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
        userId = res.body.user.id;
    });

    it('should update user profile', async () => {
        const res = await request(app)
            .put('/api/users/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                firstName: 'Updated',
                lastName: 'User',
                phone: '1234567890'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Profile updated successfully');
    });

    it('should get user by ID', async () => {
        const res = await request(app)
            .get(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
    });

    it('should search users', async () => {
        const res = await request(app)
            .get('/api/users/search')
            .query({ query: 'test' })
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should get user settings', async () => {
        const res = await request(app)
            .get('/api/users/settings')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('settings');
    });

    it('should update user settings', async () => {
        const res = await request(app)
            .put('/api/users/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                notifications: {
                    email: true,
                    push: false
                },
                privacy: {
                    profileVisibility: 'public'
                }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Settings updated successfully');
    });
}); 