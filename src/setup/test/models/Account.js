const mongoose = require('mongoose');
const accountRules  = require('../../../validations/rules/database/accountRules');

const AccountSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
    },
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
}, {
    timestamps: true,
    autoIndex: false
});

module.exports = mongoose.model('Account', AccountSchema);