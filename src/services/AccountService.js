const { randomInt } = require('crypto');
const Account = require('../models/Account');
const logger  = require('../utils/logger');
const securityLogger  = require('../utils/securityLogger');
const { ACCOUNT_NUMBER_LENGTH, ACCOUNT_NUMBER_PREFIXES } = require('../validations/rules/database/accountRules');
const MAX_RETRIES = 5;

class AccountService {
    static async createAccount(data) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            data = {
                accountNumber: await this.#generateAccountNumber(),
                ...data
            }
            try {
                const account = await Account.create({ ...data });
                if (!account) throw new Error('Account creation failed');
                securityLogger.info({ message: 'ACCOUNT_CREATED', accountNumber: account.accountNumber, userId: data.accountHolderId, createdBy: data.createdBy });
                return account;
            } catch(error) {
                logger.error({ message: 'ACCOUNT_NUMBER_DUPLICATE', number: data.accountNumber, attempt, error: error.message });
            }
        }
        logger.error({
            message: 'ACCOUNT_GENERATION_FAILED',
            details: `Account generation failed after max_attempts. UNABLE TO GENERATE UNIQUE ACCOUNT NUMBER`,
            MAX_RETRIES
        });
        throw new Error('Account generation failed after reaching max_attempts');
    }

    static async updateUserAccount(data) {
        if (!data.accountNumber) throw new Error('Account number is required');
        const account = await Account.findOneAndUpdate({ accountNumber: data.accountNumber }, {...data}, { new: true });
        if (!account) throw new Error('Account not found, couldn\'t update account');
        securityLogger.info({ message: 'ACCOUNT_UPDATED', accountNumber: account.accountNumber, userId: data.accountHolderId, updatedBy: data.updatedBy });
        return account;
    }

    static async #generateAccountNumber() {
        const prefix = ACCOUNT_NUMBER_PREFIXES[randomInt(0, ACCOUNT_NUMBER_PREFIXES.length)];
        let num = '';
        while (num.length < ACCOUNT_NUMBER_LENGTH - prefix.length) {
            num += randomInt(0, 10);
        }
        return prefix + num;
    }
}

module.exports = AccountService;