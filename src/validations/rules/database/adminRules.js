// Admin Model Rules
module.exports = {
    EMPLOYEE_ID_LENGTH: 16,
    EMPLOYEE_ID_REGEX: /^[A-Z0-9]{16}$/,
    ADMIN_ROLES: { default: 'admin', values: ['admin', 'superadmin']},
    ADMIN_PASSWORD: { min: 12, max: 128 },
    ADMIN_ALLOWED_EMAIL_TLDS: ['com', 'net'],
}