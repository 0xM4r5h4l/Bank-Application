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
} = require('../../../validations/user/userValidations');

const User = require('../../../models/User');
const { StatusCodes } = require('http-status-codes');

describe('userRegister', () => {
    let req, res;
    
    beforeEach(() => {
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
                dateOfBirth: '1-1-1990',
                toObject: function() { return {...this} },
                createUserJWT: function() { return { token: 'fake-jwt-token' } },
                createVerificationToken: function() { return { token: 'fake-verification-token' } },
            }
        };
        res = { 
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        userRegisterSchema.validate = jest.fn().mockReturnValue({ error: null });

        User.create = jest.fn().mockReturnValue(req.body);
        User.checkDuplicates = jest.fn().mockReturnThis({error: null, duplicate: null});
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should create user and return HTTP status 201 (CREATED)', async () => {

        await userRegister(req, res);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    });

    it('should throw BadRequestError for invalid input', async () => {
        userRegisterSchema.validate = jest.fn().mockReturnValue({
            error: { details: [{ message: 'Invalid email format' }] }
        });

        await expect(userRegister(req, res)).rejects.toThrow('Invalid email format');
    })

    it('should throw if User.create returns null', async () => {
        User.create = jest.fn().mockReturnValue(null);
        await expect(() => userRegister(req, res)).rejects.toThrow('Couldn\'t register user');
    });

})