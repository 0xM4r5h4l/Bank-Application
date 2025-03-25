const { 
    getUserAccounts,
    getAccountBalance, 
    getTransactionsHistory,
    createTransfer,
    userRegister,
    userLogin
} = require('../../userController');

const {
    userRegisterSchema,
    userLoginSchema,
    getAccountBalanceSchema,
    createTransferSchema
} = require('../../../validations/userValidations');

const User = require('../../../models/User');
const { StatusCodes } = require('http-status-codes');

describe('userRegister', () => {
    let req, res;
    
    beforeEach(() => {
        userRegisterSchema.validate = jest.fn().mockReturnValue({ error: null });
        res = { 
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks(); 
        jest.restoreAllMocks();
    });

    it('should create user and return fullName, token (only)', async () => {
        req = {
            body: {
                firstName: 'john',
                lastName: 'smith',
                email: 'jsmith@bank.com',
                password: 'P@ssw0rd1234',
                nationalId: '12312312312300',
                gender: 'male',
                address: '1 nozha st, giza',
                phoneNumber: '+201199005678',
                dateOfBirth: '1-1-1990'
        }};
        
        User.create = jest.fn().mockReturnValue({
            req,
            createUserJWT: jest.fn().mockReturnValue('fake-jwt-token'),
            toObject: jest.fn().mockReturnValue(req)
        });
        
        await userRegister(req, res);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
        expect(res.json).toHaveBeenCalledWith({ firstName: req.body.fullName, token: 'fake-jwt-token' });
    });

    it('should throw BadRequestError for invalid input', async () => {
        userRegisterSchema.validate = jest.fn().mockReturnValue({
            error: { details: [{ message: 'Invalid email format' }] }
        });

        await expect(userRegister(req, res)).rejects.toThrow('Invalid email format');
    })

    it('should throw BadRequestError if User.create returns null', async () => {
        User.create = jest.fn().mockReturnValue(null);
        await expect(() => userRegister(req, res)).rejects.toThrow('Couldn\'t register user');
    });

})