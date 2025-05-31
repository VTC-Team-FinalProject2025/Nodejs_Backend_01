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

describe('MessageController API Tests', () => {
    let authToken = '';
    let messageId = '';
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

        // Create a server and channel for testing
        const serverRes = await request(app)
            .post('/api/servers')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test Server',
                description: 'A test server for message testing'
            });
        serverId = serverRes.body.server.id;

        const channelRes = await request(app)
            .post(`/api/servers/${serverId}/channels`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'test-channel',
                type: 'text',
                description: 'A test channel'
            });
        channelId = channelRes.body.channel.id;
    });

    it('should send a message', async () => {
        const res = await request(app)
            .post(`/api/channels/${channelId}/messages`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                content: 'Test message',
                type: 'text'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message');
        messageId = res.body.message.id;
    });

    it('should get message by ID', async () => {
        const res = await request(app)
            .get(`/api/messages/${messageId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('should update message', async () => {
        const res = await request(app)
            .put(`/api/messages/${messageId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                content: 'Updated test message'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('should delete message', async () => {
        const res = await request(app)
            .delete(`/api/messages/${messageId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Message deleted successfully');
    });

    it('should get channel messages', async () => {
        const res = await request(app)
            .get(`/api/channels/${channelId}/messages`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should send message with attachments', async () => {
        const res = await request(app)
            .post(`/api/channels/${channelId}/messages`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                content: 'Message with attachment',
                type: 'text',
                attachments: [
                    {
                        type: 'image',
                        url: 'https://example.com/image.jpg'
                    }
                ]
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toHaveProperty('attachments');
    });

    it('should react to message', async () => {
        const res = await request(app)
            .post(`/api/messages/${messageId}/reactions`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                emoji: '👍'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Reaction added successfully');
    });

    it('should remove reaction from message', async () => {
        const res = await request(app)
            .delete(`/api/messages/${messageId}/reactions/👍`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Reaction removed successfully');
    });

    it('should get message reactions', async () => {
        const res = await request(app)
            .get(`/api/messages/${messageId}/reactions`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.reactions)).toBe(true);
    });

    // Clean up
    afterAll(async () => {
        await request(app)
            .delete(`/api/servers/${serverId}`)
            .set('Authorization', `Bearer ${authToken}`);
    });
}); 