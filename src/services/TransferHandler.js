const Account = require('../models/Account');

class TransactionHandler {
    async handleTransfer(transaction) {
        // Transfer logic
        try {

            if( transaction.transactionType === 'transfer' ) {
                const sourceAccountWithdrawal = await Account.accountWithdraw(transaction.accountNumber, transaction.amount);
                if (!sourceAccountWithdrawal) {
                    throw new Error('Error withdrawing from source account');
                }
                const destinationAccountDeposit = await Account.accountDeposit(transaction.toAccount, transaction.amount);
                if (!destinationAccountDeposit) {
                    throw new Error('Error depositing to destination account');
                }
                if (sourceAccountWithdrawal && !destinationAccountDeposit) {
                    sourceAccountDeposit = await Account.accountDeposit(transaction.accountNumber, transaction.amount);
                    if (!sourceAccountDeposit) {
                        throw new Error('Transfer failed but couldn\'t deposit back to source account');
                    }
                }
                if (sourceAccountWithdrawal && destinationAccountDeposit) {
                    return true;
                }
            }
            if( transaction.transactionType === 'withdrawal' ) {
                const sourceAccountWithdrawal = await Account.accountWithdraw(transaction.accountNumber, transaction.amount);
                if (!sourceAccountWithdrawal) {
                    throw new Error('Error withdrawing from source account');
                }
            }
            if( transaction.transactionType === 'deposit' ) {
                const sourceAccountWithdrawal = await Account.accountDeposit(transaction.accountNumber, transaction.amount);
                if (!sourceAccountWithdrawal) {
                    throw new Error('Error withdrawing from source account');
                }
            }

        } catch (error) {
            throw new Error('Error handling transfer: ' + error.message);
        }
    }
}

module.exports = TransactionHandler;