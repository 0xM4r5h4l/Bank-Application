// Transaction Model Rules
module.exports = {
    TRANSACTION_TYPES: ['deposit', 'withdrawal', 'transfer'],
    TRANSACTION_STATUSES: ['pending', 'successful', 'failed'],
    TRANSFER_VALUE_RANGE: { min: 1, max: 50000000 },
    TRANSFER_DESCRIPTION: { min: 0, max: 25 },
    DEPOSIT_RULES: { min: 20, max: 10000, dailyLimit: 500000 },
    WITHDRAW_RULES: { min: 10, max: 5000, dailyLimit: 100000 },
    TRANSFER_RULES: { min: 5, max: 40000, dailyLimit: 500000 }, 
}