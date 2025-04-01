const Joi = require('joi');
const { ACCOUNT_NUMBER_LENGTH } = require('../rules/database/accountRules');
const { TRANSFER_VALUE_RANGE, TRANSFER_DESCRIPTION } = require('../rules/database/transactionRules');
const {
    USER_FIRSTNAME,
    USER_LASTNAME,
    USER_NATIONAL_ID_LENGTH,
    USER_GENDERS,
    USER_ALLOWED_EMAIL_TLDS,
    USER_PHONE_NUMBER_LENGTH,
    USER_ADDRESS,
    USER_PASSWORD
} = require('../rules/database/userRules');


module.exports = {
    userRegisterSchema: Joi.object({
        firstName: Joi.string().min(USER_FIRSTNAME.min).max(USER_FIRSTNAME.max).pattern(new RegExp(USER_FIRSTNAME.regex)).required(),
        lastName: Joi.string().min(USER_LASTNAME.min).max(USER_LASTNAME.max).pattern(new RegExp(USER_FIRSTNAME.regex)).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: USER_ALLOWED_EMAIL_TLDS } }).required(),
        password: Joi.string().min(USER_PASSWORD.min).max(USER_PASSWORD.max).required(),
        repeat_password: Joi.string().valid(Joi.ref('password')).required(),
        nationalId: Joi.string().length(USER_NATIONAL_ID_LENGTH).required(),
        gender: Joi.string().valid(...USER_GENDERS).required(),
        address: Joi.string().min(USER_ADDRESS.min).max(USER_ADDRESS.max).required(),
        secondAddress: Joi.string().min(USER_ADDRESS.min).max(USER_ADDRESS.max).optional(),
        phoneNumber: Joi.string().length(USER_PHONE_NUMBER_LENGTH).required(),
        dateOfBirth: Joi.date().iso().required(),
    }),
    userLoginSchema: Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: USER_ALLOWED_EMAIL_TLDS } }).required(),
        password: Joi.string().min(USER_PASSWORD.min).max(USER_PASSWORD.max).required()
    }),
    getAccountBalanceSchema: Joi.object({
        accountNumber: Joi.string().length(ACCOUNT_NUMBER_LENGTH).required()
    }),
    createTransferSchema: Joi.object({
        accountNumber: Joi.string().length(ACCOUNT_NUMBER_LENGTH).required(),
        toAccount: Joi.string().length(ACCOUNT_NUMBER_LENGTH).required(),
        amount: Joi.number().min(TRANSFER_VALUE_RANGE.min).max(TRANSFER_VALUE_RANGE.min).positive().required(),
        description: Joi.string().min(TRANSFER_DESCRIPTION.min).max(TRANSFER_DESCRIPTION.max).optional()
    })
    
}