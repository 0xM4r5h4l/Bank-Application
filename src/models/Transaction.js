const mongoose = require('mongoose');
const transactionRules  = require('../validations/rules/database/transactionRules');

const TransactionSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        ref: 'Account',
        required: [true, 'Account number is required']
    },
    transactionType: {
        type: String,
        enum: {
            values: transactionRules.TRANSACTION_TYPES,
            message: '{VALUE} is not a valid transaction type'
        },
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: transactionRules.TRANSFER_VALUE_RANGE.min,
        max: transactionRules.TRANSFER_VALUE_RANGE.max
    },
    transactionDate: {
        type: Date,
        required: false,
        default: Date.now
    },
    description: {
        type: String,
        required: false,
        maxlength: transactionRules.TRANSFER_DESCRIPTION.max,
        minlength: transactionRules.TRANSFER_DESCRIPTION.min,
        trim: true
    },
    systemReason: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: {
            values: transactionRules.TRANSACTION_STATUSES,
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
TransactionSchema.methods.validateAmount = async function () {
    if (this.amount <= 0) {
        throw new Error('Transaction amount must be greater than zero.');
    }
};

// Add static method to find transactions by account number
TransactionSchema.statics.findByAccountNumber = async function (accountNumber) {
    return await this.find({
        accountNumber
    });
};


module.exports = mongoose.model('Transaction', TransactionSchema);