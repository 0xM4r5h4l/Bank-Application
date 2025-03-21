const { 
    getUserAccounts,
    getAccountBalance, 
    getTransactionsHistory,
    createTransfer,
    userRegister,
    userLogin
} = require('../../userController');

const User = require('../../../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../../../outcomes/errors');

describe('userRegister', () => {
    let req, res;
    
    beforeEach(() => {
        res = { 
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 201 and json with fullName, token', async () => {
        req = {
            body: {
                firstName: 'john',
                lastName: 'smith',
                email: 'jsmith@bank.com',
                password: 'P@ssw0rd',
                nationalId: '12312312312300',
                gender: 'male',
                address: '1 nozha st, giza',
                phoneNumber: '1199005678',
                dateOfBirth: '1-1-1990'
        }};

        User.create = jest.fn().mockReturnValue({
            req,
            createUserJWT: jest.fn().mockReturnValue('fake-jwt-token')
        });

        await userRegister(req, res);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
        expect(res.json).toHaveBeenCalledWith({ fullName: req.body.fullName, token: 'fake-jwt-token' });
    });

    it('should throw BadRequestError if User.create returns null', async () => {
        User.create = jest.fn().mockReturnValue(null);
        await expect(userRegister(req, res)).rejects.toThrow();
    });
})