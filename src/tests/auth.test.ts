import request from 'supertest';
import app from '../index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Server } from 'http';
let server: Server;


beforeAll(() => {
    server = app.listen(); 
});

afterAll(() => {
    server.close(); // Đóng server sau khi test xong
});

describe('AuthController API Tests', () => {
    let authToken = '';
    
    it('should sign up a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                firstName: 'Test',
                lastName: 'user',
                loginName: 'test123',
                phone: '123123312312',
                email: 'tranlevu1962004@gmail.com',
                password: 'Test@1234',
                password_confirmation: "Test@1234"
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully!');
    });
    
    it('should log in an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                input: 'levu1962004@gmail.com',
                password: 'Vanbi081072@'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        authToken = res.body.token;
    });
    
    it('should verify user email', async () => {
        const res = await request(app)
            .get('/api/auth/verify-email')
            .query({ token: 'valid-email-verification-token' });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Email verified successfully!');
    });
    
    it('should log out the user', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Logged out successfully!');
    });
    
    it('should request password reset', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'testuser@example.com' });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Password reset email sent!');
    });
    
    it('should reset password', async () => {
        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token: 'valid-reset-token',
                newPassword: 'NewPass@1234'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Password reset successfully!');
    });
    
    it('should authenticate via Google OAuth', async () => {
        const res = await request(app)
            .get('/api/auth/google/callback')
            .query({ code: 'valid-google-auth-code' });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
    
    it('should authenticate via GitHub OAuth', async () => {
        const res = await request(app)
            .get('/api/auth/github/callback')
            .query({ code: 'valid-github-auth-code' });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});