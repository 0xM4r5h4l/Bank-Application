require('dotenv').config();
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');

describe('userRegister', () => {
    let input;
    beforeAll(async () => {
        input = {
            firstName: 'John',
            lastName: 'The tester',
            email: 'tester@bank-users.com',
            password: 'test123456789##',
            repeat_password: 'test123456789##',
            nationalId: '00000000000000',
            gender: 'male',
            address: '0 el nozha st, el agoza, giza',
            phoneNumber: '+201155000001',
            dateOfBirth: '2000-01-01'
        }

        await mongoose.connect(process.env.MONGO_URI)
    })

    afterAll(async () => {
        await User.findOneAndDelete({ email: input.email });
        await mongoose.disconnect();
    })
    
    it('should return status code 200 & res.body.message \'User registered successfully.\'', async () => {
        const res = await request(app).post('/api/v1/user/register').send(input)
        expect(res.status).toBe(201);
        expect(res.body.message).toMatch('User registered successfully.');
        expect(res.body.results.firstName).toMatch(input.firstName);
    })

    it('should reject missing field with 400 & res.body.message to have "phoneNumber" is required ', async () => {
        const inputCopy = { ...input };
        delete inputCopy.phoneNumber;
        const res = await request(app).post('/api/v1/user/register').send(inputCopy);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch("\"phoneNumber\" is required");
    })

    it('should reject empty JSON with 400 & res.body.message to have \'is required\'', async () => {
        const res = await request(app).post('/api/v1/user/register').send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/is required/);
    })
})


describe('userLogin', () => {
    let input;
    beforeAll(async () => {
        input = {
            firstName: 'John',
            lastName: 'The tester',
            email: 'tester@bank-users.com',
            password: 'test123456789##',
            repeat_password: 'test123456789##',
            nationalId: '00000000000000',
            gender: 'male',
            address: '0 el nozha st, el agoza, giza',
            phoneNumber: '+201155000001',
            dateOfBirth: '2000-01-01',
            'security.status': 'active'
        }
        await mongoose.connect(process.env.MONGO_URI);
        await User.create(input);
    });

    afterAll(async () => {
        await User.findOneAndDelete({ email: input.email });
        await mongoose.disconnect();
    });

    it('should return status_code: 200 & message: User logged in successfully.', async () => {
        const res = await request(app).post('/api/v1/user/login').send({ email: input.email, password: input.password});
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/User logged in successfully/);
    });

    it.each(['email', 'password'])('should reject missing %s', async (field) => {
        const inputCopy = { ...input };
        delete inputCopy[field];
        const res = await request(app).post('/api/v1/user/login').send(inputCopy);
        expect(res.status).toBe(400);
        const message = `"${field}" is required`;
        expect(res.body.message).toMatch(message)
    })

    it('should reject empty JSON with 400 & message: ', async () => {
        const res = await request(app).post('/api/v1/user/login').send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/is required/);
    })
})