const { ACCOUNT_BALANCE_RANGE } = require('../validations/rules/database/accountRules');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const transactionRules = require('../validations/rules/database/transactionRules');


class TransactionValidator {
    constructor() {
        this.ACCOUNT_BALANCE_RANGE = ACCOUNT_BALANCE_RANGE;
        this.transactionRules = transactionRules;
        this.transferDescriptionRule = transactionRules.TRANSFER_DESCRIPTION;
    }

    async validateTransfer(transactionData) {
        if (!transactionData || typeof transactionData.accountNumber !== 'string' 
            || typeof transactionData.toAccount !== 'string'
            || typeof transactionData.amount !== 'number' || transactionData.amount <= 0
            || transactionData?.description?.length > this.transactionRules.TRANSFER_DESCRIPTION.max) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }
        
        const sourceAccount = await Account.findOne({ accountNumber: transactionData.accountNumber });
        const destinationAccount = await Account.findOne({ accountNumber: transactionData.toAccount });
        if (!sourceAccount) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }
        if (!destinationAccount) {
            return { error: { unprocessableEntityError: true, message: 'Invalid destination account' } };
        }
        if (sourceAccount.balance < transactionData.amount) {
            return { error: { unprocessableEntityError: true, message: 'Insufficient funds for this transaction.' } };
        }
        if ( destinationAccount.balance + transactionData.amount > this.ACCOUNT_BALANCE_RANGE.max) {
            return { error: { unprocessableEntityError: true, message: 'Destination account balance exceeds the maximum allowed value.' } };
        }
        if (sourceAccount.accountNumber === destinationAccount.accountNumber) {
            return { error: { unprocessableEntityError: true, message: 'Source and destination accounts are the same.' } };
        }
        if (sourceAccount.status !== 'Active' || destinationAccount.status !== 'Active') {
            return { error: { unprocessableEntityError: true, message: 'Source or destination account is not active.' } };
        }
        if (transactionData.amount < transactionRules.TRANSFER_RULES.min || transactionData.amount > transactionRules.TRANSFER_RULES.max) {
            return { error: { unprocessableEntityError: true, message: 'Transfer amount is out of range.' } };
        }
        if (sourceAccount?.dailyStats?.transfer + transactionData.amount > transactionRules.TRANSFER_RULES.dailyLimit) {
            return { error: { unprocessableEntityError: true, message: 'Transfer amount exceeds daily limit for source account.' } };
        }
        if (destinationAccount?.dailyStats?.deposit + transactionData.amount > transactionRules.TRANSFER_RULES.dailyLimit) {
            return { error: { unprocessableEntityError: false, message: 'Destination account will exceed the max deposit limit.' } };
        }
        if (sourceAccount.accountHolderId === destinationAccount.accountHolderId) {
            return { error: { unprocessableEntityError: true, message: 'Source and destination accounts belong to the same user.' } };
        }
        return true;
    }

    async validateDeposit(transactionData) {
        if (!transactionData || typeof transactionData.accountNumber !== 'string' 
            || typeof transactionData.amount !== 'number' || transactionData.amount <= 0
            || transactionData?.description?.length > this.transactionRules.TRANSFER_DESCRIPTION.max) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }

        const account = await Account.findOne({ accountNumber: transactionData.accountNumber });
        if (!account) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }
        if (account.balance + transactionData.amount > this.ACCOUNT_BALANCE_RANGE.max) {
            return { error: { unprocessableEntityError: true, message: 'Account balance exceeds the maximum allowed value.' } };
        }
        if (account.status !== 'Active') {
            return { error: { unprocessableEntityError: true, message: 'Account is not active.' } };
        }
        if (transactionData.amount < transactionRules.DEPOSIT_RULES.min || transactionData.amount > transactionRules.DEPOSIT_RULES.max) {
            return { error: { unprocessableEntityError: true, message: 'Deposit amount is out of range.' } };
        }
        if (account.dailyStats.deposit + transactionData.amount > transactionRules.DEPOSIT_RULES.dailyLimit) {
            return { error: { unprocessableEntityError: true, message: 'Deposit amount exceeds daily limit.' } };
        }

        return true;
    }

    async validateWithdraw(transactionData) {
        if (!transactionData || typeof transactionData.accountNumber !== 'string' 
            || typeof transactionData.amount !== 'number' || transactionData.amount <= 0
            || transactionData?.description?.length > this.transactionRules.TRANSFER_DESCRIPTION.max) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }

        const account = await Account.findOne({ accountNumber: transactionData.accountNumber });
        if (!account) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }
        if (account.balance < transactionData.amount) {
            return { error: { unprocessableEntityError: true, message: 'Insufficient funds for this transaction.' } };
        }
        if (account.status !== 'Active') {
            return { error: { unprocessableEntityError: true, message: 'Account is not active.' } };
        }
        if (transactionData.amount < transactionRules.WITHDRAW_RULES.min || transactionData.amount > transactionRules.WITHDRAW_RULES.max) {
            return { error: { unprocessableEntityError: true, message: 'Withdraw amount is out of range.' } };
        }
        if (account.dailyStats.withdrawal + transactionData.amount > transactionRules.WITHDRAW_RULES.dailyLimit) {
            return { error: { unprocessableEntityError: true, message: 'Withdraw amount exceeds daily limit.' } };
        }

        return true;
    }
}

class TransactionService {
    constructor() {
        this.transactionValidator = new TransactionValidator();
    }

    async recordTransaction(transactionData, transactionStatus, transactionType, systemReason) {
        if (!transactionData || !transactionStatus || !transactionType) {
            return { error: { unprocessableEntityError: false, message: 'transactionData, transactionStatus and transactionType must be provided in TransactionService.recordTransaction .' } };
        }
        
        transactionData.status = transactionStatus;
        transactionData.transactionType = transactionType;
        transactionData.systemReason = systemReason || null;
        transactionData.transactionDate = new Date();
        const transaction = await Transaction.create({ ...transactionData });
        if (!transaction) return { error: { unprocessableEntityError: false, message: 'Transaction creation failed' } };
        
        return { recordSuccess: true };
    }

    async doTransfer(transactionData) {
        const validate = await this.transactionValidator.validateTransfer(transactionData);
        if (!validate) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }
        if (validate.error) {
            return validate;
        }

        const sourceAccount = await Account.findOne({ accountNumber: transactionData.accountNumber });
        const destinationAccount = await Account.findOne({ accountNumber: transactionData.toAccount});
        if (!sourceAccount || !destinationAccount) {
            return  { error: { unprocessableEntityError: false, message: 'Error while finding sourceAccount & destinationAccount' } };
        }

        const { withdrawResult, depositResult } = await Account.accountTransfer(transactionData.accountNumber, transactionData.toAccount, transactionData.amount);
        if (!withdrawResult) {
            return { error: { unprocessableEntityError: false, message: 'Error while withdrawing from source account' } };
        }
        if (!depositResult) {
            return { error: { unprocessableEntityError: false, message: 'Error while depositing to destination account' } };
        }
        console.log('withdraw', withdrawResult);
        console.log('deposit', depositResult);

        return { success: true };
    }

    async doDeposit(transactionData) {
        const validate = await this.transactionValidator.validateDeposit(transactionData);
        if (!validate) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };            
        }
        if (validate.error) {
            return validate;
        }

        const deposit = await Account.accountDeposit(transactionData.accountNumber, transactionData.amount);
        if (!deposit) {
            return { error: { unprocessableEntityError: false, message: 'Error while depositing to destination account' } };
        }

        return { success: true };
    }

    async doWithdraw(transactionData) {
        const validate = await this.transactionValidator.validateWithdraw(transactionData);
        if (!validate) {
            return { error: { unprocessableEntityError: false, message: 'Invalid transaction data, transaction not processed.' } };
        }
        if (validate.error) {
            return validate;
        }

        const withdraw = await Account.accountWithdraw(transactionData.accountNumber, transactionData.amount);
        if (!withdraw) {
            return { error: { unprocessableEntityError: false, message: 'Error while withdrawing from source account' } };
        }

        return { success: true };
    }
}

module.exports = TransactionService;