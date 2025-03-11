const securityLogger = require('../utils/securityLogger');
const Account = require('../models/Account');
const TransactionHandler = require('./TransferHandler');

class TransactionProcessor {
    constructor(transferHandler = new TransactionHandler) {
        this.transferHandler = transferHandler;
    }

    async processTransaction(transaction) {
        try {
            // Logs the transaction processing
            this.#logTransactionProcessing(transaction);

            // Validate the transaction
            const { clientMessage, systemMessage, status } = await this.#validateTransaction(transaction);
            if ( status === true ) {
                await this.transferHandler.handleTransfer(transaction);

                // Log the transaction success
                this.#logTransactionSuccess(transaction);
                return { clientMessage: clientMessage, systemMessage: systemMessage, status: 'completed' };
            } else {
                this.#logTransactionFailed(systemMessage, transaction);
                return { clientMessage: clientMessage, systemMessage: systemMessage, status: 'failed' };
            }

        } catch (error) {
            // Log the transaction failure
            this.#logTransactionFailed(error.message || 'Error while processing transaction', transaction);
            error.message = error.message || 'System error while processing transaction';
            throw error;
        }
    }

    async #validateTransaction(transaction) {
        try{
            // Validation logic
            if (!transaction || typeof transaction.accountNumber !== 'string' || typeof transaction.amount !== 'number' || transaction.amount <= 0 || transaction.description?.length > 20) {
                return { clientMessage: 'Invalid transaction data, transaction rejected', systemMessage: 'Invalid transaction data', status: false };
            }

            const sourceAccountBalance = await Account.checkAccountBalance(transaction.accountNumber);
            if (sourceAccountBalance === null) {
                return { clientMessage: 'Invalid transaction data, transaction rejected', systemMessage: 'Invalid transaction data(accountNumber)', status: false };
            }

            if(transaction.transactionType === 'transfer'){
                if (sourceAccountBalance < transaction.amount) {
                    return { clientMessage: 'Insufficient balance, transaction rejected', systemMessage: 'Insufficient balance', status: false };
                }

                const destinationAccountBalance = await Account.checkAccountBalance(transaction.toAccount);
                // Checks if the destination account balance is not null 
                // and the destination account can receive the amount
                if(destinationAccountBalance === null) {
                    return { clientMessage: 'Invalid transaction data, transaction rejected', systemMessage: 'Invalid transaction data(toAccount)', status: false };
                } else if ((destinationAccountBalance + transaction.amount) > process.env.MAXIMUM_ACCOUNT_BALANCE) {
                    return { clientMessage: 'Transaction not allowed', systemMessage: 'Destination account balance can\'t exceed the maximum allowed balance', status: false };
                }
            }

            if(transaction.transactionType ===  'withdrawal'){
                if (sourceAccountBalance < transaction.amount) {
                    return { clientMessage: 'Insufficient balance, transaction rejected', systemMessage: 'Insufficient balance', status: false };
                }
            }

            if(transaction.transactionType ===  'deposit'){
                if ((sourceAccountBalance + transaction.amount) > process.env.MAXIMUM_ACCOUNT_BALANCE) {
                    return { clientMessage: 'Your account balance has reached the maximum limit, transaction rejected', systemMessage: 'Account balance can\'t exceed the maximum allowed balance', status: false };
                }
            }

            return { clientMessage: 'Transaction successful', systemMessage: 'Transaction Success', status: true };
        } catch (error) {
            console.log('ERROR (82): ', error);
            return { clientMessage: 'Something went wrong while processing your transaction', systemMessage: `Error: ${error.message || 'Unknown error'}`, status: false };
        }
    }

    #logTransactionProcessing(transaction) {
        // Dont forget to put rest of the data to log
        securityLogger.info({
            message: `PROCESSING_TRANSACTION`,
            transactionId: transaction._id,
            transactionType: transaction.transactionType,
            source: transaction.accountNumber,
            destination: transaction.toAccount || null,
            amount: transaction.amount,
            date: transaction.transactionDate,
            category: 'transactions'
        });
    }

    #logTransactionSuccess(transaction) {
        // Dont forget to put rest of the data to log
        securityLogger.info({
            message: `SUCCESSFUL_TRANSACTION`,
            transactionId: transaction._id,
            transactionType: transaction.transactionType,
            source: transaction.accountNumber,
            destination: transaction.toAccount || 'Unknown',
            amount: transaction.amount,
            date: transaction.transactionDate,
            category: 'transactions'
        });
    }

    #logTransactionFailed(reason, transaction) {
        // Dont forget to put rest of the data to log
        securityLogger.info({
            message: `FAILED_TRANSACTION`,
            reason: reason || 'Unknown',
            transactionId: transaction._id,
            transactionType: transaction.transactionType,
            source: transaction.accountNumber,
            destination: transaction.toAccount || 'Unknown',
            amount: transaction.amount,
            date: transaction.transactionDate,
            category: 'transactions'
        });
    }
}

module.exports = TransactionProcessor;