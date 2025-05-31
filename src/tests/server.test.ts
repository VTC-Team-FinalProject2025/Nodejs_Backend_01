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

describe('ServerController API Tests', () => {
    let authToken = '';
    let serverId = '';

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

    it('should create a new server', async () => {
        const res = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test Server',
                description: 'A test server for testing',
                icon: 'https://example.com/icon.png'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('server');
        serverId = res.body.server.id;
    });

    it('should get server by ID', async () => {
        const res = await request(app)
            .get(`/api/servers/${serverId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('server');
    });

    it('should update server', async () => {
        const res = await request(app)
            .put(`/api/servers/${serverId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Updated Server Name',
                description: 'Updated description'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Server updated successfully');
    });

    it('should get server members', async () => {
        const res = await request(app)
            .get(`/api/servers/${serverId}/members`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('should add member to server', async () => {
        const res = await request(app)
            .post(`/api/servers/${serverId}/members`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                userId: 'test-user-id',
                role: 'member'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Member added successfully');
    });

    it('should remove member from server', async () => {
        const res = await request(app)
            .delete(`/api/servers/${serverId}/members/test-user-id`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Member removed successfully');
    });

    it('should get server channels', async () => {
        const res = await request(app)
            .get(`/api/servers/${serverId}/channels`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.channels)).toBe(true);
    });

    it('should create server channel', async () => {
        const res = await request(app)
            .post(`/api/servers/${serverId}/channels`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'test-channel',
                type: 'text',
                description: 'A test channel'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('channel');
    });

    it('should delete server', async () => {
        const res = await request(app)
            .delete(`/api/servers/${serverId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Server deleted successfully');
    });
}); 