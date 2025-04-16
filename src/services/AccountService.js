const Account = require('../models/Account');
const logger  = require('../utils/logManager');
const accountOperationsLogger = logger.get('account-operations');
const auditLogger  = logger.get('audit');

const { randomInt } = require('crypto');
const { ACCOUNT_NUMBER_LENGTH, ACCOUNT_NUMBER_PREFIXES } = require('../validations/rules/database/accountRules');
const MAX_RETRIES = 5;

class AccountNumberGenerator {
    static async generate() {
        const prefix = ACCOUNT_NUMBER_PREFIXES[randomInt(0, ACCOUNT_NUMBER_PREFIXES.length)];
        let num = '';
        while (num.length < ACCOUNT_NUMBER_LENGTH - prefix.length) {
            num += randomInt(0, 10);
        }
        return prefix + num;
    }
}

class AccountService {
    async createAccount(data) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            data = {
                accountNumber: await AccountNumberGenerator.generate(),
                ...data
            }
            try {
                const account = await Account.create({ ...data });
                if (!account) throw new Error('Account creation failed');
                auditLogger.info({ message: 'ACCOUNT_CREATED', accountNumber: account.accountNumber, userId: data.accountHolderId, createdBy: data.createdBy });
                return account;
            } catch(error) {
                accountOperationsLogger.error({ message: 'ACCOUNT_NUMBER_DUPLICATE', number: data.accountNumber, attempt, error: error.message });
            }
        }
        accountOperationsLogger.error({
            message: 'ACCOUNT_GENERATION_FAILED',
            details: `Account generation failed after max_attempts. UNABLE TO GENERATE UNIQUE ACCOUNT NUMBER`,
            MAX_RETRIES
        });
        throw new Error('Account generation failed after reaching max_attempts');
    }

    async updateUserAccount(data) {
        if (!data.accountNumber) throw new Error('Account number is required');
        const account = await Account.findOneAndUpdate({ accountNumber: data.accountNumber }, {...data}, { new: true });
        if (!account) throw new Error('Account not found, couldn\'t update account');
        auditLogger.info({ message: 'ACCOUNT_UPDATED', accountNumber: account.accountNumber, userId: data.accountHolderId, updatedBy: data.updatedBy });
        return account;
    }

}

module.exports = AccountService;