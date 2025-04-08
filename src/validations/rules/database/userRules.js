// User Model Rules
module.exports = {
    USER_FIRSTNAME: { min: 2, max: 50, regex: /^[A-Za-z-\s']+$/ },
    USER_LASTNAME: { min: 2, max: 50, regex: /^[A-Za-z-\s']+$/ },
    USER_GENDERS: ['male', 'female'],
    USER_AGE: { min: 21, max: 120 },
    USER_NATIONAL_ID_LENGTH: 14,
    USER_PHONE_NUMBER_LENGTH: 13,
    USER_ADDRESS: { min: 5, max: 160 },
    USER_ALLOWED_EMAIL_TLDS: ['com', 'net', 'org', 'edu', 'gov', 'co'],
    USER_PASSWORD: { min: 8, max: 128 },
    USER_MAX_LOGIN_ATTEMPTS: 4,
    USER_SECURITY_STATUSES: ['pending', 'active', 'suspended', 'locked', 'disabled'],
}