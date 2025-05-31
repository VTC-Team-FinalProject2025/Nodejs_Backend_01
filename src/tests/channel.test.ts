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

describe('ChannelController API Tests', () => {
    let authToken = '';
    let channelId = '';
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
                description: 'A test server for channel testing'
            });
        serverId = serverRes.body.server.id;
    });

    it('should create a new channel', async () => {
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
        channelId = res.body.channel.id;
    });

    it('should get channel by ID', async () => {
        const res = await request(app)
            .get(`/api/channels/${channelId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('channel');
    });

    it('should update channel', async () => {
        const res = await request(app)
            .put(`/api/channels/${channelId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'updated-channel',
                description: 'Updated channel description'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Channel updated successfully');
    });

    it('should get channel messages', async () => {
        const res = await request(app)
            .get(`/api/channels/${channelId}/messages`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should send message to channel', async () => {
        const res = await request(app)
            .post(`/api/channels/${channelId}/messages`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                content: 'Test message',
                type: 'text'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message');
    });

    it('should get channel members', async () => {
        const res = await request(app)
            .get(`/api/channels/${channelId}/members`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('should add member to channel', async () => {
        const res = await request(app)
            .post(`/api/channels/${channelId}/members`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                userId: 'test-user-id'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Member added to channel successfully');
    });

    it('should remove member from channel', async () => {
        const res = await request(app)
            .delete(`/api/channels/${channelId}/members/test-user-id`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Member removed from channel successfully');
    });

    it('should delete channel', async () => {
        const res = await request(app)
            .delete(`/api/channels/${channelId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Channel deleted successfully');
    });

    // Clean up
    afterAll(async () => {
        await request(app)
            .delete(`/api/servers/${serverId}`)
            .set('Authorization', `Bearer ${authToken}`);
    });
}); 