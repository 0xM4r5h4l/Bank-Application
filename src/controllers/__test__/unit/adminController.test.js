const {
    BadRequestError
} = require('../../../outcomes/errors');

const Account = require('../../../models/Account');
const User = require('../../../models/User');
const EmailService = require('../../../services/EmailService');
const {
    createAdminAccount,
    updateUserData,
    updateUserAccount,
    adminLogin,
    createUserAccount,
} = require('../../adminController');

describe('updateUserData', () => {
    let req, res, next;
    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        
        jest.clearAllMocks();
    })

    describe('Validation', () => {
        it('should throw BadRequestError if validation fails', async () => {
            req = {
                user: { userId: '67d7ccea1f1d9f906fe18d84', role: 'admin' },
                body: { accountNumber: '5117762328105413', invalidField: 'Test' }
            }
            await expect(updateUserData(req, res)).rejects.toThrow(BadRequestError);
        })

        it('should throw BadRequestError when only accountNumber is provided', async () => {
            req = {
                user: { userId: '67d7ccea1f1d9f906fe18d84', role: 'admin' },
                body: { accountNumber: '5117762328105413' }
            }
            await expect(updateUserData(req, res)).rejects.toThrow(/must contain at least one of /);
        })

        it('should validate successfully with at least one update field', async () => {
            req = {
                user: { userId: '67d7ccea1f1d9f906fe18d84', role: 'admin' },
                body: { accountNumber: '5117762328105413', firstName: 'Joe' }
            }
            save = jest.fn().mockResolvedValue({});
            Account.findOne = jest.fn().mockResolvedValue({ save });
            User.findOneAndUpdate = jest.fn().mockResolvedValue({ email: 'test@bank.com', save });

            await expect(updateUserData(req, res)).resolves.not.toThrow();
        })

        it('should handle minimum valid payload', async () => {
            req = {
                user: { userId: '67d7ccea1f1d9f906fe18d84', role: 'admin' },
                body: { accountNumber: '5117762328105413', tempPasswordRequest: true }
            }
            EmailService.sendEmail = jest.fn().mockResolvedValue({});

            save = jest.fn().mockResolvedValue({});
            Account.findOne = jest.fn().mockResolvedValue({ save });
            User.findOneAndUpdate = jest.fn().mockResolvedValue({ email: 'test@bank.com', save });
            await expect(updateUserData(req, res)).resolves.not.toThrow();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(EmailService.sendEmail).toHaveBeenCalled();
            console.log('res.json', res.json.mock.calls);
            expect(res.json.mock.calls[0][0]).toMatchObject({ success: true });
        })
    })
})