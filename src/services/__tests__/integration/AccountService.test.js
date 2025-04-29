require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../../models/User');
const Account = require('../../../models/Account');
const AccountService = require('../../AccountService');
const { ACCOUNT_NUMBER_LENGTH } = require('../../../validations/rules/database/accountRules');

describe('AccountService', () => {
    describe('createAccount', () => {
        let userData
        beforeAll(async () => {
            await mongoose.connect(process.env.MONGO_URI);
            userData = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@test.com',
                password: 'P@ssw0rd1234',
                nationalId: '00000000000000',
                gender: 'male',
                address: '1 nozha st, giza',
                phoneNumber: '+201112131415',
                dateOfBirth: '1-1-2000'
            });
        });

        afterAll(async () => {
            await User.findOneAndDelete({ email: 'jdoe@test.com' });
            await Account.findOneAndDelete({ balance: 1 });
            await mongoose.disconnect();
        })

        it('should create user for testing', async () => {
            expect(userData).toMatchObject({ email: 'jdoe@test.com' });
        })
        
        it('should create account with unique account number', async () => {
            const account = new AccountService();
            const accountData = await account.createAccount({
                accountType: 'Savings',
                balance: 1,
                accountHolderId: userData._id,
                createdBy: '67d7ccea1f1d9f906fe18d84'
            });
            expect(accountData.accountNumber.length).toBe(ACCOUNT_NUMBER_LENGTH);
        });
    })
})