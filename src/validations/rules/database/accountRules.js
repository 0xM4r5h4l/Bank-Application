// Account Model Rules
module.exports = {
    ACCOUNT_NUMBER_LENGTH: 16,
    ACCOUNT_NUMBER_PREFIXES: ['913', '712', '511', '310', '109'],
    ACCOUNT_NUMBER_GENERATION_MAX_RETRIES: 5,
    ACCOUNT_BALANCE_RANGE: { min: 0, max: 50000000 },
    ACCOUNT_TYPES: ['Savings', 'Checking'],
    ACCOUNT_STATUS: { default: 'Active', values: ['Active', 'Inactive', 'Closed']},
    ACCOUNT_DEFAULT_LOCK_DURATION: 10000
}