// Transaction Model Rules
module.exports = {
    TRANSACTION_TYPES: ['deposit', 'withdrawal', 'transfer'],
    TRANSACTION_STATUSES: ['pending', 'successful', 'failed'],
    TRANSFER_VALUE_RANGE: { min: 1, max: 50000000 },
    TRANSFER_DESCRIPTION: { min: 0, max: 25 },
}