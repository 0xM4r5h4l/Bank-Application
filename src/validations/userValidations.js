const Joi = require('joi');

const { db: config } = require('../config');

const rules = {
    userRegisterSchema: Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        email: Joi.string().email({ minDomainSegments: 2 }).required(),
        password: Joi.string().min(config.user.USER_MIN_PASSWORD).max(config.user.USER_MAX_PASSWORD).required(),
        nationalId: Joi.string().length(14).required(),
        gender: Joi.string().min(4).valid(...config.user.USER_GENDERS).max(6).required(),
        address: Joi.string().min(5).max(160).required(),
        secondAddress: Joi.string().min(5).max(160).optional(),
        phoneNumber: Joi.string().length(13).required(),
        dateOfBirth: Joi.date().iso().required(),
    }),
    userLoginSchema: Joi.object({
        email: Joi.string().email({ minDomainSegments: 2 }).required(),
        password: Joi.string().min(config.user.USER_MIN_PASSWORD).max(config.user.USER_MAX_PASSWORD).required()
    }),
    getAccountBalanceSchema: Joi.object({
        accountNumber: Joi.string().length(config.account.ACCOUNT_NUMBER_LENGTH).required()
    }),
    createTransferSchema: Joi.object({
        accountNumber: Joi.string().length(config.account.ACCOUNT_NUMBER_LENGTH).required(),
        toAccount: Joi.string().length(config.account.ACCOUNT_NUMBER_LENGTH).required(),
        amount: Joi.number().min(config.transaction.MINIMUM_TRANSFER_VALUE).max(config.transaction.MAXIMUM_TRANSFER_VALUE).positive().required(),
        description: Joi.string().max(25).optional()
    })
    
}

module.exports = rules;