const Account = require('../models/Account');

const {
    UnauthenticatedError,
    NotFoundError,
    InternalServerError
} = require('../outcomes/errors');
const { ACCOUNT_NUMBER_LENGTH, ACCOUNT_NUMBER_PREFIXES, ACCOUNT_NUMBER_GENERATION_MAX_RETRIES } = require('../validations/rules/database/accountRules');
const { randomInt } = require('crypto');

class AccountNumberGenerator {
    static async generate() {
        const prefix = ACCOUNT_NUMBER_PREFIXES[randomInt(0, ACCOUNT_NUMBER_PREFIXES.length)];
        let accountNumber = '';
        while (accountNumber.length < ACCOUNT_NUMBER_LENGTH - prefix.length) {
            accountNumber += randomInt(0, 10);
        }

        return prefix + accountNumber;
    }
}

class AccountService {
    async createAccount(data) {
        if (!data.accountHolderId || !data.createdBy) {
            throw new BadRequestError('Account holder ID and creator information are required.');
        }

        for ( let index = 0; index < ACCOUNT_NUMBER_GENERATION_MAX_RETRIES; index++ ) {
            const accountNumber = await AccountNumberGenerator.generate();
            const accountData = { accountNumber, ...data };
            
            const existingAccount = await Account.findOne({ accountNumber });
            if (existingAccount) {
                if (index === ACCOUNT_NUMBER_GENERATION_MAX_RETRIES - 1) {
                    throw new InternalServerError('Account number generation failed after reaching max attempts');
                }

                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
                continue;
            }

            const account = await Account.create(accountData);
            if (!account) throw new InternalServerError('Account creation failed.');
            
            return account;
        }
    }

    async updateUserAccount(data) {
        if (!data.accountNumber) throw new BadRequestError('Account number is required');
        
        const account = await Account.findOneAndUpdate(
            { accountNumber: data.accountNumber }, 
            {...data}, 
            { new: true }
        );

        if (!account) throw new NotFoundError('Account not found, couldn\'t update account');

        return account;
    }

    async getUserAccounts(userId) {
        if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');
        
        const accounts = await Account.find({ accountHolderId: userId }).lean();
        if (!accounts || accounts.length === 0) throw new NotFoundError('No accounts found for this user');
        
        const userAccounts = accounts.map(account => ({
            accountNumber: account.accountNumber,
            accountHolderId: account.accountHolderId,
            accountType: account.accountType,
            balance: account.balance,
            status: account.status
        }));
        
        if (!userAccounts) throw new InternalServerError('Error while fetching user accounts');
        return userAccounts;
    }

    async getAccountBalance(accountNumber, userId) {
        if (!accountNumber || !userId) throw new BadRequestError('Account number and user ID are required');
        const account = await Account.findOne({ accountNumber, accountHolderId: userId })
            .select('balance')
            .lean();

        if (!account) throw new NotFoundError('Account not found');

        return account.balance;
    }
    
}
module.exports = AccountService;