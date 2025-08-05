// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
    it('should login successfully', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
