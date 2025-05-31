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

describe('RoleController API Tests', () => {
    let authToken = '';
    let roleId = '';
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

        // Create a server for testing
        const serverRes = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test Server',
                description: 'A test server for role testing'
            });
        serverId = serverRes.body.server.id;
    });

    it('should create a new role', async () => {
        const res = await request(app)
            .post(`/api/servers/${serverId}/roles`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test Role',
                color: '#FF0000',
                permissions: ['read_messages', 'send_messages'],
                position: 1
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('role');
        roleId = res.body.role.id;
    });

    it('should get role by ID', async () => {
        const res = await request(app)
            .get(`/api/roles/${roleId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('role');
    });

    it('should update role', async () => {
        const res = await request(app)
            .put(`/api/roles/${roleId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Updated Role',
                color: '#00FF00',
                permissions: ['read_messages', 'send_messages', 'manage_messages']
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Role updated successfully');
    });

    it('should get server roles', async () => {
        const res = await request(app)
            .get(`/api/servers/${serverId}/roles`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.roles)).toBe(true);
    });

    it('should assign role to member', async () => {
        const res = await request(app)
            .post(`/api/roles/${roleId}/members`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                userId: 'test-user-id'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Role assigned successfully');
    });

    it('should remove role from member', async () => {
        const res = await request(app)
            .delete(`/api/roles/${roleId}/members/test-user-id`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Role removed successfully');
    });

    it('should get role members', async () => {
        const res = await request(app)
            .get(`/api/roles/${roleId}/members`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('should update role position', async () => {
        const res = await request(app)
            .put(`/api/roles/${roleId}/position`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                position: 2
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Role position updated successfully');
    });

    it('should delete role', async () => {
        const res = await request(app)
            .delete(`/api/roles/${roleId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Role deleted successfully');
    });

    // Clean up
    afterAll(async () => {
        await request(app)
            .delete(`/api/servers/${serverId}`)
            .set('Authorization', `Bearer ${authToken}`);
    });
}); 