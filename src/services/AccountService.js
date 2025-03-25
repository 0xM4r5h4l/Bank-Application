const { randomInt } = require('crypto');
const Account = require('../models/Account');
const logger  = require('../utils/logger');

const MAX_RETRIES = 5;
const PREFIXES = ['913', '712', '511', '310', '109'];
const { ACCOUNT_NUMBER_LENGTH } = process.env;

class AccountService {
    static async createAccount(data) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            data = {
                accountNumber: await this.#generateAccountNumber(),
                ...data
            }

            try {
                return await Account.create({ ...data });
            } catch(error) {
                logger.error({ message: 'ACCOUNT_NUMBER_DUPLICATE', number: data.accountNumber, attempt });
            }
        }
        logger.error({
            message: 'ACCOUNT_GENERATION_FAILED',
            details: `Account generation failed after ${MAX_RETRIES} attempts. UNABLE TO GENERATE UNIQUE ACCOUNT NUMBER`,
            MAX_RETRIES
        });
        throw new Error(`Account generation failed after max_attempts`);
    }

    static async updateUserAccount(data) {
        if (!data.accountNumber) throw new Error('Account number is required');
        return await Account.findOneAndUpdate({ accountNumber: data.accountNumber }, {...data}, { new: true });
    }

    static async #generateAccountNumber() {
        const prefix = PREFIXES[randomInt(0, PREFIXES.length)];
        let num = '';
        for (let i = 0; num.length < ACCOUNT_NUMBER_LENGTH - prefix.length; i++) {
            num += randomInt(0, 10);
        }

        return prefix + num;
    }
}

module.exports = AccountService;