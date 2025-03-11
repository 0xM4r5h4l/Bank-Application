const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        ref: 'Account',
        required: [true, 'Account number is required']
    },
    transactionType: {
        type: String,
        enum: {
            values: ['deposit', 'withdrawal', 'transfer'],
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
            values: ['pending', 'completed', 'failed'],
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
    return this.find({
        accountNumber
    });
};


module.exports = mongoose.model('Transaction', transactionSchema);