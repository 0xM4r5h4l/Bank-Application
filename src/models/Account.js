const mongoose = require('mongoose');
const { MAXIMUM_ACCOUNT_BALANCE } = process.env;

const AccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: [true, 'accountNumber is required'],
        unique: true,
        trim: true,
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
            values: ['Savings', 'Checking'],
            message: '{VALUE} is not a valid account type',
        },
        required: [true, 'accountType is required']
    },
    balance: {
        type: Number,
        required: [true, 'balance is required'],
        min: [0, 'Balance is below the minimum allowed value'],
        max: [process.env.MAXIMUM_ACCOUNT_BALANCE, 'Balance exceeds the maximum allowed value']
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Closed'],
        default: 'Active'
    }
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

AccountSchema.statics.accountWithdraw = async function(accountNumber, amount, session = null) {
    const result = await this.findOneAndUpdate(
        {
            accountNumber,
            balance: { $gte: amount }, // Ensure sufficient balance
        },
        { $inc: { balance: -amount } },
        { new: true, session }
    );

    if (!result) {
        throw new Error('WITHDRAW_FAILED_INSUFFICIENT_BALANCE');
    } 

    return result;
}

AccountSchema.statics.accountDeposit = async function(accountNumber, amount, session = null) {
    const result = await this.findOneAndUpdate(
        {
            accountNumber,
            balance: { $lte: MAXIMUM_ACCOUNT_BALANCE - amount },
        },
        { $inc: { balance: amount } },
        { new: true , session } // Pass session for transactions
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