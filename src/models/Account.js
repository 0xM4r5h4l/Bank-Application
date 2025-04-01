const mongoose = require('mongoose');
const accountRules  = require('../validations/rules/database/accountRules');

const AccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: [true, 'accountNumber is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return v.length == accountRules.ACCOUNT_NUMBER_LENGTH;
            },
            message: `accountNumber length must be ${accountRules.ACCOUNT_NUMBER_LENGTH}`
        },
        index: true
    },
    accountHolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'accountHolderId is required']
    },
    accountType: {
        type: String,
        enum: { 
            values: accountRules.ACCOUNT_TYPES,
            message: '{VALUE} is not a valid account type',
        },
        required: [true, 'accountType is required']
    },
    balance: {
        type: Number,
        required: [true, 'balance is required'],
        min: [accountRules.ACCOUNT_BALANCE_RANGE.min, 'Balance is below the minimum allowed value'],
        max: [accountRules.ACCOUNT_BALANCE_RANGE.max, 'Balance exceeds the maximum allowed value']
    },
    status: {
        type: String,
        enum: accountRules.ACCOUNT_STATUS.values,
        default: accountRules.ACCOUNT_STATUS.default,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: [true, 'createdBy is required']
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
}, {
    timestamps: true
});

AccountSchema.statics.getAccountsByUserId = async function(userId) {
    try {
        const accounts = await this.find({ accountHolderId: userId });
        if (accounts.length === 0) return null;
        return accounts;
    } catch (error) {
        throw new Error('Error fetching accounts by user ID: ' + error.message);
    }
};

AccountSchema.statics.checkAccountExists = async function(accountNumber) {
    try {
        const account = await this.findOne({ accountNumber });
        return account ? true : false;
    } catch(error){
        throw new Error('Error fetching account by account number: ' + error.message);
    }
}

AccountSchema.statics.checkAccountBalance = async function(accountNumber) {
    const account = await this.findOne({ accountNumber: accountNumber }).select('balance');
    if (!account) return null;

    const balance = account.balance;
    return balance;
}

AccountSchema.statics.accountWithdraw = async function(accountNumber, amount) {
    const result = await this.findOneAndUpdate(
        {
            accountNumber,
            balance: { $gte: amount }, // Ensure sufficient balance
        },
        { $inc: { balance: -amount } },
        { new: true }
    );

    if (!result) {
        throw new Error('WITHDRAW_FAILED_INSUFFICIENT_BALANCE');
    } 

    return result;
}

AccountSchema.statics.accountDeposit = async function(accountNumber, amount) {
    const result = await this.findOneAndUpdate(
        {
            accountNumber,
            balance: { $lte: accountRules.ACCOUNT_BALANCE_RANGE.max - amount },
        },
        { $inc: { balance: amount } },
        { new: true }
    );
    
    if (!result) {
        const accountExists = await this.exists({ accountNumber });
        if (!accountExists){
            throw new Error('DEPOSIT_FAILED_ACCOUNT_NOT_FOUND');
        } else {
            throw new Error('DEPOSIT_FAILED_MAX_BALANCE_EXCEEDED');
        }
    }

    return result;
}

module.exports = mongoose.model('Account', AccountSchema);