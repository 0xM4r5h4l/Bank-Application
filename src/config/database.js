// Database Config

// Account Model
const account = {
    ACCOUNT_NUMBER_LENGTH: 16,
    MINIMUM_ACCOUNT_BALANCE: 1000,
    MAXIMUM_ACCOUNT_BALANCE: 50000000,
    ACCOUNT_TYPES: ['Savings', 'Checking'],
    ACCOUNT_STATUS: ['Active', 'Inactive', 'Closed'],
    DEFAULT_ACCOUNT_STATUS: 'Active'
}

// Admin Model
const admin = {
    EMPLOYEE_ID_LENGTH: 16,
    EMPLOYEE_ID_REGEX: new RegExp(`^[A-Z0-9]{${16}}$`),
    ADMIN_ROLES: ['admin', 'superadmin'],
    ADMIN_MIN_PASSWORD: 12,
    ADMIN_MAX_PASSWORD: 128
}

// Transaction Model
const transaction = {
    TRANSACTION_TYPES: ['deposit', 'withdrawal', 'transfer'],
    TRANSACTION_STATUSES: ['pending', 'completed', 'failed'],
    MINIMUM_TRANSFER_VALUE: 1,
    MAXIMUM_TRANSFER_VALUE: 50000000
}

// User Model
const user = {
    MINIMUM_USER_AGE: 21,
    USER_GENDERS: ['male', 'female'],
    USER_MIN_PASSWORD: 12,
    USER_MAX_PASSWORD: 128,
    USER_SECURITY_STATUSES: ['pending', 'active', 'suspended', 'locked'],
}

module.exports = {
    account,
    admin,
    transaction,
    user
}