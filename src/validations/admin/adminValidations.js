const Joi = require('joi');
const {
    ACCOUNT_NUMBER_LENGTH,
    ACCOUNT_TYPES,
    ACCOUNT_STATUS,
    ACCOUNT_BALANCE_RANGE,
} = require('../rules/database/accountRules');

const { 
    EMPLOYEE_ID_LENGTH,
    EMPLOYEE_ID_REGEX,
    ADMIN_PASSWORD,
    ADMIN_ROLES,
    ADMIN_SECURITY_STATUSES,
    ADMIN_ALLOWED_EMAIL_TLDS
} = require('../rules/database/adminRules');

const {
    USER_FIRSTNAME,
    USER_LASTNAME,
    USER_NATIONAL_ID_LENGTH,
    USER_GENDERS,
    USER_ALLOWED_EMAIL_TLDS,
    USER_PHONE_NUMBER_LENGTH,
    USER_ADDRESS,
    USER_SECURITY_STATUSES,
} = require('../rules/database/userRules');

module.exports = {
    createUserAccountSchema: Joi.object({
        accountType: Joi.string().valid(...ACCOUNT_TYPES).required(),
        balance: Joi.number().positive().min(ACCOUNT_BALANCE_RANGE.min).max(ACCOUNT_BALANCE_RANGE.max).required(),
        accountHolderId: Joi.string().length(24).required(),
        createdBy: Joi.string().length(24).required(),
    }),
    updateUserDataSchema: Joi.object({
        accountNumber: Joi.string().length(ACCOUNT_NUMBER_LENGTH).required(),
        firstName: Joi.string().min(USER_FIRSTNAME.min).max(USER_FIRSTNAME.max).pattern(new RegExp(USER_FIRSTNAME.regex)).optional(),
        lastName: Joi.string().min(USER_LASTNAME.min).max(USER_LASTNAME.max).pattern(new RegExp(USER_LASTNAME.regex)).optional(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: USER_ALLOWED_EMAIL_TLDS } }).optional(),
        tempPasswordRequest: Joi.bool().optional(),
        nationalId: Joi.string().length(USER_NATIONAL_ID_LENGTH).optional(),
        gender: Joi.string().valid(...USER_GENDERS).optional(),
        address: Joi.string().min(USER_ADDRESS.min).max(USER_ADDRESS.max).optional(),
        secondAddress: Joi.string().min(USER_ADDRESS.min).max(USER_ADDRESS.max).optional(),
        phoneNumber: Joi.string().length(USER_PHONE_NUMBER_LENGTH).optional(),
        dateOfBirth: Joi.date().iso().optional(),
        status: Joi.string().valid(...USER_SECURITY_STATUSES).optional()
    })
    .or(
        'firstName',
        'lastName',
        'email',
        'tempPasswordRequest',
        'nationalId',
        'gender',
        'address',
        'secondAddress',
        'phoneNumber',
        'dateOfBirth',
        'status',
    ),
    updateUserAccountSchema: Joi.object({
        accountNumber: Joi.string().length(ACCOUNT_NUMBER_LENGTH).required(),
        accountHolderId: Joi.string().length(24).optional(),
        status: Joi.string().valid(...ACCOUNT_STATUS.values).optional(),
        accountType: Joi.string().valid(...ACCOUNT_TYPES).optional(),
        balance: Joi.number().min(0).max(ACCOUNT_BALANCE_RANGE.max).optional(),
        updatedBy: Joi.string().length(24).required(),
    }),
    createAdminSchema: Joi.object({
        employeeId: Joi.string().pattern(new RegExp(EMPLOYEE_ID_REGEX)).length(EMPLOYEE_ID_LENGTH).required(),
        password: Joi.string().min(ADMIN_PASSWORD.min).max(ADMIN_PASSWORD.max).required(),
        repeat_password: Joi.string().valid(Joi.ref('password')).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ADMIN_ALLOWED_EMAIL_TLDS } }).required(),
        role: Joi.string().valid(...ADMIN_ROLES.values).optional(),
    }),
    updateAdminAccountSchema: Joi.object({
        employeeId: Joi.string().pattern(new RegExp(EMPLOYEE_ID_REGEX)).length(EMPLOYEE_ID_LENGTH).required(),
        password: Joi.string().min(ADMIN_PASSWORD.min).max(ADMIN_PASSWORD.max).optional(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ADMIN_ALLOWED_EMAIL_TLDS } }).optional(),
        role: Joi.string().valid(...ADMIN_ROLES.values).optional(),
        status: Joi.string().valid(...ADMIN_SECURITY_STATUSES).optional()
    })
    .or(
        'password',
        'email',
        'role',
        'status'
    ),
    adminLoginSchema: Joi.object({
        employeeId: Joi.string().pattern(new RegExp(EMPLOYEE_ID_REGEX)).length(EMPLOYEE_ID_LENGTH).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ADMIN_ALLOWED_EMAIL_TLDS } }).required(),
        password: Joi.string().min(ADMIN_PASSWORD.min).max(ADMIN_PASSWORD.max).required()
    })
}