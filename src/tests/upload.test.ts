import request from 'supertest';
import app from '../index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Server } from 'http';
import path from 'path';
import fs from 'fs';
let server: Server;

beforeAll(() => {
    server = app.listen();
});

afterAll(() => {
    server.close();
});

describe('UploadController API Tests', () => {
    let authToken = '';
    let uploadedFileId = '';

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

    it('should upload a file', async () => {
        // Create a temporary test file
        const testFilePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(testFilePath, 'Test file content');

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', testFilePath);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('file');
        uploadedFileId = res.body.file.id;

        // Clean up test file
        fs.unlinkSync(testFilePath);
    });

    it('should upload an image', async () => {
        // Create a temporary test image
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        fs.writeFileSync(testImagePath, 'Test image content');

        const res = await request(app)
            .post('/api/upload/image')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('image', testImagePath);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('imageUrl');

        // Clean up test image
        fs.unlinkSync(testImagePath);
    });

    it('should upload multiple files', async () => {
        // Create temporary test files
        const testFile1Path = path.join(__dirname, 'test-file1.txt');
        const testFile2Path = path.join(__dirname, 'test-file2.txt');
        fs.writeFileSync(testFile1Path, 'Test file 1 content');
        fs.writeFileSync(testFile2Path, 'Test file 2 content');

        const res = await request(app)
            .post('/api/upload/multiple')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('files', testFile1Path)
            .attach('files', testFile2Path);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.files)).toBe(true);
        expect(res.body.files.length).toBe(2);

        // Clean up test files
        fs.unlinkSync(testFile1Path);
        fs.unlinkSync(testFile2Path);
    });

    it('should get file by ID', async () => {
        const res = await request(app)
            .get(`/api/upload/${uploadedFileId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('file');
    });

    it('should delete file', async () => {
        const res = await request(app)
            .delete(`/api/upload/${uploadedFileId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'File deleted successfully');
    });

    it('should get user uploads', async () => {
        const res = await request(app)
            .get('/api/upload/user')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.files)).toBe(true);
    });

    it('should validate file type', async () => {
        // Create a temporary test file with invalid extension
        const testFilePath = path.join(__dirname, 'test-file.exe');
        fs.writeFileSync(testFilePath, 'Test file content');

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', testFilePath);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid file type');

        // Clean up test file
        fs.unlinkSync(testFilePath);
    });

    it('should validate file size', async () => {
        // Create a temporary test file that's too large
        const testFilePath = path.join(__dirname, 'large-file.txt');
        const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
        fs.writeFileSync(testFilePath, largeContent);

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', testFilePath);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'File too large');

        // Clean up test file
        fs.unlinkSync(testFilePath);
    });
}); 