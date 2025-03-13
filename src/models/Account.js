const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: [true, 'accountNumber is required'],
        unique: true,
        trim: true
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
        min: [process.env.MINIMUM_ACCOUNT_BALANCE, 'Balance is below the minimum allowed value'],
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
        if (accounts.length === 0) {
            return null;
        }
        return accounts;
    } catch (error) {
        throw new Error('Error fetching accounts by user ID: ' + error.message);
    }
};

AccountSchema.statics.checkAccountExists = async function(accountNumber) {
    try {
        const account = await this.find({ accountNumber });
        return account ? true : false;
    } catch(error){
        throw new Error('Error fetching account by account number: ' + error.message);
    }
}

AccountSchema.statics.checkAccountBalance = async function(accountNumber) {
    const account = await this.findOne({ accountNumber: accountNumber }).select('balance');
    if (!account) {
        return null;
    }
    const balance = account.balance;
    return balance;

}

AccountSchema.statics.accountWithdraw = async function(accountNumber, amount) {
    try {
        const account = await this.findOne({ accountNumber }).select('balance');
        if (!account) {
            throw new Error('Account not found');
        }
        if (account.balance < amount) {
            throw new Error('Insufficient funds');
        }
        console.log('account.balance: ', account.balance);
        account.balance -= amount;
        await account.save();

        return true;
    } catch (error) {
        console.log('Accounts.js:accountWithdraw: Error depositing to account: ', error.message);
        return false;
    }
}

AccountSchema.statics.accountDeposit = async function(accountNumber, amount) {
    try {
        const account = await this.findOne({ accountNumber }).select('balance');
        if (!account) {
            throw new Error('Account not found');
        }
        if ((account.balance + amount ) > process.env.MAXIMUM_ACCOUNT_BALANCE) {
            throw new Error('Deposit amount exceeds the maximum allowed balance');
        }

        account.balance += amount;
        await account.save();
        return true
    } catch (error) {
        console.log('Accounts.js:accountDeposit: Error depositing to account: ', error.message);
        return false;
    }
}

module.exports = mongoose.model('Account', AccountSchema);