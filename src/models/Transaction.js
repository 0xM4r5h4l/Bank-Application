const mongoose = require('mongoose');

const { db: config } = require('../config');

const transactionSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        ref: 'Account',
        required: [true, 'Account number is required']
    },
    transactionType: {
        type: String,
        enum: {
            values: config.transaction.TRANSACTION_TYPES,
            message: '{VALUE} is not a valid transaction type'
        },
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: 0 // Ensure the amount is non-negative
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        required: false,
        maxlength: 20
    },
    systemReason: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: {
            values: config.transaction.TRANSACTION_STATUSES,
            message: '{VALUE} is not a valid transaction status'
        },
        default: 'pending'
    },
    toAccount: {
        type: String,
        required: function () {
            return this.transactionType === 'transfer';
        }
    }
}, {
    timestamps: true
});

// Add method to validate transaction amount
transactionSchema.methods.validateAmount = async function () {
    if (this.amount <= 0) {
        throw new Error('Transaction amount must be greater than zero.');
    }
};

// Add static method to find transactions by account number
transactionSchema.statics.findByAccountNumber = async function (accountNumber) {
    return await this.find({
        accountNumber
    });
};


module.exports = mongoose.model('Transaction', transactionSchema);